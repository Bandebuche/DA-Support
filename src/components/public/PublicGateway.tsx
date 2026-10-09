import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  TicketFormData, 
  UserType, 
  MembershipTier, 
  ProductEcosystem, 
  Ticket 
} from '../../types/ticket';
import { ticketService } from '../../services/ticketService';
import { getCurrentISTClockString, formatToISTDateTimeString } from '../../lib/timezone';
import { 
  CheckCircle, 
  Sparkles, 
  Send, 
  Clock, 
  Copy, 
  Check, 
  MessageCircle, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  FileText,
  Tag,
  QrCode,
  RotateCcw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';

const ISSUE_TAGS = [
  { tag: '+ WordPress/DNS', append: '[WordPress & DNS Error] ' },
  { tag: '+ WhatsApp WABA', append: '[WhatsApp WABA API Integration] ' },
  { tag: '+ Payment/SSL', append: '[Payment Gateway & SSL Issue] ' },
  { tag: '+ Funnel/Login', append: '[LMS Funnel & Login Access] ' },
  { tag: '+ CRM Lead Sync', append: '[Chakravyuh CRM Webhook Sync] ' },
];

export const PublicGateway: React.FC = () => {
  const [istTime, setIstTime] = useState(getCurrentISTClockString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Unified Form State
  const [formData, setFormData] = useState<TicketFormData>({
    fullName: '',
    email: '',
    mobile: '',
    userType: 'Student Pro',
    membershipTier: 'Diamond Elite',
    ecosystem: 'Chakravyuh CRM',
    category: 'CRM & Lead Management',
    websiteUrl: '',
    subject: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Live IST Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(getCurrentISTClockString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WhatsApp Validation
  const mobileDigits = formData.mobile.replace(/\D/g, '');
  const isMobileValid = /^[6-9]\d{9}$/.test(mobileDigits);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (at least 2 characters).';
    }
    if (!isMobileValid) {
      errs.mobile = 'Enter a valid 10-digit Indian WhatsApp mobile number (starting with 6-9).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 4) {
      errs.subject = 'Please enter a subject (at least 4 characters).';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Please describe your query in detail (minimum 10 characters).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const ticket = await ticketService.submitTicket({
        ...formData,
        mobile: formData.mobile.replace(/\D/g, ''),
      });

      setCreatedTicket(ticket);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#FF5500', '#10B981', '#A78BFA', '#FFFFFF'],
        });
      } catch (e) {
        // Safe fallback
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicketId = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.ticketId);
    setHasCopiedId(true);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const handleAppendIssueTag = (snippet: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description.startsWith(snippet) 
        ? prev.description 
        : snippet + prev.description,
    }));
  };

  const handleResetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      userType: 'Student Pro',
      membershipTier: 'Diamond Elite',
      ecosystem: 'Chakravyuh CRM',
      category: 'CRM & Lead Management',
      websiteUrl: '',
      subject: '',
      description: '',
    });
    setCreatedTicket(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-void text-text-pure flex flex-col selection:bg-neon-violet selection:text-white relative overflow-hidden">
      
      {/* Ambient Radial Mesh Background */}
      <div className="pointer-events-none absolute -top-40 left-10 w-[600px] h-[600px] bg-violet-600/10 blur-[150px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 right-10 w-[650px] h-[650px] bg-[#FF5500]/10 blur-[150px] rounded-full" />

      {/* Clean Top Header (Public Branding ONLY) */}
      <header className="h-20 border-b border-surface-border bg-surface/70 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        
        {/* Brand: Official Digital Azadi Logo */}
        <div className="flex items-center gap-3.5">
          <BrandLogo size="md" />
          <div className="hidden sm:block">
            <span className="font-mono text-sm md:text-base font-black tracking-wider uppercase text-text-pure block">
              Digital Azadi Support
            </span>
            <p className="text-[11px] font-mono text-text-muted">
              Official Student & Franchise Resolution Desk
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle & Live IST Clock */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle showLabel />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Clock className="w-3.5 h-3.5 text-neon-electric" />
            <span className="font-bold text-text-pure tracking-wider">{istTime}</span>
            <span className="text-[10px] text-text-faint">IST</span>
          </div>
        </div>

      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 z-10">
        
        {/* If Ticket has NOT been submitted: show the unified support form */}
        {!createdTicket ? (
          <div className="space-y-8">
            
            {/* Hero Banner */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-obsidian border border-neon-violet/30 text-xs font-mono shadow-nexus-sm backdrop-blur-xl">
                <span className="text-amber-400">⚡</span>
                <span className="text-text-pure font-bold">Digital Azadi Support Desk</span>
                <span className="text-text-faint">•</span>
                <span className="text-emerald-400 font-semibold">Priority IST SLA Assistance</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-mono tracking-tight text-text-pure">
                Submit Support Request
              </h1>
              <p className="text-xs md:text-sm text-text-muted max-w-lg mx-auto">
                Fill in your details below to instantly raise a support ticket.
              </p>
            </div>

            {/* Complete, Streamlined Single-Page Support Form */}
            <form onSubmit={handleSubmit} className="bg-surface-obsidian border border-surface-border rounded-3xl p-6 md:p-8 space-y-7 shadow-2xl backdrop-blur-2xl">
              
              {/* SECTION 1: Contact Details */}
              <div className="space-y-4">
                <div className="border-b border-surface-border pb-2 flex items-center justify-between">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure flex items-center gap-2">
                    <User className="w-4 h-4 text-neon-electric" />
                    1. Requester Credentials
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-text-faint mb-1.5">
                    Full Name <span className="text-neon-flame">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-text-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ramesh Kulkarni"
                      className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-4 py-2.5 text-xs focus:border-neon-electric focus:shadow-nexus-sm focus:outline-none placeholder:text-text-faint transition"
                    />
                  </div>
                  {errors.fullName && <p className="text-[11px] font-mono text-[#FF5500] mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp Mobile with Instant Validation */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono uppercase text-text-faint">
                        WhatsApp Mobile <span className="text-neon-flame">*</span>
                      </label>
                      {isMobileValid && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          Valid 10-Digit Mobile
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="font-mono text-xs text-text-faint absolute left-3.5 top-1/2 -translate-y-1/2 font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                        placeholder="9823012345"
                        className={cn(
                          'w-full bg-surface-elevated text-text-pure rounded-xl border pl-12 pr-4 py-2.5 text-xs font-mono focus:outline-none transition',
                          isMobileValid ? 'border-emerald-500/50 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]' : 'border-surface-border focus:border-neon-electric'
                        )}
                      />
                    </div>
                    {errors.mobile && <p className="text-[11px] font-mono text-[#FF5500] mt-1">{errors.mobile}</p>}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-text-faint mb-1.5">
                      Email Address <span className="text-neon-flame">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-text-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ramesh@digitalazadi.com"
                        className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-4 py-2.5 text-xs focus:border-neon-electric focus:shadow-nexus-sm focus:outline-none placeholder:text-text-faint transition"
                      />
                    </div>
                    {errors.email && <p className="text-[11px] font-mono text-[#FF5500] mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 2: User Category & Membership Selection */}
              <div className="space-y-4">
                <div className="border-b border-surface-border pb-2">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neon-electric" />
                    2. Classification & Membership
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* User Type */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-text-faint mb-2">
                      User Category
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'Student Pro' as UserType, icon: '👨‍🎓', title: 'Student Pro' },
                        { id: 'Franchise Hub' as UserType, icon: '🏢', title: 'Franchise' },
                      ].map(item => {
                        const isSelected = formData.userType === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setFormData({ ...formData, userType: item.id })}
                            className={cn(
                              'p-3 rounded-xl border cursor-pointer transition select-none flex items-center justify-between',
                              isSelected 
                                ? 'bg-violet-600/20 border-violet-500 shadow-nexus-sm' 
                                : 'bg-surface-elevated/70 border-surface-border hover:border-surface-hover'
                            )}
                          >
                            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                              <span>{item.icon}</span>
                              <span>{item.title}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-neon-electric" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Membership Tier */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-text-faint mb-2">
                      Membership Tier
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Diamond Elite' as MembershipTier, title: 'Diamond' },
                        { id: 'Silver Pass' as MembershipTier, title: 'Silver' },
                        { id: 'Other / Not Specified' as MembershipTier, title: 'Other' },
                      ].map(item => {
                        const isSelected = formData.membershipTier === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setFormData({ ...formData, membershipTier: item.id })}
                            className={cn(
                              'p-3 rounded-xl border cursor-pointer transition select-none text-center',
                              isSelected 
                                ? 'bg-violet-600/20 border-violet-500 shadow-nexus-sm' 
                                : 'bg-surface-elevated/70 border-surface-border hover:border-surface-hover'
                            )}
                          >
                            <span className="text-xs font-mono font-bold text-white block truncate">
                              {item.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Technical Inquiry Specifications */}
              <div className="space-y-4">
                <div className="border-b border-surface-border pb-2">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neon-electric" />
                    3. Inquiry Specifications
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ecosystem */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-text-faint mb-1.5">
                      Platform / Ecosystem <span className="text-neon-flame">*</span>
                    </label>
                    <select
                      value={formData.ecosystem}
                      onChange={e => setFormData({ ...formData, ecosystem: e.target.value as ProductEcosystem })}
                      className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2.5 text-xs font-mono focus:border-neon-electric focus:outline-none"
                    >
                      <option value="Chakravyuh CRM">Chakravyuh CRM</option>
                      <option value="Digital Azadi Hub">Digital Azadi Hub</option>
                      <option value="WordPress & Hosting">WordPress & Hosting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-text-faint mb-1.5">
                      Issue Category <span className="text-neon-flame">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2.5 text-xs font-mono focus:border-neon-electric focus:outline-none"
                    >
                      <option value="CRM & Lead Management">CRM & Lead Management</option>
                      <option value="LMS & Course Access">LMS & Course Access</option>
                      <option value="Domain & Hosting">Domain & Hosting</option>
                      <option value="Membership & Tier">Membership & Tier</option>
                      <option value="Account & Permissions">Account & Permissions</option>
                      <option value="Billing & Invoicing">Billing & Invoicing</option>
                      <option value="General Technical Support">General Technical Support</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-mono uppercase text-text-faint mb-1.5">
                    Inquiry Subject <span className="text-neon-flame">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief summary of what you need help with..."
                    className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2.5 text-xs focus:border-neon-electric focus:outline-none placeholder:text-text-faint transition"
                  />
                  {errors.subject && <p className="text-[11px] font-mono text-[#FF5500] mt-1">{errors.subject}</p>}
                </div>

                {/* Issue Tags & Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-text-faint">
                      Detailed Query Description <span className="text-neon-flame">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-neon-electric flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Click tag to insert topic:
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pb-1">
                    {ISSUE_TAGS.map(item => (
                      <button
                        type="button"
                        key={item.tag}
                        onClick={() => handleAppendIssueTag(item.append)}
                        className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border hover:border-violet-500/50 text-[11px] font-mono text-text-muted hover:text-white transition shadow-sm"
                      >
                        {item.tag}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please explain the details of your issue, what happened, and any relevant details..."
                    className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border p-3.5 text-xs focus:border-neon-electric focus:outline-none placeholder:text-text-faint resize-none leading-relaxed transition"
                  />
                  {errors.description && <p className="text-[11px] font-mono text-[#FF5500] mt-1">{errors.description}</p>}
                </div>

                {/* Target Website URL */}
                <div>
                  <label className="block text-xs font-mono uppercase text-text-faint mb-1.5">
                    Target Website / URL <span className="text-text-faint lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-text-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.websiteUrl}
                      onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-4 py-2.5 text-xs font-mono focus:border-neon-electric focus:outline-none placeholder:text-text-faint"
                    />
                  </div>
                </div>
              </div>

              {/* Single Primary Submission Action (No "Next" buttons!) */}
              <div className="pt-3 border-t border-surface-border flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-nexus-glow transition"
                >
                  {isSubmitting ? (
                    <span>Submitting Ticket...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        ) : (
          /* CONFIRMATION STATE / DIGITAL TICKET PASS (No backend or operations links!) */
          <div className="max-w-xl mx-auto space-y-6">
            
            {/* Header Success Callout */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-text-pure">
                Ticket Submitted Successfully
              </h2>
              <p className="text-xs text-text-muted font-mono">
                Your support request has been logged into Digital Azadi Support.
              </p>
            </div>

            {/* Ticket Pass Receipt Card */}
            <div className="bg-surface-obsidian border border-neon-violet/30 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl">
              
              <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-emerald-400 to-[#FF5500]" />

              {/* Pass Header */}
              <div className="p-6 border-b border-surface-border flex items-start justify-between bg-surface-elevated/40">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neon-electric tracking-widest block font-bold">
                    SUPPORT TICKET RECEIPT
                  </span>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="text-2xl font-mono font-black text-text-pure tracking-wider">
                      {createdTicket.ticketId}
                    </span>
                    <button
                      onClick={handleCopyTicketId}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white transition"
                      title="Copy Ticket ID"
                    >
                      {hasCopiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-block">
                    In Progress
                  </span>
                  <span className="block text-[10px] font-mono text-text-faint mt-1">
                    {createdTicket.membershipTier}
                  </span>
                </div>
              </div>

              {/* Pass Body */}
              <div className="p-6 space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                  <div>
                    <span className="text-text-faint text-[10px] uppercase block">Requester</span>
                    <span className="text-text-pure font-bold text-sm">{createdTicket.requesterName}</span>
                    <span className="text-text-muted text-[11px] block">{createdTicket.requesterPhone}</span>
                  </div>
                  <div>
                    <span className="text-text-faint text-[10px] uppercase block">Platform & Issue</span>
                    <span className="text-text-pure font-bold">{createdTicket.ecosystem}</span>
                    <span className="text-neon-electric text-[11px] block truncate">{createdTicket.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-surface-border">
                  <div>
                    <span className="text-text-faint text-[10px] uppercase block">Submitted At (IST)</span>
                    <span className="text-text-pure">{formatToISTDateTimeString(createdTicket.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-text-faint text-[10px] uppercase block">Status</span>
                    <span className="text-emerald-400 font-bold">
                      Logged in Queue
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-text-faint text-[10px] uppercase block mb-1">Subject</span>
                  <p className="text-text-pure font-sans text-xs bg-surface-elevated p-3 rounded-xl border border-surface-border">
                    {createdTicket.subject}
                  </p>
                </div>
              </div>

              {/* Direct WhatsApp Follow-up */}
              <div className="bg-surface-elevated/80 p-5 border-t border-surface-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <QrCode className="w-4 h-4 text-neon-electric" />
                  <span>Digital Azadi Support</span>
                </div>

                <a
                  href={`https://wa.me/919823012345?text=${encodeURIComponent(`Hello Digital Azadi Support, I have submitted ticket ${createdTicket.ticketId} regarding "${createdTicket.subject}". Please assist.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)] transition"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Notify via WhatsApp</span>
                </a>
              </div>

            </div>

            {/* Reset / Submit Another Ticket (No Admin or Operations Links) */}
            <div className="text-center pt-2">
              <button
                onClick={handleResetForm}
                className="px-5 py-2.5 rounded-xl bg-surface-obsidian hover:bg-surface-cosmic border border-surface-border text-xs font-mono text-text-pure transition inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neon-electric" />
                <span>Submit Another Support Ticket</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-6 px-4 text-center text-xs font-mono text-text-faint">
        <p>Digital Azadi Support • Asia/Kolkata (IST)</p>
      </footer>

    </div>
  );
};
