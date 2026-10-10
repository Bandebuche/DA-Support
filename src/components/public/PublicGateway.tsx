import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  TicketFormData, 
  UserType, 
  MembershipTier, 
  ProductEcosystem, 
  Ticket,
  SupportSpecialist
} from '../../types/ticket';
import { ticketService } from '../../services/ticketService';
import { loadStoredTickets } from '../../lib/storage';
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
  Search, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle,
  MapPin,
  Award,
  Building2,
  GraduationCap,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Home,
  Headphones,
  Instagram,
  Linkedin,
  Youtube,
  Facebook,
  Twitter,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Badge } from '../ui/Badge';

const ISSUE_TAGS = [
  { tag: '+ WordPress/DNS', append: '[WordPress & DNS Error] ' },
  { tag: '+ WhatsApp WABA', append: '[WhatsApp WABA API Integration] ' },
  { tag: '+ Payment/SSL', append: '[Payment Gateway & SSL Issue] ' },
  { tag: '+ Funnel/Login', append: '[LMS Funnel & Login Access] ' },
  { tag: '+ CRM Lead Sync', append: '[Chakravyuh CRM Webhook Sync] ' },
];

const MEMBERSHIP_OPTIONS: { id: MembershipTier; label: string; badge: string; icon: string; desc: string }[] = [
  { 
    id: 'Diamond Member', 
    label: 'Diamond Member', 
    badge: 'Diamond Tier', 
    icon: '💎',
    desc: 'Highest priority SLA with direct engineer review' 
  },
  { 
    id: 'Silver Member', 
    label: 'Silver Member', 
    badge: 'Silver Tier', 
    icon: '🥈',
    desc: 'Standard technical query and setup assistance' 
  },
  { 
    id: 'Gold Member', 
    label: 'Gold Member', 
    badge: 'Gold Tier', 
    icon: '🥇',
    desc: 'Priority queue with fast technical turnaround' 
  },
  { 
    id: 'PMP Member', 
    label: 'PMP Member', 
    badge: 'PMP Professional', 
    icon: '⭐',
    desc: 'Specialized project & business mentorship support' 
  },
];

export const PublicGateway: React.FC = () => {
  const [istTime, setIstTime] = useState(getCurrentISTClockString());
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Tracking State
  const [trackTicketId, setTrackTicketId] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);

  // Unified Form State
  const [formData, setFormData] = useState<TicketFormData>({
    fullName: '',
    email: '',
    mobile: '',
    city: '',
    userType: 'Student Pro',
    membershipTier: 'Diamond Member',
    ecosystem: 'Chakravyuh CRM',
    category: 'CRM & Lead Management',
    websiteUrl: '',
    subject: '',
    description: '',
    assignedSpecialist: 'Sachin Sir',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Live IST Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(getCurrentISTClockString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WhatsApp Validation: 10 Indian digits starting with 6-9
  const mobileDigits = formData.mobile.replace(/\D/g, '');
  const isMobileValid = /^[6-9]\d{9}$/.test(mobileDigits);

  // Email Validation: valid email format
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isGmail = formData.email.trim().toLowerCase().endsWith('@gmail.com');

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (minimum 2 characters).';
    }
    
    if (!isMobileValid) {
      errs.mobile = 'Please enter a valid 10-digit Indian WhatsApp mobile number (starting with 6-9).';
    }
    
    if (!formData.email.trim() || !isEmailValid) {
      errs.email = 'Please enter a valid email address (e.g. yourname@gmail.com).';
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errs.city = 'Please enter your city (e.g. Pune, Mumbai, Delhi).';
    }
    
    if (!formData.subject.trim() || formData.subject.trim().length < 4) {
      errs.subject = 'Please enter an inquiry subject (minimum 4 characters).';
    }
    
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Please describe your query in detail (minimum 10 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await ticketService.submitTicket({
        ...formData,
        mobile: formData.mobile.replace(/\D/g, ''),
      });

      setCreatedTicket(ticket);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#EC4899', '#8B5CF6', '#10B981'],
        });
      } catch {
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
      city: '',
      userType: 'Student Pro',
      membershipTier: 'Diamond Member',
      ecosystem: 'Chakravyuh CRM',
      category: 'CRM & Lead Management',
      websiteUrl: '',
      subject: '',
      description: '',
      assignedSpecialist: 'Sachin Sir',
    });
    setCreatedTicket(null);
    setErrors({});
  };

  // Ticket Tracker Search with Phone Verification
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedTicket(null);

    const cleanId = trackTicketId.trim().toUpperCase();
    const cleanPhone = trackPhone.replace(/\D/g, '');

    if (!cleanId) {
      setTrackError('Please enter your Ticket ID (e.g. DA-2026-XXXX).');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setTrackError('Please enter your 10-digit registered WhatsApp mobile number for verification.');
      return;
    }

    setIsSearchingTrack(true);

    try {
      const allTickets = loadStoredTickets();
      const matched = allTickets.find(t => {
        const matchesId = t.ticketId.toUpperCase() === cleanId;
        const matchesPhone = t.requesterPhone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10));
        return matchesId && matchesPhone;
      });

      if (matched) {
        setTrackedTicket(matched);
      } else {
        const idExists = allTickets.some(t => t.ticketId.toUpperCase() === cleanId);
        if (idExists) {
          setTrackError('Ticket ID found, but the mobile number does not match our records for this ticket. Please verify your 10-digit registered number.');
        } else {
          setTrackError(`No record found for Ticket ID "${cleanId}". Please verify your ticket ID or raise a new support query.`);
        }
      }
    } catch (err: any) {
      setTrackError('Error checking records: ' + err.message);
    } finally {
      setIsSearchingTrack(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D1B] text-slate-100 flex flex-col justify-between selection:bg-pink-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Ambient Cosmic Glow Backdrops */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] bg-pink-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Sleek Top Navigation Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" showBadge={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Digital Azadi Support
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                Official Helpdesk
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Student & Franchise Resolution Center • Live in IST
            </p>
          </div>
        </div>

        {/* Center/Right Nav Controls */}
        <div className="flex items-center gap-3">
          
          {/* Live IST Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">{istTime}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">IST</span>
          </div>

          {/* Admin Login Link */}
          <a
            href="/admin"
            className="px-4 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-all backdrop-blur-md shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin Login</span>
          </a>
        </div>
      </header>

      {/* Main Master Card Shell (Exact Floating Container from Image) */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col justify-center">
        
        {/* Rounded Glassmorphic Master Window Container */}
        <div className="w-full bg-[#11142A]/85 backdrop-blur-2xl border border-white/10 rounded-[32px] sm:rounded-[42px] p-5 sm:p-9 lg:p-11 shadow-[0_25px_80px_rgba(0,0,0,0.75)] relative overflow-hidden">
          
          {/* Subtle Top Glowing Flare Bar */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent shadow-[0_0_15px_#C084FC]" />

          {/* Tab Switcher Pills (Raise Support Query vs Track Your Ticket) */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md shadow-inner">
              <button
                type="button"
                onClick={() => { setActiveTab('submit'); setTrackError(null); }}
                className={cn(
                  'px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2',
                  activeTab === 'submit'
                    ? 'bg-gradient-to-r from-[#5B4DF6] to-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Raise a Support Query</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setActiveTab('track'); setTrackError(null); }}
                className={cn(
                  'px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2',
                  activeTab === 'track'
                    ? 'bg-gradient-to-r from-[#5B4DF6] to-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                <Search className="w-4 h-4" />
                <span>Track Your Ticket</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: RAISE SUPPORT QUERY (DUAL GLASS CARDS FROM SCREENSHOT) */}
          {/* ============================================================== */}
          {activeTab === 'submit' && !createdTicket && (
            <div>
              
              {/* Section Headers as in Screenshot */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-3">
                <div className="lg:col-span-5 text-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">
                    Contact Info Section
                  </span>
                </div>
                <div className="lg:col-span-7 text-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">
                    Contact Form
                  </span>
                </div>
              </div>

              {/* Dual Glass Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                
                {/* -------------------------------------------------------- */}
                {/* LEFT CARD: Contact Info Section (from Screenshot) */}
                {/* -------------------------------------------------------- */}
                <div className="lg:col-span-5 relative rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/15 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl shadow-black/40">
                  
                  {/* Glowing Corner Light Flare Reflections */}
                  <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-500/25 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]" />

                  <div className="relative z-10 space-y-6">
                    {/* Hero Heading */}
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Get in Touch
                      </h2>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-3">
                        We're here to assist you with your learning, technical issues, and mentorship queries with priority turnaround.
                      </p>
                    </div>

                    {/* Contact Details List (Exact Icons & Layout from Screenshot) */}
                    <div className="space-y-4 pt-2">
                      
                      {/* Email */}
                      <div className="flex items-center gap-3.5 group">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/15 flex items-center justify-center text-purple-300 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all shrink-0">
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Support Email</span>
                          <a href="mailto:support@digitalazadi.com" className="text-sm font-semibold text-white hover:text-purple-300 transition-colors">
                            support@digitalazadi.com
                          </a>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-3.5 group">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/15 flex items-center justify-center text-purple-300 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all shrink-0">
                          <Home className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Campus & Headquarters</span>
                          <span className="text-sm font-semibold text-white">
                            Digital Azadi Campus, Sector 14, Pune, India
                          </span>
                        </div>
                      </div>

                      {/* Phone / WhatsApp */}
                      <div className="flex items-center gap-3.5 group">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/15 flex items-center justify-center text-purple-300 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all shrink-0">
                          <Phone className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Official Helpline & WhatsApp</span>
                          <a href="tel:+919370872911" className="text-sm font-semibold text-white hover:text-purple-300 transition-colors">
                            +91 93708 72911
                          </a>
                        </div>
                      </div>

                    </div>

                    {/* Operational Specialist Routing Notice */}
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 mt-4">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                        Specialist Routing System
                      </span>
                      <div className="text-xs text-slate-300 space-y-1.5 font-medium">
                        <div className="flex items-center justify-between">
                          <span>• <strong>Onkar Kulkarni</strong>:</span>
                          <span className="text-purple-300 font-semibold text-[11px]">Meta Only</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>• <strong>Sachin Sir</strong>:</span>
                          <span className="text-emerald-300 font-semibold text-[11px]">All Other Operations</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Left Card Bottom Live SLA Badge */}
                  <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Live IST Desk
                    </span>
                    <span>Average SLA: &lt; 30 Mins</span>
                  </div>

                </div>

                {/* -------------------------------------------------------- */}
                {/* RIGHT CARD: Contact Form (from Screenshot) */}
                {/* -------------------------------------------------------- */}
                <form 
                  onSubmit={handleSubmit}
                  noValidate
                  className="lg:col-span-7 relative rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/15 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl shadow-black/40"
                >
                  {/* Glowing Corner Light Flare */}
                  <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-500/25 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]" />

                  <div className="relative z-10 space-y-4">
                    
                    {/* Row 1: Full Name & WhatsApp Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Your Name*"
                            className={cn(
                              'w-full h-12 rounded-2xl bg-[#262A4D]/80 border text-white placeholder-slate-400 px-4 text-sm font-medium transition-all shadow-inner',
                              'focus:outline-none focus:ring-2 focus:border-purple-400 focus:bg-[#2C315B]',
                              errors.fullName 
                                ? 'border-red-500 focus:ring-red-500/30' 
                                : 'border-white/15 focus:ring-purple-500/25'
                            )}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.fullName}</p>
                        )}
                      </div>

                      {/* WhatsApp Mobile */}
                      <div>
                        <div className="relative">
                          <input
                            type="tel"
                            name="mobile"
                            required
                            maxLength={10}
                            value={formData.mobile}
                            onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                            placeholder="WhatsApp Number (10 Digits)*"
                            className={cn(
                              'w-full h-12 rounded-2xl bg-[#262A4D]/80 border text-white font-mono placeholder:font-sans placeholder-slate-400 px-4 text-sm font-medium transition-all shadow-inner',
                              'focus:outline-none focus:ring-2 focus:border-purple-400 focus:bg-[#2C315B]',
                              errors.mobile 
                                ? 'border-red-500 focus:ring-red-500/30' 
                                : isMobileValid
                                ? 'border-emerald-500/70 focus:ring-emerald-500/25'
                                : 'border-white/15 focus:ring-purple-500/25'
                            )}
                          />
                          {isMobileValid && (
                            <Check className="w-4 h-4 text-emerald-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          )}
                        </div>
                        {errors.mobile && (
                          <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.mobile}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Email Address & City */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Email Address (Gmail)*"
                            className={cn(
                              'w-full h-12 rounded-2xl bg-[#262A4D]/80 border text-white placeholder-slate-400 px-4 pr-10 text-sm font-medium transition-all shadow-inner',
                              'focus:outline-none focus:ring-2 focus:border-purple-400 focus:bg-[#2C315B]',
                              errors.email 
                                ? 'border-red-500 focus:ring-red-500/30' 
                                : 'border-white/15 focus:ring-purple-500/25'
                            )}
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {errors.email && (
                          <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.email}</p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Your City* (e.g. Pune, Mumbai)"
                            className={cn(
                              'w-full h-12 rounded-2xl bg-[#262A4D]/80 border text-white placeholder-slate-400 px-4 text-sm font-medium transition-all shadow-inner',
                              'focus:outline-none focus:ring-2 focus:border-purple-400 focus:bg-[#2C315B]',
                              errors.city 
                                ? 'border-red-500 focus:ring-red-500/30' 
                                : 'border-white/15 focus:ring-purple-500/25'
                            )}
                          />
                        </div>
                        {errors.city && (
                          <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Membership Tier Dropdown (The 4 Options) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Membership Tier <span className="text-pink-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="membershipTier"
                          value={formData.membershipTier}
                          onChange={e => setFormData({ ...formData, membershipTier: e.target.value as MembershipTier })}
                          className="w-full h-12 rounded-2xl bg-[#262A4D]/80 border border-white/15 text-white px-4 pr-10 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-500/25 focus:bg-[#2C315B] transition cursor-pointer shadow-inner"
                        >
                          <option value="Diamond Member" className="bg-[#1C203E] text-white">💎 Diamond Member (Highest Priority SLA)</option>
                          <option value="Silver Member" className="bg-[#1C203E] text-white">🥈 Silver Member (Standard Technical)</option>
                          <option value="Gold Member" className="bg-[#1C203E] text-white">🥇 Gold Member (Priority Technical)</option>
                          <option value="PMP Member" className="bg-[#1C203E] text-white">⭐ PMP Member (Project Mentorship)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 4: Specialist Routing Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Assigned Specialist
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, assignedSpecialist: 'Sachin Sir' })}
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between',
                            formData.assignedSpecialist === 'Sachin Sir'
                              ? 'bg-purple-600/20 border-purple-400 text-white ring-1 ring-purple-400 font-semibold'
                              : 'bg-[#262A4D]/60 border-white/10 text-slate-300 hover:border-white/20'
                          )}
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">Sachin Sir</span>
                            <span className="text-[10px] text-slate-400">All Other Operations</span>
                          </div>
                          {formData.assignedSpecialist === 'Sachin Sir' && (
                            <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, assignedSpecialist: 'Onkar Kulkarni' })}
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between',
                            formData.assignedSpecialist === 'Onkar Kulkarni'
                              ? 'bg-purple-600/20 border-purple-400 text-white ring-1 ring-purple-400 font-semibold'
                              : 'bg-[#262A4D]/60 border-white/10 text-slate-300 hover:border-white/20'
                          )}
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">Onkar Kulkarni</span>
                            <span className="text-[10px] text-purple-300">Meta Only</span>
                          </div>
                          {formData.assignedSpecialist === 'Onkar Kulkarni' && (
                            <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Row 5: Platform & Subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <select
                          value={formData.ecosystem}
                          onChange={e => setFormData({ ...formData, ecosystem: e.target.value as ProductEcosystem })}
                          className="w-full h-12 rounded-2xl bg-[#262A4D]/80 border border-white/15 text-white px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-500/25 focus:bg-[#2C315B] transition cursor-pointer shadow-inner"
                        >
                          <option value="Chakravyuh CRM" className="bg-[#1C203E]">Chakravyuh CRM</option>
                          <option value="Digital Azadi Hub" className="bg-[#1C203E]">Digital Azadi LMS Hub</option>
                          <option value="WordPress & Hosting" className="bg-[#1C203E]">WordPress & Hosting</option>
                          <option value="Other" className="bg-[#1C203E]">Other Technical Inquiries</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={e => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Subject / Summary*"
                          className={cn(
                            'w-full h-12 rounded-2xl bg-[#262A4D]/80 border text-white placeholder-slate-400 px-4 text-sm font-medium transition-all shadow-inner',
                            'focus:outline-none focus:ring-2 focus:border-purple-400 focus:bg-[#2C315B]',
                            errors.subject 
                              ? 'border-red-500 focus:ring-red-500/30' 
                              : 'border-white/15 focus:ring-purple-500/25'
                          )}
                        />
                        {errors.subject && (
                          <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.subject}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 6: Detailed Message / Description */}
                    <div>
                      <div className="relative">
                        <textarea
                          rows={4}
                          name="description"
                          required
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Write your message / query details..."
                          className={cn(
                            'w-full p-4 rounded-2xl bg-[#262A4D]/80 border text-white placeholder-slate-400 text-sm font-medium leading-relaxed resize-none transition-all shadow-inner',
                            'focus:outline-none focus:ring-2 focus:border-purple-400 focus:bg-[#2C315B]',
                            errors.description 
                              ? 'border-red-500 focus:ring-red-500/30' 
                              : 'border-white/15 focus:ring-purple-500/25'
                          )}
                        />
                      </div>
                      {errors.description && (
                        <p className="text-[11px] text-red-400 mt-1 font-medium">{errors.description}</p>
                      )}

                      {/* Quick Issue Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ISSUE_TAGS.map(item => (
                          <button
                            type="button"
                            key={item.tag}
                            onClick={() => handleAppendIssueTag(item.append)}
                            className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] text-slate-300 font-medium transition active:scale-95"
                          >
                            {item.tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Website */}
                    <div>
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="Your Website (Optional)"
                        className="w-full h-11 rounded-2xl bg-[#262A4D]/60 border border-white/10 text-white placeholder-slate-400 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:border-purple-400 focus:bg-[#2C315B] transition shadow-inner"
                      />
                    </div>

                  </div>

                  {/* Send Message Button (Exact Gradient Pill Button from Screenshot) */}
                  <div className="relative z-10 pt-5 mt-4 border-t border-white/10 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        'w-full sm:w-auto px-10 py-3.5 rounded-full text-base font-bold text-white shadow-xl transition-all duration-200',
                        'bg-gradient-to-r from-[#5B4DF6] via-[#943FEF] to-[#EF3899] hover:from-[#6D5DFB] hover:to-[#F54B9F]',
                        'shadow-[0_10px_30px_rgba(239,56,153,0.38)] hover:shadow-[0_14px_40px_rgba(239,56,153,0.55)]',
                        'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 cursor-pointer'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Query...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* SUCCESS CONFIRMATION RECEIPT CARD */}
          {/* ============================================================== */}
          {activeTab === 'submit' && createdTicket && (
            <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Support Query Submitted!
                </h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your query is safely recorded in the Digital Azadi operations queue. Please save your Ticket ID below.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/15 p-6 sm:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                      OFFICIAL TICKET IDENTIFIER
                    </span>
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-wider block mt-1">
                      {createdTicket.ticketId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTicketId}
                    className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-xs font-bold text-white transition flex items-center gap-1.5"
                  >
                    {hasCopiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Requester:</span>
                    <span className="font-bold text-white text-sm">{createdTicket.requesterName}</span>
                    <span className="font-mono text-slate-300 block">{createdTicket.requesterPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Assigned Specialist:</span>
                    <span className="font-bold text-purple-300 text-sm">{createdTicket.assignedSpecialist}</span>
                    <span className="text-slate-400 block">{createdTicket.membershipTier}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">Subject:</span>
                  <p className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-medium text-xs sm:text-sm">
                    {createdTicket.subject}
                  </p>
                </div>

                {/* WhatsApp Chat Link */}
                <a
                  href={`https://wa.me/91${createdTicket.requesterPhone}?text=${encodeURIComponent(`Hello Digital Azadi Support, I have submitted ticket ${createdTicket.ticketId} regarding "${createdTicket.subject}". Please assist.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notify Helpdesk on WhatsApp</span>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTrackTicketId(createdTicket.ticketId);
                    setTrackPhone(createdTicket.requesterPhone);
                    setActiveTab('track');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#5B4DF6] to-[#A855F7] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track Status Live</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Raise Another Query</span>
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: TRACK YOUR TICKET SECTION */}
          {/* ============================================================== */}
          {activeTab === 'track' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300 shadow-md">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Track Your Ticket Status
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Enter your Ticket ID and registered WhatsApp number to verify and check real-time progress.
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleTrackSearch} className="rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/15 p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ticket ID <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={trackTicketId}
                      onChange={e => setTrackTicketId(e.target.value.toUpperCase())}
                      placeholder="e.g. DA-2026-8941"
                      className="w-full h-12 rounded-2xl bg-[#262A4D]/80 border border-white/15 text-white font-mono uppercase px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-500/25 transition shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Registered WhatsApp Number <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-Digit Mobile Number"
                      className="w-full h-12 rounded-2xl bg-[#262A4D]/80 border border-white/15 text-white font-mono px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-500/25 transition shadow-inner"
                    />
                  </div>
                </div>

                {trackError && (
                  <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{trackError}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSearchingTrack}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#5B4DF6] via-[#943FEF] to-[#EF3899] text-white text-sm font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isSearchingTrack ? 'Verifying...' : 'Check Status'}</span>
                  </button>
                </div>
              </form>

              {/* Track Result Card */}
              {trackedTicket && (
                <div className="rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/15 p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                        TICKET STATUS
                      </span>
                      <span className="text-2xl font-mono font-bold text-white block mt-0.5">
                        {trackedTicket.ticketId}
                      </span>
                    </div>
                    <Badge variant="status" value={trackedTicket.status} size="md" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Requester:</span>
                      <span className="font-bold text-white text-sm">{trackedTicket.requesterName}</span>
                      <span className="text-slate-400 block">{trackedTicket.city || 'India'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Assigned Specialist:</span>
                      <span className="font-bold text-purple-300 text-sm">{trackedTicket.assignedSpecialist}</span>
                      <span className="text-slate-400 block">{trackedTicket.membershipTier}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Subject:</span>
                    <p className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-medium text-xs sm:text-sm">
                      {trackedTicket.subject}
                    </p>
                  </div>

                  {trackedTicket.resolutionNotes && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200">
                      <span className="font-bold block mb-1">Resolution Summary:</span>
                      <p>{trackedTicket.resolutionNotes}</p>
                    </div>
                  )}

                  <a
                    href={`https://wa.me/91${trackedTicket.requesterPhone}?text=${encodeURIComponent(`Hello Digital Azadi Support, checking on my ticket ${trackedTicket.ticketId} (${trackedTicket.subject}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* HORIZONTAL GLOWING LENS FLARE DIVIDER (EXACT FROM SCREENSHOT) */}
          {/* ============================================================== */}
          <div className="relative my-10 sm:my-14 flex items-center justify-center">
            <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-purple-400/80 to-transparent shadow-[0_0_15px_#C084FC]" />
            <div className="absolute w-28 h-1.5 bg-gradient-to-r from-transparent via-white to-transparent blur-[2px]" />
          </div>

          {/* ============================================================== */}
          {/* FOOTER SECTION (5 COLUMNS DESIGN FROM SCREENSHOT) */}
          {/* ============================================================== */}
          <footer className="grid grid-cols-2 md:grid-cols-5 gap-8 text-xs text-slate-400">
            
            {/* Column 1: Brand & Contact Info */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <span className="font-black text-white text-sm tracking-wider uppercase block">
                DIGITAL AZADI
              </span>
              <p className="text-[11px] leading-tight text-slate-400">
                support@digitalazadi.com
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                +91 93708 72911
              </p>
              <div className="flex items-center gap-2.5 pt-2 text-slate-400">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 2: Portals */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs block">
                Portals
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li><button type="button" onClick={() => setActiveTab('submit')} className="hover:text-white transition">Raise Query</button></li>
                <li><button type="button" onClick={() => setActiveTab('track')} className="hover:text-white transition">Track Ticket</button></li>
                <li><a href="/admin" className="hover:text-white transition">Operations Deck</a></li>
                <li><a href="/admin" className="hover:text-white transition">Admin Portal</a></li>
              </ul>
            </div>

            {/* Column 3: Ecosystem */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs block">
                Ecosystem
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>Chakravyuh CRM</li>
                <li>LMS Platform</li>
                <li>WordPress & DNS</li>
                <li>WhatsApp WABA</li>
              </ul>
            </div>

            {/* Column 4: Specialists */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs block">
                Specialists
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>Onkar Kulkarni (Meta)</li>
                <li>Sachin Sir (All Ops)</li>
                <li>Priority SLA Queue</li>
                <li>Direct Mentorship</li>
              </ul>
            </div>

            {/* Column 5: Support Hours */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <span className="font-bold text-white text-xs block">
                Support Hours
              </span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Mon - Sat: 10:00 - 19:00 IST.<br />
                Dedicated student resolution desk.
              </p>
            </div>

          </footer>

        </div>

      </main>

      {/* Floating Bottom Quick Tracker FAB Button (Matching Search FAB in Screenshot) */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => {
            setActiveTab(activeTab === 'submit' ? 'track' : 'submit');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-13 h-13 rounded-full bg-white/[0.12] hover:bg-white/[0.2] border border-white/20 backdrop-blur-xl text-white flex items-center justify-center shadow-2xl shadow-black/60 hover:scale-105 active:scale-95 transition-all"
          title={activeTab === 'submit' ? 'Track Ticket Status' : 'Raise Support Query'}
        >
          {activeTab === 'submit' ? (
            <Search className="w-5 h-5 text-purple-300" />
          ) : (
            <HelpCircle className="w-5 h-5 text-purple-300" />
          )}
        </button>
      </div>

    </div>
  );
};
