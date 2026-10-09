/**
 * Digital Azadi Support - Operations & SLA Command Dashboard (Portal 2)
 * Linear / Stripe Dashboard inspired engine
 * Features:
 *  - Ctrl + K global search shortcut
 *  - Dual View Modes: Table View & Kanban Board View
 *  - Real-time IST elapsed stopwatch tickers
 *  - Micro-interactions & Toast Notifications
 *  - Concurrency & Zero Duplicate Google Sheets Sync
 */

document.addEventListener("DOMContentLoaded", () => {
  // Global State
  let tickets = [];
  let filteredTickets = [];
  let currentStatusFilter = "all";
  let currentViewMode = "table"; // 'table' or 'kanban'
  let autoSyncTimer = null;
  let runningTicketTimers = {}; // Ticket ID -> interval

  // DOM Elements
  const authModal = document.getElementById("authModal");
  const authForm = document.getElementById("authForm");
  const adminPinInput = document.getElementById("adminPinInput");
  const authError = document.getElementById("authError");
  const togglePinBtn = document.getElementById("togglePinVisibility");
  const dashboardApp = document.getElementById("dashboardApp");
  const logoutBtn = document.getElementById("logoutBtn");

  const adminLiveClock = document.getElementById("adminLiveClock");
  const syncBtn = document.getElementById("syncBtn");
  const syncIcon = document.getElementById("syncIcon");
  const autoSyncSelect = document.getElementById("autoSyncInterval");
  const cloudBanner = document.getElementById("cloudStatusBanner");
  const cloudStatusIcon = document.getElementById("cloudStatusIcon");
  const cloudStatusText = document.getElementById("cloudStatusText");

  // KPI Elements
  const kpiTotalAll = document.getElementById("kpiTotalAll");
  const kpiTotalTodayBadge = document.getElementById("kpiTotalTodayBadge");
  const kpiInProgress = document.getElementById("kpiInProgress");
  const kpiDone = document.getElementById("kpiDone");
  const kpiResolutionRate = document.getElementById("kpiResolutionRate");
  const kpiAvgTime = document.getElementById("kpiAvgTime");
  const kpiAvgHuman = document.getElementById("kpiAvgHuman");

  // Search & Filter Elements
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const statusTabBtns = document.querySelectorAll(".status-tab-btn");
  const tabCountAll = document.getElementById("tabCountAll");
  const tabCountInProgress = document.getElementById("tabCountInProgress");
  const tabCountDone = document.getElementById("tabCountDone");
  const filterDateRange = document.getElementById("filterDateRange");
  const filterPlatform = document.getElementById("filterPlatform");
  const filterCategory = document.getElementById("filterCategory");
  const filterMembership = document.getElementById("filterMembership");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");

  // View Mode Buttons & Containers
  const viewModeTableBtn = document.getElementById("viewModeTableBtn");
  const viewModeKanbanBtn = document.getElementById("viewModeKanbanBtn");
  const tableViewContainer = document.getElementById("tableViewContainer");
  const kanbanViewContainer = document.getElementById("kanbanViewContainer");
  const kanbanColumnInProgress = document.getElementById("kanbanColumnInProgress");
  const kanbanColumnDone = document.getElementById("kanbanColumnDone");
  const kanbanCountInProgress = document.getElementById("kanbanCountInProgress");
  const kanbanCountDone = document.getElementById("kanbanCountDone");

  // Table Elements
  const tableLoading = document.getElementById("tableLoading");
  const tableEmpty = document.getElementById("tableEmpty");
  const ticketsTableBody = document.getElementById("ticketsTableBody");
  const filteredCountBadge = document.getElementById("filteredCountBadge");

  // Resolve Modal Elements
  const resolveModal = document.getElementById("resolveModal");
  const resolveModalTicketId = document.getElementById("resolveModalTicketId");
  const resolveForm = document.getElementById("resolveForm");
  const resolveStartTime = document.getElementById("resolveStartTime");
  const resolveEndTime = document.getElementById("resolveEndTime");
  const resolveTotalTime = document.getElementById("resolveTotalTime");
  const resolveRemarks = document.getElementById("resolveRemarks");
  const closeResolveModalBtn = document.getElementById("closeResolveModalBtn");
  const cancelResolveBtn = document.getElementById("cancelResolveBtn");

  // Manual Edit Modal Elements
  const manualEditModal = document.getElementById("manualEditModal");
  const manualEditTicketId = document.getElementById("manualEditTicketId");
  const manualEditForm = document.getElementById("manualEditForm");
  const editStatus = document.getElementById("editStatus");
  const editStartTime = document.getElementById("editStartTime");
  const editEndTime = document.getElementById("editEndTime");
  const editTotalDuration = document.getElementById("editTotalDuration");
  const editRemarks = document.getElementById("editRemarks");
  const closeManualEditBtn = document.getElementById("closeManualEditBtn");
  const cancelManualEditBtn = document.getElementById("cancelManualEditBtn");

  // Details Modal Elements
  const detailsModal = document.getElementById("detailsModal");
  const detailsTicketId = document.getElementById("detailsTicketId");
  const detailsName = document.getElementById("detailsName");
  const detailsContact = document.getElementById("detailsContact");
  const detailsClassification = document.getElementById("detailsClassification");
  const detailsQuery = document.getElementById("detailsQuery");
  const detailsRemarks = document.getElementById("detailsRemarks");
  const detailsWhatsAppBtn = document.getElementById("detailsWhatsAppBtn");
  const closeDetailsModalBtn = document.getElementById("closeDetailsModalBtn");
  const closeDetailsBtnBottom = document.getElementById("closeDetailsBtnBottom");

  // Settings Modal Elements
  const settingsModal = document.getElementById("settingsModal");
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  const bannerConfigLink = document.getElementById("bannerConfigLink");
  const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn");
  const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const webAppUrlInput = document.getElementById("webAppUrlInput");
  const customPinInput = document.getElementById("customPinInput");
  const testConnectionBtn = document.getElementById("testConnectionBtn");
  const testConnResult = document.getElementById("testConnResult");

  let activeResolvingTicketId = null;
  let activeEditingTicketId = null;

  // ============================================================================
  // TOAST NOTIFICATIONS (Linear / Stripe Style)
  // ============================================================================
  function showToast(message, icon = "fa-check", isSuccess = true) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <i class="fa-solid ${icon} ${isSuccess ? 'text-emerald-400' : 'text-amber-400'}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ============================================================================
  // 1. AUTHENTICATION LOGIC
  // ============================================================================
  function getExpectedPin() {
    return localStorage.getItem(CONFIG.KEYS.CUSTOM_PIN) || CONFIG.DEFAULT_ADMIN_PIN;
  }

  function checkAuth() {
    const isAuthed = sessionStorage.getItem(CONFIG.KEYS.ADMIN_AUTH) === "true";
    if (isAuthed) {
      authModal.classList.add("hidden");
      dashboardApp.classList.remove("hidden");
      initDashboard();
    } else {
      authModal.classList.remove("hidden");
      dashboardApp.classList.add("hidden");
      adminPinInput.focus();
    }
  }

  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const enteredPin = adminPinInput.value.trim();
    if (enteredPin === getExpectedPin()) {
      sessionStorage.setItem(CONFIG.KEYS.ADMIN_AUTH, "true");
      authError.classList.add("hidden");
      authModal.classList.add("hidden");
      dashboardApp.classList.remove("hidden");
      showToast("Access Granted — Welcome to Ops Command Deck", "fa-lock-open");
      initDashboard();
    } else {
      authError.textContent = "Invalid PIN. Please try again.";
      authError.classList.remove("hidden");
      adminPinInput.select();
    }
  });

  if (togglePinBtn) {
    togglePinBtn.addEventListener("click", () => {
      const isPwd = adminPinInput.type === "password";
      adminPinInput.type = isPwd ? "text" : "password";
      togglePinBtn.innerHTML = isPwd ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    });
  }

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(CONFIG.KEYS.ADMIN_AUTH);
    clearInterval(autoSyncTimer);
    clearAllRunningTimers();
    checkAuth();
  });

  // ============================================================================
  // 2. DASHBOARD INITIALIZATION & LIVE CLOCK
  // ============================================================================
  function updateClock() {
    if (adminLiveClock) {
      adminLiveClock.textContent = TimeCalculator.formatISTTime();
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Keyboard shortcut Ctrl + K (or Cmd + K)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  function checkCloudStatus() {
    if (ApiService.isLiveConfigured()) {
      cloudStatusIcon.className = "fa-solid fa-circle text-[9px] text-emerald-500";
      cloudStatusText.innerHTML = `Connected to Google Apps Script Cloud Webhook &bull; Sheet: <code class="font-mono bg-white/60 px-1 py-0.5 rounded text-[11px] font-bold">${CONFIG.SPREADSHEET_ID.substring(0, 10)}...</code>`;
      cloudBanner.className = "bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900";
    } else {
      cloudStatusIcon.className = "fa-solid fa-circle text-[9px] text-amber-500";
      cloudStatusText.innerHTML = `Offline / Demo Mode active &bull; Connect your Google Sheet Apps Script URL for live sync.`;
      cloudBanner.className = "bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-900";
    }
  }

  async function initDashboard() {
    checkCloudStatus();
    await fetchTicketsData();
    setupAutoSync();
  }

  // ============================================================================
  // 3. DATA FETCHING & SYNCHRONIZATION
  // ============================================================================
  async function fetchTicketsData(silent = false) {
    if (!silent) {
      tableLoading.classList.remove("hidden");
      tableViewContainer.classList.add("hidden");
      kanbanViewContainer.classList.add("hidden");
      tableEmpty.classList.add("hidden");
      syncIcon.classList.add("fa-spin");
    }

    try {
      tickets = await ApiService.getTickets();
      applyFilters();
      updateKPICards();
      if (silent) {
        // Subtle toast on auto-sync update
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      showToast("Sync Error: " + err.message, "fa-circle-exclamation", false);
    } finally {
      tableLoading.classList.add("hidden");
      syncIcon.classList.remove("fa-spin");
    }
  }

  syncBtn.addEventListener("click", () => {
    fetchTicketsData(false);
    showToast("Synchronizing with Google Sheet...", "fa-rotate");
  });

  function setupAutoSync() {
    clearInterval(autoSyncTimer);
    const interval = parseInt(autoSyncSelect.value, 10);
    if (interval > 0) {
      autoSyncTimer = setInterval(() => {
        fetchTicketsData(true);
      }, interval);
    }
  }

  autoSyncSelect.addEventListener("change", () => {
    setupAutoSync();
    showToast(`Auto-sync set to ${autoSyncSelect.options[autoSyncSelect.selectedIndex].text}`, "fa-sliders");
  });

  // ============================================================================
  // 4. TOP KPI METRICS CALCULATION
  // ============================================================================
  function updateKPICards() {
    const todayStr = TimeCalculator.formatISTDate();
    const totalCount = tickets.length;
    
    // Count today's raised tickets
    const todayCount = tickets.filter(t => t.submissionDate === todayStr).length;

    // In Progress vs Done
    const inProgressCount = tickets.filter(t => t.currentStatus === "In Progress").length;
    const doneCount = tickets.filter(t => t.currentStatus === "Done").length;

    // Resolution rate
    const resRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    // Average resolution time
    let totalMinutes = 0;
    let timedTicketsCount = 0;

    tickets.forEach(t => {
      if (t.currentStatus === "Done" && t.totalTimeTaken && t.totalTimeTaken.includes(":")) {
        const parts = t.totalTimeTaken.split(":");
        const mins = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
        if (!isNaN(mins) && mins > 0) {
          totalMinutes += mins;
          timedTicketsCount++;
        }
      }
    });

    const avgMins = timedTicketsCount > 0 ? Math.round(totalMinutes / timedTicketsCount) : 0;
    const avgHH = Math.floor(avgMins / 60);
    const avgMM = avgMins % 60;
    const avgTimeStr = timedTicketsCount > 0 
      ? `${String(avgHH).padStart(2, '0')}:${String(avgMM).padStart(2, '0')}` 
      : "--:--";

    // Update DOM Figures
    kpiTotalAll.textContent = totalCount;
    kpiTotalTodayBadge.textContent = `${todayCount} today`;
    kpiInProgress.textContent = inProgressCount;
    kpiDone.textContent = doneCount;
    kpiResolutionRate.textContent = `${resRate}%`;
    kpiAvgTime.textContent = avgTimeStr;
    kpiAvgHuman.textContent = timedTicketsCount > 0 ? TimeCalculator.formatHumanDuration(avgMins) : "No data yet";

    // Update Tab Counters
    tabCountAll.textContent = totalCount;
    tabCountInProgress.textContent = inProgressCount;
    tabCountDone.textContent = doneCount;

    // Kanban header counters
    if (kanbanCountInProgress) kanbanCountInProgress.textContent = inProgressCount;
    if (kanbanCountDone) kanbanCountDone.textContent = doneCount;
  }

  // ============================================================================
  // 5. SEARCH & FILTERING ENGINE
  // ============================================================================
  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const dateRange = filterDateRange.value;
    const platform = filterPlatform.value;
    const category = filterCategory.value;
    const membership = filterMembership.value;

    const todayIST = TimeCalculator.formatISTDate();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayIST = TimeCalculator.formatISTDate(yesterdayDate);

    filteredTickets = tickets.filter(t => {
      // 1. Search Query
      if (query) {
        const matchId = (t.ticketId || "").toLowerCase().includes(query);
        const matchName = (t.fullName || "").toLowerCase().includes(query);
        const matchMobile = (t.mobileNumber || "").toLowerCase().includes(query);
        if (!matchId && !matchName && !matchMobile) return false;
      }

      // 2. Status Tab Filter
      if (currentStatusFilter !== "all" && t.currentStatus !== currentStatusFilter) {
        return false;
      }

      // 3. Date Range Filter
      if (dateRange === "today" && t.submissionDate !== todayIST) {
        return false;
      }
      if (dateRange === "yesterday" && t.submissionDate !== yesterdayIST) {
        return false;
      }

      // 4. Platform Filter
      if (platform !== "all" && t.platform !== platform) {
        return false;
      }

      // 5. Category Filter
      if (category !== "all" && t.userCategory !== category) {
        return false;
      }

      // 6. Membership Filter
      if (membership !== "all" && t.membershipType !== membership) {
        return false;
      }

      return true;
    });

    renderCurrentView();
  }

  searchInput.addEventListener("input", () => {
    clearSearchBtn.classList.toggle("hidden", !searchInput.value);
    applyFilters();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    applyFilters();
    searchInput.focus();
  });

  // Status Tab Listeners
  statusTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      statusTabBtns.forEach(b => {
        b.classList.remove("active", "bg-obsidian", "text-white");
        b.classList.add("bg-slate-100", "text-slate-700");
      });
      btn.classList.add("active", "bg-obsidian", "text-white");
      btn.classList.remove("bg-slate-100", "text-slate-700");

      currentStatusFilter = btn.getAttribute("data-status");
      applyFilters();
    });
  });

  // Filter Dropdowns
  [filterDateRange, filterPlatform, filterCategory, filterMembership].forEach(el => {
    el.addEventListener("change", applyFilters);
  });

  // Reset Filters
  resetFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    filterDateRange.value = "all";
    filterPlatform.value = "all";
    filterCategory.value = "all";
    filterMembership.value = "all";
    currentStatusFilter = "all";

    statusTabBtns.forEach(b => {
      b.classList.remove("active", "bg-obsidian", "text-white");
      b.classList.add("bg-slate-100", "text-slate-700");
    });
    statusTabBtns[0].classList.add("active", "bg-obsidian", "text-white");
    statusTabBtns[0].classList.remove("bg-slate-100", "text-slate-700");

    applyFilters();
    showToast("Filters reset to default view", "fa-filter-circle-xmark");
  });

  // View Mode Switcher
  viewModeTableBtn.addEventListener("click", () => {
    currentViewMode = "table";
    viewModeTableBtn.classList.add("bg-white", "text-obsidian", "shadow-sm");
    viewModeTableBtn.classList.remove("text-slate-600");
    viewModeKanbanBtn.classList.remove("bg-white", "text-obsidian", "shadow-sm");
    viewModeKanbanBtn.classList.add("text-slate-600");
    renderCurrentView();
  });

  viewModeKanbanBtn.addEventListener("click", () => {
    currentViewMode = "kanban";
    viewModeKanbanBtn.classList.add("bg-white", "text-obsidian", "shadow-sm");
    viewModeKanbanBtn.classList.remove("text-slate-600");
    viewModeTableBtn.classList.remove("bg-white", "text-obsidian", "shadow-sm");
    viewModeTableBtn.classList.add("text-slate-600");
    renderCurrentView();
  });

  // ============================================================================
  // 6. RENDER ENGINE: TABLE & KANBAN
  // ============================================================================
  function clearAllRunningTimers() {
    Object.keys(runningTicketTimers).forEach(id => {
      clearInterval(runningTicketTimers[id]);
    });
    runningTicketTimers = {};
  }

  function renderCurrentView() {
    clearAllRunningTimers();
    filteredCountBadge.textContent = `Showing ${filteredTickets.length} of ${tickets.length} tickets`;

    if (filteredTickets.length === 0) {
      tableViewContainer.classList.add("hidden");
      kanbanViewContainer.classList.add("hidden");
      tableEmpty.classList.remove("hidden");
      return;
    }

    tableEmpty.classList.add("hidden");

    if (currentViewMode === "table") {
      kanbanViewContainer.classList.add("hidden");
      tableViewContainer.classList.remove("hidden");
      renderTableView();
    } else {
      tableViewContainer.classList.add("hidden");
      kanbanViewContainer.classList.remove("hidden");
      renderKanbanView();
    }
  }

  // --- 6.1 TABLE VIEW RENDER ---
  function renderTableView() {
    ticketsTableBody.innerHTML = "";

    filteredTickets.forEach(ticket => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-50/90 transition-colors border-b border-slate-200/70";

      const isInProgress = ticket.currentStatus === "In Progress";
      const hasStartTime = Boolean(ticket.supportStartTime && ticket.supportStartTime.trim());
      const hasEndTime = Boolean(ticket.supportEndTime && ticket.supportEndTime.trim());

      const isDiamond = ticket.membershipType === "Diamond";
      const isFranchise = ticket.userCategory === "Franchise";

      tr.innerHTML = `
        <!-- Col 1: Ticket ID & Time -->
        <td class="py-4 px-5 align-top">
          <div class="font-mono font-black text-obsidian text-xs flex items-center gap-1.5">
            <span>${ticket.ticketId}</span>
            <button 
              type="button" 
              onclick="copyTicketId('${ticket.ticketId}', this)" 
              class="text-slate-400 hover:text-amberBrand p-0.5" 
              title="Copy ID"
            >
              <i class="fa-regular fa-copy text-[11px]"></i>
            </button>
          </div>
          <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <i class="fa-regular fa-clock text-[10px] text-slate-400"></i>
            <span>${ticket.submissionDate} &bull; <strong class="font-mono font-bold text-slate-700">${ticket.submissionTime}</strong></span>
          </div>
        </td>

        <!-- Col 2: Requester Profile -->
        <td class="py-4 px-5 align-top">
          <div class="font-bold text-slate-900 text-xs">${ticket.fullName}</div>
          <div class="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-slate-600">
            <span>+91 ${ticket.mobileNumber}</span>
            <a 
              href="https://wa.me/91${ticket.mobileNumber}?text=${encodeURIComponent(`Hello ${ticket.fullName}, Digital Azadi Support here regarding Ticket ID: ${ticket.ticketId}.`)}" 
              target="_blank" 
              class="text-emerald-600 hover:text-emerald-700 p-0.5" 
              title="Message on WhatsApp"
            >
              <i class="fa-brands fa-whatsapp text-sm"></i>
            </a>
            <a 
              href="tel:${ticket.mobileNumber}" 
              class="text-blue-600 hover:text-blue-700 p-0.5" 
              title="Direct Phone Call"
            >
              <i class="fa-solid fa-phone text-xs"></i>
            </a>
          </div>
          <div class="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5">${ticket.emailAddress || ""}</div>
        </td>

        <!-- Col 3: Platform & Plan -->
        <td class="py-4 px-5 align-top space-y-1.5">
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${ticket.platform === 'Chakravyuh' ? 'bg-orange-100 text-amber-900 border border-orange-200' : 'bg-blue-100 text-blue-900 border border-blue-200'}">
              ${ticket.platform}
            </span>
          </div>
          <div class="flex items-center gap-1 text-[10px]">
            <span class="px-2 py-0.5 rounded font-semibold ${isFranchise ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'}">
              ${ticket.userCategory}
            </span>
            <span class="px-2 py-0.5 rounded font-semibold ${isDiamond ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}">
              ${ticket.membershipType}
            </span>
          </div>
        </td>

        <!-- Col 4: Query Description -->
        <td class="py-4 px-5 align-top">
          <p class="text-xs text-slate-700 line-clamp-2 leading-relaxed" title="${escapeHtml(ticket.queryDescription)}">
            ${escapeHtml(ticket.queryDescription)}
          </p>
          <div class="mt-1.5 flex items-center gap-2">
            <button 
              type="button" 
              onclick="viewTicketDetails('${ticket.ticketId}')" 
              class="text-[11px] text-amberBrand hover:underline font-bold"
            >
              View Full Query &rarr;
            </button>
            ${ticket.remarks ? `<span class="text-[10px] text-slate-400 truncate max-w-[160px]">&bull; Notes: ${escapeHtml(ticket.remarks)}</span>` : ''}
          </div>
        </td>

        <!-- Col 5: Status Badge -->
        <td class="py-4 px-5 align-top">
          ${isInProgress 
            ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold badge-in-progress">
                 <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                 In Progress
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold badge-done">
                 <i class="fa-solid fa-check text-[10px]"></i>
                 Done
               </span>`
          }
        </td>

        <!-- Col 6: Support Timings & Duration -->
        <td class="py-4 px-5 align-top text-xs font-mono">
          ${hasStartTime ? `
            <div class="text-[11px] text-slate-500">Start: <strong class="text-slate-800">${ticket.supportStartTime}</strong></div>
          ` : `
            <div class="text-[11px] text-slate-400 italic">Not started</div>
          `}
          
          ${hasEndTime ? `
            <div class="text-[11px] text-slate-500 mt-0.5">End: <strong class="text-slate-800">${ticket.supportEndTime}</strong></div>
          ` : ''}

          <div class="mt-1.5">
            ${ticket.totalTimeTaken ? `
              <span class="inline-block px-2.5 py-0.5 rounded-md font-black text-[11px] bg-emerald-100 text-emerald-800">
                ⏱ ${ticket.totalTimeTaken}
              </span>
            ` : (isInProgress && hasStartTime ? `
              <span id="liveTimer-${ticket.ticketId}" class="inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-amber-100 text-amber-800 animate-pulse">
                ⏱ Running...
              </span>
            ` : '<span class="text-slate-300">--:--</span>')}
          </div>
        </td>

        <!-- Col 7: Actions -->
        <td class="py-4 px-5 align-top text-right space-y-1">
          <div class="flex items-center justify-end gap-1.5">
            ${isInProgress && !hasStartTime ? `
              <button 
                type="button" 
                onclick="startSupport('${ticket.ticketId}')" 
                class="px-3 py-1.5 bg-amberBrand hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer glow-amber-sm"
                title="Capture exact IST Start Time"
              >
                <i class="fa-solid fa-play text-[10px]"></i>
                <span>Start</span>
              </button>
            ` : ''}

            ${isInProgress ? `
              <button 
                type="button" 
                onclick="openResolveModal('${ticket.ticketId}')" 
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer glow-emerald-sm"
                title="Mark ticket as resolved"
              >
                <i class="fa-solid fa-check text-[10px]"></i>
                <span>Resolve</span>
              </button>
            ` : ''}

            <!-- Manual Override Menu -->
            <button 
              type="button" 
              onclick="openManualEditModal('${ticket.ticketId}')" 
              class="p-2 text-slate-400 hover:text-obsidian hover:bg-slate-100 rounded-xl transition"
              title="Manual Override"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </div>
        </td>
      `;

      ticketsTableBody.appendChild(tr);

      // Start dynamic running ticker if ticket is In Progress and has a start time
      if (isInProgress && hasStartTime && !hasEndTime) {
        startLiveTicketTicker(ticket.ticketId, ticket.supportStartTime);
      }
    });
  }

  // --- 6.2 KANBAN BOARD VIEW RENDER ---
  function renderKanbanView() {
    kanbanColumnInProgress.innerHTML = "";
    kanbanColumnDone.innerHTML = "";

    const inProgressList = filteredTickets.filter(t => t.currentStatus === "In Progress");
    const doneList = filteredTickets.filter(t => t.currentStatus === "Done");

    if (inProgressList.length === 0) {
      kanbanColumnInProgress.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 italic">No tickets in progress</div>`;
    } else {
      inProgressList.forEach(ticket => {
        kanbanColumnInProgress.appendChild(createKanbanCard(ticket, true));
      });
    }

    if (doneList.length === 0) {
      kanbanColumnDone.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 italic">No tickets resolved yet</div>`;
    } else {
      doneList.forEach(ticket => {
        kanbanColumnDone.appendChild(createKanbanCard(ticket, false));
      });
    }
  }

  function createKanbanCard(ticket, isInProgress) {
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3";

    const hasStartTime = Boolean(ticket.supportStartTime && ticket.supportStartTime.trim());
    const hasEndTime = Boolean(ticket.supportEndTime && ticket.supportEndTime.trim());

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-mono font-bold text-xs text-obsidian">${ticket.ticketId}</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${ticket.platform === 'Chakravyuh' ? 'bg-orange-100 text-amber-900' : 'bg-blue-100 text-blue-900'}">
          ${ticket.platform}
        </span>
      </div>

      <div>
        <h5 class="text-xs font-extrabold text-slate-900">${ticket.fullName}</h5>
        <div class="flex items-center gap-2 text-[11px] font-mono text-slate-500 mt-0.5">
          <span>+91 ${ticket.mobileNumber}</span>
          <a href="https://wa.me/91${ticket.mobileNumber}" target="_blank" class="text-emerald-600 hover:text-emerald-700">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>

      <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
        ${escapeHtml(ticket.queryDescription)}
      </p>

      <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div>
          ${ticket.totalTimeTaken ? `
            <span class="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">⏱ ${ticket.totalTimeTaken}</span>
          ` : (isInProgress && hasStartTime ? `
            <span id="kanbanTimer-${ticket.ticketId}" class="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded animate-pulse">⏱ Running...</span>
          ` : `<span class="text-slate-400 font-mono">${ticket.submissionTime}</span>`)}
        </div>

        <div class="flex items-center gap-1.5">
          ${isInProgress && !hasStartTime ? `
            <button onclick="startSupport('${ticket.ticketId}')" class="px-2.5 py-1 bg-amberBrand hover:bg-orange-600 text-white rounded-lg font-bold text-[11px]">
              Start
            </button>
          ` : ''}

          ${isInProgress ? `
            <button onclick="openResolveModal('${ticket.ticketId}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]">
              Resolve
            </button>
          ` : ''}

          <button onclick="viewTicketDetails('${ticket.ticketId}')" class="p-1 text-slate-400 hover:text-obsidian" title="Details">
            <i class="fa-solid fa-up-right-from-square"></i>
          </button>
        </div>
      </div>
    `;

    if (isInProgress && hasStartTime && !hasEndTime) {
      startLiveTicketTicker(ticket.ticketId, ticket.supportStartTime);
    }

    return card;
  }

  function startLiveTicketTicker(ticketId, startTime) {
    const updateTimer = () => {
      const elTable = document.getElementById(`liveTimer-${ticketId}`);
      const elKanban = document.getElementById(`kanbanTimer-${ticketId}`);
      const duration = TimeCalculator.calculateRunningDuration(startTime);
      if (duration.isValid) {
        const text = `⏱ ${duration.formatted} (${duration.minutes}m)`;
        if (elTable) elTable.textContent = text;
        if (elKanban) elKanban.textContent = text;
      }
    };
    updateTimer();
    runningTicketTimers[ticketId] = setInterval(updateTimer, 4000);
  }

  // ============================================================================
  // 7. ACTION HANDLERS: START SUPPORT, MARK AS DONE, OVERRIDE
  // ============================================================================

  // "Start Support" Button Click
  window.startSupport = async function(ticketId) {
    const currentIstTime = TimeCalculator.formatISTTime();
    
    // Optimistic update in UI
    const targetTicket = tickets.find(t => t.ticketId === ticketId);
    if (targetTicket) {
      targetTicket.supportStartTime = currentIstTime;
      targetTicket.lastUpdated = TimeCalculator.formatISTTimestamp();
      applyFilters();
      updateKPICards();
      showToast(`Support started for ${ticketId} at ${currentIstTime} IST`, "fa-play");
    }

    try {
      await ApiService.updateTicket({
        ticketId,
        supportStartTime: currentIstTime
      });
    } catch (err) {
      console.error("Failed to persist Start Support in backend:", err);
      showToast(`Sync error: ${err.message}`, "fa-circle-exclamation", false);
    }
  };

  // "Resolve / Mark as Done" Modal
  window.openResolveModal = function(ticketId) {
    activeResolvingTicketId = ticketId;
    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (!ticket) return;

    const currentIstTime = TimeCalculator.formatISTTime();
    const startTimeVal = ticket.supportStartTime || currentIstTime;

    resolveModalTicketId.textContent = ticket.ticketId;
    resolveStartTime.value = startTimeVal;
    resolveEndTime.value = currentIstTime;
    
    // Calculate initial duration
    const calc = TimeCalculator.calculateDuration(startTimeVal, currentIstTime);
    resolveTotalTime.value = calc.formatted;
    resolveRemarks.value = ticket.remarks || "";

    resolveModal.classList.remove("hidden");
    resolveRemarks.focus();
  };

  // Auto-recalculate duration when agent edits start/end time in resolve modal
  [resolveStartTime, resolveEndTime].forEach(input => {
    input.addEventListener("input", () => {
      const s = resolveStartTime.value.trim();
      const e = resolveEndTime.value.trim();
      const calc = TimeCalculator.calculateDuration(s, e);
      if (calc.isValid) {
        resolveTotalTime.value = calc.formatted;
      }
    });
  });

  resolveForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeResolvingTicketId) return;

    const startTime = resolveStartTime.value.trim();
    const endTime = resolveEndTime.value.trim();
    const totalTime = resolveTotalTime.value.trim();
    const remarks = resolveRemarks.value.trim();

    const resolvedId = activeResolvingTicketId;
    resolveModal.classList.add("hidden");

    // Optimistic update
    const targetTicket = tickets.find(t => t.ticketId === resolvedId);
    if (targetTicket) {
      targetTicket.currentStatus = "Done";
      targetTicket.supportStartTime = startTime;
      targetTicket.supportEndTime = endTime;
      targetTicket.totalTimeTaken = totalTime;
      targetTicket.remarks = remarks;
      targetTicket.lastUpdated = TimeCalculator.formatISTTimestamp();
      applyFilters();
      updateKPICards();
      showToast(`Ticket ${resolvedId} resolved in ${totalTime} min!`, "fa-check-circle");
    }

    try {
      await ApiService.updateTicket({
        ticketId: resolvedId,
        currentStatus: "Done",
        supportStartTime: startTime,
        supportEndTime: endTime,
        totalTimeTaken: totalTime,
        remarks: remarks
      });
    } catch (err) {
      console.error("Failed to mark Done in backend:", err);
      showToast(`Cloud sync error: ${err.message}`, "fa-circle-exclamation", false);
    } finally {
      activeResolvingTicketId = null;
    }
  });

  [closeResolveModalBtn, cancelResolveBtn].forEach(b => {
    b.addEventListener("click", () => {
      resolveModal.classList.add("hidden");
      activeResolvingTicketId = null;
    });
  });

  // Manual Edit Modal
  window.openManualEditModal = function(ticketId) {
    activeEditingTicketId = ticketId;
    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (!ticket) return;

    manualEditTicketId.textContent = ticket.ticketId;
    editStatus.value = ticket.currentStatus;
    editStartTime.value = ticket.supportStartTime || "";
    editEndTime.value = ticket.supportEndTime || "";
    editTotalDuration.value = ticket.totalTimeTaken || "";
    editRemarks.value = ticket.remarks || "";

    manualEditModal.classList.remove("hidden");
  };

  [editStartTime, editEndTime].forEach(input => {
    input.addEventListener("input", () => {
      const s = editStartTime.value.trim();
      const e = editEndTime.value.trim();
      if (s && e) {
        const calc = TimeCalculator.calculateDuration(s, e);
        if (calc.isValid) {
          editTotalDuration.value = calc.formatted;
        }
      }
    });
  });

  manualEditForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeEditingTicketId) return;

    const payload = {
      ticketId: activeEditingTicketId,
      currentStatus: editStatus.value,
      supportStartTime: editStartTime.value.trim(),
      supportEndTime: editEndTime.value.trim(),
      totalTimeTaken: editTotalDuration.value.trim(),
      remarks: editRemarks.value.trim()
    };

    const targetId = activeEditingTicketId;
    manualEditModal.classList.add("hidden");

    // Optimistic update
    const target = tickets.find(t => t.ticketId === targetId);
    if (target) {
      Object.assign(target, payload);
      target.lastUpdated = TimeCalculator.formatISTTimestamp();
      applyFilters();
      updateKPICards();
      showToast(`Updated ticket ${targetId}`, "fa-pen-to-square");
    }

    try {
      await ApiService.updateTicket(payload);
    } catch (err) {
      showToast(`Save error: ${err.message}`, "fa-circle-exclamation", false);
    } finally {
      activeEditingTicketId = null;
    }
  });

  [closeManualEditBtn, cancelManualEditBtn].forEach(b => {
    b.addEventListener("click", () => {
      manualEditModal.classList.add("hidden");
      activeEditingTicketId = null;
    });
  });

  // View Ticket Details Modal
  window.viewTicketDetails = function(ticketId) {
    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (!ticket) return;

    detailsTicketId.textContent = ticket.ticketId;
    detailsName.textContent = ticket.fullName;
    detailsContact.innerHTML = `<span>+91 ${ticket.mobileNumber}</span><br><span class="text-slate-400 font-normal">${ticket.emailAddress}</span>`;
    detailsClassification.innerHTML = `<span class="text-amberBrand font-bold">${ticket.platform}</span> &bull; ${ticket.userCategory} (${ticket.membershipType})`;
    detailsQuery.textContent = ticket.queryDescription;
    detailsRemarks.textContent = ticket.remarks ? ticket.remarks : "No resolution remarks recorded yet.";

    const waMsg = encodeURIComponent(`Hello ${ticket.fullName}, Digital Azadi Support executive here regarding Ticket ID ${ticket.ticketId}.`);
    detailsWhatsAppBtn.href = `https://wa.me/91${ticket.mobileNumber}?text=${waMsg}`;

    detailsModal.classList.remove("hidden");
  };

  [closeDetailsModalBtn, closeDetailsBtnBottom].forEach(b => {
    b.addEventListener("click", () => {
      detailsModal.classList.add("hidden");
    });
  });

  // ============================================================================
  // 8. CSV EXPORT ENGINE
  // ============================================================================
  exportCsvBtn.addEventListener("click", () => {
    if (!filteredTickets || filteredTickets.length === 0) {
      showToast("No tickets available to export", "fa-circle-exclamation", false);
      return;
    }

    const headers = [
      "Ticket ID", "Submission Date", "Submission Time", "Full Name",
      "Mobile Number", "Email Address", "User Category", "Membership Type",
      "Platform", "Query Description", "Current Status", "Support Start Time",
      "Support End Time", "Total Time Taken", "Remarks", "Last Updated"
    ];

    const rows = filteredTickets.map(t => [
      t.ticketId,
      t.submissionDate,
      t.submissionTime,
      `"${(t.fullName || "").replace(/"/g, '""')}"`,
      `"${t.mobileNumber || ""}"`,
      `"${t.emailAddress || ""}"`,
      t.userCategory,
      t.membershipType,
      t.platform,
      `"${(t.queryDescription || "").replace(/"/g, '""')}"`,
      t.currentStatus,
      t.supportStartTime || "",
      t.supportEndTime || "",
      t.totalTimeTaken || "",
      `"${(t.remarks || "").replace(/"/g, '""')}"`,
      t.lastUpdated || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Digital_Azadi_Support_${TimeCalculator.formatISTDate().replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredTickets.length} tickets to CSV!`, "fa-file-csv");
  });

  // ============================================================================
  // 9. SETTINGS & CLOUD CONFIG MODAL
  // ============================================================================
  function openSettings() {
    webAppUrlInput.value = ApiService.getWebAppUrl();
    customPinInput.value = localStorage.getItem(CONFIG.KEYS.CUSTOM_PIN) || "";
    testConnResult.classList.add("hidden");
    settingsModal.classList.remove("hidden");
  }

  openSettingsBtn.addEventListener("click", openSettings);
  bannerConfigLink.addEventListener("click", openSettings);

  [closeSettingsModalBtn, cancelSettingsBtn].forEach(b => {
    b.addEventListener("click", () => {
      settingsModal.classList.add("hidden");
    });
  });

  saveSettingsBtn.addEventListener("click", () => {
    const url = webAppUrlInput.value.trim();
    const pin = customPinInput.value.trim();

    ApiService.setWebAppUrl(url);
    if (pin) {
      localStorage.setItem(CONFIG.KEYS.CUSTOM_PIN, pin);
    } else {
      localStorage.removeItem(CONFIG.KEYS.CUSTOM_PIN);
    }

    settingsModal.classList.add("hidden");
    checkCloudStatus();
    fetchTicketsData(false);
    showToast("Cloud configuration saved successfully!", "fa-cloud-arrow-up");
  });

  testConnectionBtn.addEventListener("click", async () => {
    const url = webAppUrlInput.value.trim();
    testConnResult.classList.remove("hidden");
    testConnResult.className = "p-3 rounded-xl border text-xs font-semibold bg-blue-50 text-blue-800 border-blue-200";
    testConnResult.textContent = "Testing connection to Apps Script Web App...";

    if (!url || !url.startsWith("http")) {
      testConnResult.className = "p-3 rounded-xl border text-xs font-semibold bg-rose-50 text-rose-800 border-rose-200";
      testConnResult.textContent = "Please enter a valid HTTP/HTTPS Web App URL.";
      return;
    }

    try {
      const res = await fetch(`${url}?action=ping&_t=${Date.now()}`);
      const data = await res.json();
      if (data && data.success) {
        testConnResult.className = "p-3 rounded-xl border text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200";
        testConnResult.innerHTML = `✔ Connection successful! Server responded in IST: <strong>${data.timestampIST}</strong>`;
      } else {
        throw new Error(data.error || "Unexpected server response");
      }
    } catch (e) {
      testConnResult.className = "p-3 rounded-xl border text-xs font-semibold bg-rose-50 text-rose-800 border-rose-200";
      testConnResult.textContent = `Connection failed: ${e.message}`;
    }
  });

  // Utility to copy ticket ID with feedback
  window.copyTicketId = function(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Ticket ID ${text} copied to clipboard!`, "fa-clipboard-check");
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500 text-[11px]"></i>';
      setTimeout(() => { btn.innerHTML = orig; }, 1600);
    });
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initial authentication check on load
  checkAuth();
});
