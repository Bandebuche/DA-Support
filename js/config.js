/**
 * Digital Azadi Support - Configuration & API Service
 */

const CONFIG = {
  // Official Spreadsheet ID
  SPREADSHEET_ID: "16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k",
  
  // Default PIN for Admin Dashboard
  DEFAULT_ADMIN_PIN: "admin123",
  
  // Storage keys
  KEYS: {
    WEB_APP_URL: "DA_SUPPORT_WEB_APP_URL",
    ADMIN_AUTH: "DA_SUPPORT_ADMIN_AUTH",
    CUSTOM_PIN: "DA_SUPPORT_CUSTOM_PIN",
    CACHED_TICKETS: "DA_SUPPORT_CACHED_TICKETS",
    AUTO_REFRESH: "DA_SUPPORT_AUTO_REFRESH"
  },

  // Brand Colors
  THEME: {
    NAVY: "#0B2545",
    ORANGE: "#FF6F00",
    NAVY_LIGHT: "#13315C",
    ORANGE_HOVER: "#E66300"
  },

  // Initial Seed Data (Used for instant testing if Web App URL is not yet connected)
  MOCK_TICKETS: [
    {
      ticketId: "DA-2026-8941",
      submissionDate: "09/10/2026",
      submissionTime: "11:56:43",
      fullName: "Shivpoojan Maurya",
      mobileNumber: "7889966942",
      emailAddress: "shivpoojanm138@gmail.com",
      userCategory: "Student",
      membershipType: "Diamond",
      platform: "Chakravyuh",
      queryDescription: "GEN 2 MIGRATION AND UPDATE & FUNNAL & ADD NEW WEBINAR SITE",
      currentStatus: "Done",
      supportStartTime: "12:00:00",
      supportEndTime: "12:30:00",
      totalTimeTaken: "00:30",
      remarks: "Gen 2 migration completed and webinar site verified.",
      lastUpdated: "09/10/2026 12:30:00"
    },
    {
      ticketId: "DA-2026-9014",
      submissionDate: "09/10/2026",
      submissionTime: "12:33:24",
      fullName: "Harsh Sandhu",
      mobileNumber: "9478961561",
      emailAddress: "thegopeakin@gmail.com",
      userCategory: "Franchise",
      membershipType: "Diamond",
      platform: "Chakravyuh",
      queryDescription: "GEN 2 MIGRATION AND UPDATE & FUNNAL & ADD NEW WEBINAR SITE",
      currentStatus: "Done",
      supportStartTime: "12:35:00",
      supportEndTime: "13:30:00",
      totalTimeTaken: "00:55",
      remarks: "Assisted with payment gateway setup and funnel test.",
      lastUpdated: "09/10/2026 13:30:00"
    },
    {
      ticketId: "DA-2026-K492",
      submissionDate: "09/10/2026",
      submissionTime: "14:15:20",
      fullName: "Pramod K Siriah",
      mobileNumber: "8779594384",
      emailAddress: "pramodksiriah9@gmail.com",
      userCategory: "Student",
      membershipType: "Diamond",
      platform: "Digital Azadi",
      queryDescription: "WordPress admin panel 403 Forbidden error on hosting site",
      currentStatus: "In Progress",
      supportStartTime: "14:30:00",
      supportEndTime: "",
      totalTimeTaken: "",
      remarks: "Currently fixing .htaccess file",
      lastUpdated: "09/10/2026 14:30:00"
    },
    {
      ticketId: "DA-2026-T821",
      submissionDate: "09/10/2026",
      submissionTime: "14:55:10",
      fullName: "Rashmi Naiknavare",
      mobileNumber: "9702957888",
      emailAddress: "rashnaik125@gmail.com",
      userCategory: "Franchise",
      membershipType: "Silver",
      platform: "Chakravyuh",
      queryDescription: "In Chakravyuh Instagram error message when sending message to new lead",
      currentStatus: "In Progress",
      supportStartTime: "",
      supportEndTime: "",
      totalTimeTaken: "",
      remarks: "",
      lastUpdated: "09/10/2026 14:55:10"
    }
  ]
};

/**
 * API Service Wrapper for interacting with Google Apps Script
 */
const ApiService = {
  /**
   * Get the configured Web App URL or fallback
   */
  getWebAppUrl() {
    return localStorage.getItem(CONFIG.KEYS.WEB_APP_URL) || "";
  },

  /**
   * Save Web App URL
   */
  setWebAppUrl(url) {
    if (url) {
      localStorage.setItem(CONFIG.KEYS.WEB_APP_URL, url.trim());
    } else {
      localStorage.removeItem(CONFIG.KEYS.WEB_APP_URL);
    }
  },

  /**
   * Check if live cloud backend is configured
   */
  isLiveConfigured() {
    const url = this.getWebAppUrl();
    return url && url.startsWith("http");
  },

  /**
   * Fetch all tickets
   */
  async getTickets() {
    if (!this.isLiveConfigured()) {
      return this._getLocalTickets();
    }

    const url = `${this.getWebAppUrl()}?action=getTickets&_t=${Date.now()}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors"
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.tickets)) {
        // Cache locally for offline backup
        localStorage.setItem(CONFIG.KEYS.CACHED_TICKETS, JSON.stringify(data.tickets));
        return data.tickets;
      }
      throw new Error(data.error || "Failed to fetch tickets from Cloud");
    } catch (err) {
      console.warn("Live API fetch failed, falling back to cached/local data:", err);
      return this._getLocalTickets();
    }
  },

  /**
   * Submit a new ticket
   */
  async createTicket(ticketData) {
    if (!this.isLiveConfigured()) {
      return this._createLocalTicket(ticketData);
    }

    const url = this.getWebAppUrl();
    const payload = {
      action: "createTicket",
      ...ticketData
    };

    try {
      // Use standard POST with JSON
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // text/plain prevents CORS preflight in Apps Script
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data && data.success && data.ticket) {
        return data.ticket;
      }
      throw new Error(data.error || "Server rejected ticket submission");
    } catch (err) {
      console.warn("Live createTicket failed, saving to local store:", err);
      return this._createLocalTicket(ticketData);
    }
  },

  /**
   * Update an existing ticket (Zero duplicates)
   */
  async updateTicket(updateData) {
    if (!this.isLiveConfigured()) {
      return this._updateLocalTicket(updateData);
    }

    const url = this.getWebAppUrl();
    const payload = {
      action: "updateTicket",
      ...updateData
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data && data.success && data.ticket) {
        return data.ticket;
      }
      throw new Error(data.error || "Failed to update ticket in Cloud");
    } catch (err) {
      console.warn("Live updateTicket failed, updating local store:", err);
      return this._updateLocalTicket(updateData);
    }
  },

  /**
   * Get single ticket by Ticket ID
   */
  async getTicket(ticketId) {
    const cleanId = String(ticketId).trim().toUpperCase();
    if (!this.isLiveConfigured()) {
      const list = this._getLocalTickets();
      return list.find(t => String(t.ticketId).toUpperCase() === cleanId) || null;
    }

    const url = `${this.getWebAppUrl()}?action=getTicket&ticketId=${encodeURIComponent(cleanId)}&_t=${Date.now()}`;
    try {
      const response = await fetch(url, { method: "GET", mode: "cors" });
      const data = await response.json();
      if (data && data.success && data.ticket) {
        return data.ticket;
      }
      return null;
    } catch (err) {
      const list = this._getLocalTickets();
      return list.find(t => String(t.ticketId).toUpperCase() === cleanId) || null;
    }
  },

  // ---- LOCAL STORAGE FALLBACK ENGINE ----
  _getLocalTickets() {
    const raw = localStorage.getItem(CONFIG.KEYS.CACHED_TICKETS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    // Initialize mock tickets
    localStorage.setItem(CONFIG.KEYS.CACHED_TICKETS, JSON.stringify(CONFIG.MOCK_TICKETS));
    return [...CONFIG.MOCK_TICKETS];
  },

  _createLocalTicket(data) {
    const list = this._getLocalTickets();
    const istDate = TimeCalculator.formatISTDate();
    const istTime = TimeCalculator.formatISTTime();
    const istTimestamp = TimeCalculator.formatISTTimestamp();

    const newTicket = {
      ticketId: data.ticketId || TimeCalculator.generateTicketId(),
      submissionDate: data.submissionDate || istDate,
      submissionTime: data.submissionTime || istTime,
      fullName: data.fullName || "",
      mobileNumber: data.mobileNumber || "",
      emailAddress: data.emailAddress || "",
      userCategory: data.userCategory || "Student",
      membershipType: data.membershipType || "Diamond",
      platform: data.platform || "Chakravyuh",
      queryDescription: data.queryDescription || "",
      currentStatus: "In Progress",
      supportStartTime: "",
      supportEndTime: "",
      totalTimeTaken: "",
      remarks: data.remarks || "",
      lastUpdated: istTimestamp
    };

    list.unshift(newTicket);
    localStorage.setItem(CONFIG.KEYS.CACHED_TICKETS, JSON.stringify(list));
    return newTicket;
  },

  _updateLocalTicket(updateData) {
    const list = this._getLocalTickets();
    const index = list.findIndex(t => String(t.ticketId).toUpperCase() === String(updateData.ticketId).toUpperCase());
    if (index === -1) {
      throw new Error(`Ticket ${updateData.ticketId} not found`);
    }

    const current = list[index];
    const istTimestamp = TimeCalculator.formatISTTimestamp();

    const start = (updateData.supportStartTime !== undefined) ? updateData.supportStartTime : current.supportStartTime;
    const end = (updateData.supportEndTime !== undefined) ? updateData.supportEndTime : current.supportEndTime;
    
    let totalTime = current.totalTimeTaken;
    if (updateData.totalTimeTaken !== undefined && updateData.totalTimeTaken !== "") {
      totalTime = updateData.totalTimeTaken;
    } else if (start && end) {
      const calc = TimeCalculator.calculateDuration(start, end);
      if (calc.isValid) totalTime = calc.formatted;
    }

    const updatedTicket = {
      ...current,
      ...updateData,
      supportStartTime: start,
      supportEndTime: end,
      totalTimeTaken: totalTime,
      lastUpdated: istTimestamp
    };

    list[index] = updatedTicket;
    localStorage.setItem(CONFIG.KEYS.CACHED_TICKETS, JSON.stringify(list));
    return updatedTicket;
  }
};
