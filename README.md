# Digital Azadi Support — Operations Portal
## Dual-Portal Ticketing & SLA Command Center

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Timezone](https://img.shields.io/badge/Timezone-Asia%2FKolkata%20(IST)-purple.svg)](#)

---

### 🌐 System Overview
**Digital Azadi Support** is an enterprise-grade customer support management platform and live SLA operations command deck. Built with a dual-portal architecture, it connects student/franchise ticket creation directly to an agent command deck and a centralized Google Sheets database (`Technical_Support_DB`).

### 🎨 Visual Identity & Aesthetic Standard
- **Strict Color Policy**: **Pure Black, White, and Purple ONLY**.
  - **Void / Deep Black**: `#050505`, `#08080D`
  - **Surfaces**: `#101014`, `#16161E`, `#1F1F2C`
  - **White**: Crisp `#FFFFFF` for primary typography and resolved badges
  - **Purples**: Primary `#8B5CF6`, Electric `#A78BFA`, Deep `#6D28D9`
  - **Zero Off-palette Colors**: Strictly no green, amber, or orange.
- **Typography**:
  - `Space Grotesk` (Headings & Metric Displays)
  - `Plus Jakarta Sans` (UI Body & Reading Text)
  - `JetBrains Mono` (Ticket IDs `DA-2026-XXXX`, Timestamps, Stopwatch meters)

---

### 🏛️ Portals & Routes

#### Portal 1: Public Student & Franchise Gateway
- **Route**: `/?portal=public` (Default root view)
- **Features**:
  - **Step 1: Requester Identity**: Full Name, 10-digit Indian WhatsApp Mobile validation (`^[6-9]\d{9}$`), Email validation, User Category (`Student Pro` vs `Franchise Hub`), Membership Tier (`Diamond Elite` vs `Silver Pass`).
  - **Step 2: Technical Specifications**: Product Ecosystem (`Chakravyuh CRM`, `Digital Azadi Hub`, `WordPress & Hosting`, `Other`), Quick Issue Suggestions (1-click auto-fill), Subject, Detailed Query, Target Website URL.
  - **Step 3: Digital Ticket Pass**: Automated `canvas-confetti` celebration, glowing Ticket ID with 1-click clipboard copy, barcode security accents, SLA target estimation, direct WhatsApp support link.
  - **Self-Service Status Tracker**: Search any ticket by Ticket ID or 10-digit phone number with live progress and resolution remarks.

#### Portal 2: Agent & Admin SLA Command Deck
- **Route**: `/?portal=admin` (Switchable via header button)
- **Features**:
  - **4 Top KPI Scorecards**: Active In-Progress queue with radar pulse, Resolved Today progress bar, Average Resolution SLA, Total Volume with Recharts area sparkline.
  - **3 Seamless View Modes**:
    1. **Kanban Board**: 4 swimlanes (`New Inquiries`, `In Progress`, `Waiting for User`, `Resolved`) with live ticking stopwatches.
    2. **Modular Card Grid**: High-density responsive cards with WhatsApp quick chat.
    3. **Dense Table View**: Linear/Stripe-inspired data table with sorting and fast triage.
  - **Refine Queue Filter Tray**: Multi-dimensional filtering by Ecosystem, Tier, Priority, Category, IST timeframe (Today, Week, Month), and Sort order.
  - **SLA & Analytics Deck**: Recharts interactive charts for resolution distribution, platform volume, frequent categories, and tier proportions.
  - **Slide-Over Ticket Drawer**: Complete requester dossier, live stopwatch widget, internal agent private notes, immutable audit trail.
  - **Modals**:
    - Complete & Resolve Modal (resolution notes prompt)
    - Manual Timing & Status Override Modal (offline support tracking)
    - Google Sheets Backend Configuration Modal

---

### ⏱️ Authoritative Stopwatch & Timezone Engine

1. **Immune to Browser Sleep**:
   - Stopwatch duration is calculated as:
     `Math.floor((Date.now() - Date.parse(ticket.supportStartedAt)) / 1000)`
   - Never drifts when backgrounded, minimized, or when system sleeps.
2. **Deterministic IST Formatting**:
   - All dates, clocks, and daily metrics evaluate strictly in `Asia/Kolkata` (UTC+5:30) via native `Intl.DateTimeFormat`.

---

### 📊 Google Sheets Centralized Database

- **Spreadsheet ID**: `16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k`
- **Tab Name**: `Technical_Support_DB`
- **Columns**:
  1. `Ticket ID` (e.g. `DA-2026-8941`)
  2. `Submission Date` (`DD/MM/YYYY`)
  3. `Submission Time` (`HH:mm:ss`)
  4. `Full Name`
  5. `Mobile Number`
  6. `Email Address`
  7. `User Category`
  8. `Membership Type`
  9. `Platform`
  10. `Query Description`
  11. `Current Status`
  12. `Support Start Time`
  13. `Support End Time`
  14. `Total Time Taken` (`HH:mm`)
  15. `Remarks`
  16. `Last Updated`

---

### 🚀 Local Development & Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build & type checks
npm run build

# Preview production build locally
npm run preview
```

---

### ☁️ Google Apps Script Web App Deployment

1. Open [Google Sheets](https://docs.google.com/spreadsheets/d/16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k/edit#gid=1624538793).
2. Go to **Extensions > Apps Script**.
3. Copy the backend code from `google-apps-script/Code.gs` and HTML files (`Index.html`, `Submit.html`, `Admin.html`).
4. Click **Deploy > New deployment**.
5. Select **Web app**:
   - **Execute as**: *Me*
   - **Who has access**: *Anyone*
6. Copy the Web App execution URL and paste it into the **Digital Azadi Settings Modal** (`Cloud Backend Engine`).
