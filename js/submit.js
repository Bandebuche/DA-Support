/**
 * Digital Azadi Support - Public Submission Portal (Portal 1)
 * Enhanced UI/UX micro-interactions, quick tags & toasts
 */

document.addEventListener("DOMContentLoaded", () => {
  // Live IST Clock in Header
  function updateLiveClock() {
    const clockEl = document.getElementById("liveIstClock");
    if (clockEl) {
      clockEl.textContent = TimeCalculator.formatISTTime();
    }
  }
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Form Elements
  const form = document.getElementById("supportForm");
  const formContainer = document.getElementById("formContainer");
  const receiptContainer = document.getElementById("receiptContainer");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnIcon = document.getElementById("btnIcon");
  const btnSpinner = document.getElementById("btnSpinner");
  const alertBox = document.getElementById("alertBox");

  const fullNameInput = document.getElementById("fullName");
  const mobileInput = document.getElementById("mobileNumber");
  const emailInput = document.getElementById("emailAddress");
  const queryInput = document.getElementById("queryDescription");
  const remarksInput = document.getElementById("remarks");
  const charCounter = document.getElementById("queryCharCount");
  const quickTags = document.querySelectorAll(".quick-tag");

  // Toast Helper
  function showToast(message, icon = "fa-check", isSuccess = true) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <i class="fa-solid ${icon} ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Quick Issue Tag Helpers (Linear style)
  if (quickTags && queryInput) {
    quickTags.forEach(tagBtn => {
      tagBtn.addEventListener("click", () => {
        const tagText = tagBtn.getAttribute("data-tag");
        if (!tagText) return;

        const currentVal = queryInput.value.trim();
        if (currentVal) {
          queryInput.value = `${currentVal}\nIssue Category: [${tagText}] - `;
        } else {
          queryInput.value = `Issue Category: [${tagText}] - `;
        }
        queryInput.focus();
        queryInput.dispatchEvent(new Event("input"));
        showToast(`Added issue tag: ${tagText}`, "fa-tag");
      });
    });
  }

  // Character counter for query description
  if (queryInput && charCounter) {
    queryInput.addEventListener("input", () => {
      const len = queryInput.value.length;
      charCounter.textContent = `${len} / 1000 characters`;
      if (len > 900) {
        charCounter.classList.add("text-rose-500");
      } else {
        charCounter.classList.remove("text-rose-500");
      }
    });
  }

  // Sanitize mobile input (digits only)
  if (mobileInput) {
    mobileInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  // Copy Ticket ID Button
  const copyBtn = document.getElementById("copyTicketBtn");
  const copyBtnText = document.getElementById("copyBtnText");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const ticketId = document.getElementById("receiptTicketId").textContent.trim();
      navigator.clipboard.writeText(ticketId).then(() => {
        copyBtnText.textContent = "Copied to Clipboard!";
        showToast(`Ticket ID ${ticketId} copied!`, "fa-clipboard-check");
        setTimeout(() => {
          copyBtnText.textContent = "Copy Ticket ID";
        }, 2500);
      }).catch(() => {
        const temp = document.createElement("input");
        temp.value = ticketId;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        copyBtnText.textContent = "Copied!";
        showToast(`Ticket ID ${ticketId} copied!`, "fa-clipboard-check");
        setTimeout(() => {
          copyBtnText.textContent = "Copy Ticket ID";
        }, 2500);
      });
    });
  }

  // Submit Another Button
  const submitAnotherBtn = document.getElementById("submitAnotherBtn");
  if (submitAnotherBtn) {
    submitAnotherBtn.addEventListener("click", () => {
      form.reset();
      clearErrors();
      receiptContainer.classList.add("hidden");
      formContainer.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Validation Helpers
  function showError(fieldId, message) {
    const errEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.remove("hidden");
    }
    if (inputEl) {
      inputEl.classList.add("border-rose-500", "bg-rose-50/30");
    }
  }

  function clearErrors() {
    ["fullName", "mobileNumber", "emailAddress", "queryDescription"].forEach(id => {
      const errEl = document.getElementById(`error-${id}`);
      const inputEl = document.getElementById(id);
      if (errEl) {
        errEl.textContent = "";
        errEl.classList.add("hidden");
      }
      if (inputEl) {
        inputEl.classList.remove("border-rose-500", "bg-rose-50/30");
      }
    });
    alertBox.classList.add("hidden");
  }

  function showAlert(msg, isSuccess = false) {
    alertBox.textContent = msg;
    alertBox.className = isSuccess 
      ? "mb-6 p-4 rounded-2xl border text-sm font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 block"
      : "mb-6 p-4 rounded-2xl border text-sm font-semibold bg-rose-50 text-rose-800 border-rose-200 block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Form Submit Handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    // 1. Validate Full Name
    const fullName = fullNameInput.value.trim();
    if (!fullName || fullName.length < 2) {
      showError("fullName", "Please enter your full name (at least 2 characters).");
      fullNameInput.focus();
      return;
    }

    // 2. Validate Mobile (10 digits Indian mobile)
    const mobile = mobileInput.value.trim();
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      showError("mobileNumber", "Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).");
      mobileInput.focus();
      return;
    }

    // 3. Validate Email
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError("emailAddress", "Please enter a valid email address.");
      emailInput.focus();
      return;
    }

    // 4. Radio Values
    const userCategory = document.querySelector('input[name="userCategory"]:checked')?.value || "Student";
    const membershipType = document.querySelector('input[name="membershipType"]:checked')?.value || "Diamond";
    const platform = document.querySelector('input[name="platform"]:checked')?.value || "Chakravyuh";

    // 5. Validate Query Description
    const query = queryInput.value.trim();
    if (!query || query.length < 10) {
      showError("queryDescription", "Please provide a detailed query description (minimum 10 characters).");
      queryInput.focus();
      return;
    }

    // 6. Optional Remarks
    const remarks = remarksInput.value.trim();

    // Submission UI State
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-75", "cursor-not-allowed");
    btnText.textContent = "Securing Ticket in IST Queue...";
    btnIcon.classList.add("hidden");
    btnSpinner.classList.remove("hidden");

    try {
      // Generate unique Ticket ID & IST Timestamps
      const ticketId = TimeCalculator.generateTicketId();
      const submissionDate = TimeCalculator.formatISTDate();
      const submissionTime = TimeCalculator.formatISTTime();

      const payload = {
        ticketId,
        submissionDate,
        submissionTime,
        fullName,
        mobileNumber: mobile,
        emailAddress: email,
        userCategory,
        membershipType,
        platform,
        queryDescription: query,
        currentStatus: "In Progress",
        supportStartTime: "",
        supportEndTime: "",
        totalTimeTaken: "",
        remarks,
        lastUpdated: TimeCalculator.formatISTTimestamp()
      };

      // Call Cloud API
      const createdTicket = await ApiService.createTicket(payload);

      // Populate Receipt Card
      document.getElementById("receiptTicketId").textContent = createdTicket.ticketId || ticketId;
      document.getElementById("receiptDate").textContent = createdTicket.submissionDate || submissionDate;
      document.getElementById("receiptTime").textContent = createdTicket.submissionTime || submissionTime;
      document.getElementById("receiptName").textContent = createdTicket.fullName || fullName;
      document.getElementById("receiptMobile").textContent = `+91 ${createdTicket.mobileNumber || mobile}`;
      document.getElementById("receiptPlatform").textContent = `${createdTicket.platform} • ${createdTicket.userCategory} (${createdTicket.membershipType})`;
      document.getElementById("receiptQuery").textContent = createdTicket.queryDescription || query;

      // WhatsApp Direct Link
      const waLink = document.getElementById("whatsappSupportLink");
      if (waLink) {
        const text = encodeURIComponent(`Hello Digital Azadi Support, I just raised Ticket ID *${ticketId}* regarding: ${query.substring(0, 100)}...`);
        waLink.href = `https://wa.me/918057889906?text=${text}`;
      }

      // Transition smoothly
      formContainer.classList.add("hidden");
      receiptContainer.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Support ticket dispatched successfully!", "fa-check-circle");

    } catch (err) {
      console.error("Submission failed:", err);
      showAlert(`Submission error: ${err.message || "Could not dispatch ticket"}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
      btnText.textContent = "Submit Support Request";
      btnIcon.classList.remove("hidden");
      btnSpinner.classList.add("hidden");
    }
  });

});
