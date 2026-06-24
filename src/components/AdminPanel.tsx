/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getStoredLeads,
  clearStoredLeads,
  getWebhookSettings,
  saveWebhookSettings,
  getOccupationLabel,
  getExperienceLabel,
  getInterestLabel,
  exportToCSV,
} from '../utils/storage';
import { LeadSubmission, WebhookSettings } from '../types';
import {
  Database,
  Search,
  Download,
  Trash2,
  Globe,
  Settings,
  X,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ExternalLink,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
  createLeadsSpreadsheet,
  syncLeadsToSpreadsheet,
} from '../utils/googleSheets';
import { User } from 'firebase/auth';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [leads, setLeads] = useState<LeadSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInterest, setFilterInterest] = useState('all');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true); // Default true for frictionless preview, but support passkey toggle
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  useEffect(() => {
    setLeads(getStoredLeads());
    const settings = getWebhookSettings();
    setWebhookUrl(settings.url);
    setWebhookEnabled(settings.isEnabled);

    // Read saved sheet information
    const savedId = localStorage.getItem('first_ai_spreadsheet_id') || '';
    const savedUrl = localStorage.getItem('first_ai_spreadsheet_url') || '';
    setSpreadsheetId(savedId);
    setSpreadsheetUrl(savedUrl);

    // Initialize Google Sheets / Auth state listener
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    saveWebhookSettings({ url: webhookUrl, isEnabled: webhookEnabled });
    triggerNotification('Webhook settings saved successfully!');
  };

  const handleGoogleConnect = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        triggerNotification('Connected to Google Sheets successfully!');
      }
    } catch (e) {
      console.error(e);
      triggerNotification('Failed to connect with Google.', 'error');
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      triggerNotification('Disconnected Google account.');
    } catch (e) {
      console.error(e);
      triggerNotification('Error signing out.', 'error');
    }
  };

  const handleCreateSpreadsheet = async () => {
    if (!googleToken) {
      triggerNotification('Please connect your Google Account first.', 'error');
      return;
    }
    setIsCreatingSheet(true);
    try {
      const result = await createLeadsSpreadsheet(googleToken);
      setSpreadsheetId(result.id);
      setSpreadsheetUrl(result.url);
      localStorage.setItem('first_ai_spreadsheet_id', result.id);
      localStorage.setItem('first_ai_spreadsheet_url', result.url);
      triggerNotification('Google Spreadsheet created successfully in your Drive!');
    } catch (e) {
      console.error(e);
      triggerNotification('Failed to create spreadsheet. Try reconnecting.', 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncAll = async () => {
    if (!googleToken || !spreadsheetId) {
      triggerNotification('Google Sheets integration is not fully configured.', 'error');
      return;
    }
    if (leads.length === 0) {
      triggerNotification('No leads to sync!', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const success = await syncLeadsToSpreadsheet(googleToken, spreadsheetId, leads);
      if (success) {
        // Mark all current leads as synced in state and local storage
        const updatedLeads = leads.map(l => ({ ...l, isSynced: true }));
        localStorage.setItem('first_ai_captured_leads', JSON.stringify(updatedLeads));
        setLeads(updatedLeads);
        triggerNotification(`Synced ${leads.length} leads to Google Sheets successfully!`);
      } else {
        triggerNotification('Sync failed. Please verify spreadsheet exists and permissions are valid.', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerNotification('Sync error occurred.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCSV = () => {
    if (leads.length === 0) {
      triggerNotification('No leads to export!', 'error');
      return;
    }
    const csvContent = exportToCSV(leads);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `First_AI_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('CSV download started.');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to purge all captured lead records? This cannot be undone.')) {
      clearStoredLeads();
      setLeads([]);
      triggerNotification('Lead records purged successfully.');
    }
  };

  const handleDeleteIndividual = (id: string) => {
    if (window.confirm(`Delete lead entry ${id}?`)) {
      const updated = leads.filter(l => l.id !== id);
      localStorage.setItem('first_ai_captured_leads', JSON.stringify(updated));
      setLeads(updated);
      triggerNotification(`Lead ${id} deleted.`);
    }
  };

  // Filter and search computation
  const filteredLeads = leads.filter(lead => {
    const searchString = `${lead.fullName} ${lead.email} ${lead.phone} ${lead.id} ${lead.companyName || ''} ${lead.websiteUrl || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesFilter = filterInterest === 'all' || lead.interests.includes(filterInterest as any);
    return matchesSearch && matchesFilter;
  });

  return (
    <div id="admin_portal_container" className="min-h-screen bg-[#0A0A0A] text-white py-12 px-4 sm:px-8 mt-20 relative animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header Title with stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-brand-yellow font-mono text-sm mb-2">
              <Database className="w-4 h-4 animate-pulse" />
              <span>FIRSTSIGHT B2B ENQUIRIES</span>
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Admin Control Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Analyze, manage, and dispatch real-time lead application data arriving from your ad campaigns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWebhookConfig(!showWebhookConfig)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showWebhookConfig
                  ? 'bg-brand-yellow text-black shadow-md'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Google Sheets Integration</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-white/95 rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium transition-all"
              title="Purge database logs"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden lg:inline">Purge Logs</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Notifications Bar */}
        {notification && (
          <div
            className={`fixed top-24 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ${
              notification.type === 'error'
                ? 'bg-red-950 border-red-800 text-red-200'
                : 'bg-emerald-950 border-emerald-800 text-emerald-200'
            }`}
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        {/* Native Google Sheets Integration Section */}
        {showWebhookConfig && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 bg-[#0B0B0B] border border-white/[0.08] rounded-3xl p-6 sm:p-8 animate-slide-down relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
            
            {/* Left Column: Google OAuth & Sheets creation */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-lg font-display font-bold mb-2 flex items-center gap-2 text-brand-yellow">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Native Google Sheets Sync</span>
                </h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Connect your Google Workspace account to dynamically push form submissions directly to a secure, formatted spreadsheet in your Google Drive.
                </p>

                {!googleUser ? (
                  /* User is disconnected: Show Connect Google CTA */
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-4">
                    <p className="text-xs text-gray-300">
                      Sign in with Google to securely authorize spreadsheet creation and record appending.
                    </p>
                    
                    <button
                      onClick={handleGoogleConnect}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black hover:bg-white/90 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-md"
                    >
                      {/* Google Icon Vector */}
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  </div>
                ) : (
                  /* User is connected: Show spreadsheet creation / actions */
                  <div className="space-y-4">
                    {/* Google User Profile card */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        {googleUser.photoURL ? (
                          <img
                            src={googleUser.photoURL}
                            alt={googleUser.displayName || ''}
                            className="w-10 h-10 rounded-full border border-brand-yellow/30"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow font-bold">
                            {googleUser.displayName?.[0] || 'G'}
                          </div>
                        )}
                        <div>
                          <strong className="block text-xs text-white">{googleUser.displayName}</strong>
                          <span className="block text-[10px] text-gray-400 font-mono">{googleUser.email}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleGoogleDisconnect}
                        className="text-[10px] text-red-400 hover:text-red-300 font-mono uppercase tracking-widest font-bold cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>

                    {/* Spreadsheet controller */}
                    <div className="space-y-3.5 pt-2">
                      {!spreadsheetId ? (
                        <button
                          onClick={handleCreateSpreadsheet}
                          disabled={isCreatingSheet}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-yellow text-black hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-400 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer"
                        >
                          {isCreatingSheet ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Generating Spreadsheet...</span>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>Create FirstSight Spreadsheet</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {/* Active spreadsheet info */}
                          <div className="p-4.5 bg-black border border-white/5 rounded-2xl">
                            <span className="text-[9px] uppercase font-mono tracking-widest text-brand-yellow block font-bold">Linked Google Spreadsheet</span>
                            <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed truncate font-mono">ID: {spreadsheetId}</span>
                            
                            <a
                              href={spreadsheetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mt-3 transition-colors cursor-pointer"
                            >
                              <span>Open Live Google Sheet</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Sync controller buttons */}
                          <div className="grid grid-cols-2 gap-3.5">
                            <button
                              onClick={handleSyncAll}
                              disabled={isSyncing}
                              className="flex items-center justify-center gap-2 p-3 bg-white text-black hover:bg-white/90 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
                            >
                              {isSyncing ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span>Bulk Sync Leads</span>
                            </button>

                            <button
                              onClick={handleCreateSpreadsheet}
                              disabled={isCreatingSheet}
                              className="flex items-center justify-center gap-2 p-3 border border-white/10 text-gray-300 hover:bg-white/5 disabled:bg-transparent disabled:text-gray-600 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                              title="Generate a brand new sheet"
                            >
                              <span>New Sheet</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status footer */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span>Google Integration Status</span>
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${googleUser && spreadsheetId ? 'bg-emerald-500 animate-pulse' : googleUser ? 'bg-amber-500' : 'bg-gray-700'}`} />
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
                    {googleUser && spreadsheetId ? 'SYNC ACTIVE' : googleUser ? 'SPREADSHEET MISSING' : 'OFFLINE'}
                  </span>
                </span>
              </div>
            </div>

            {/* Right Column: Webhook Backup Config & Instructions */}
            <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-display font-bold mb-2 flex items-center gap-2 text-[#A1A1AA]">
                  <Globe className="w-5 h-5" />
                  <span>Backup Webhook Integration</span>
                </h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Optional. Connect external automation triggers like Zapier, Make, n8n, or a Google Apps Script endpoint as a dual sync buffer.
                </p>

                <form onSubmit={handleSaveWebhook} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase font-semibold">Webhook URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-yellow/80 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="webhook_enable_toggle"
                      checked={webhookEnabled}
                      onChange={e => setWebhookEnabled(e.target.checked)}
                      className="w-4 h-4 text-brand-yellow bg-black border-white/20 rounded focus:ring-offset-black focus:ring-brand-yellow"
                    />
                    <label htmlFor="webhook_enable_toggle" className="text-xs font-medium text-gray-300 select-none cursor-pointer font-sans">
                      Enable Real-Time Dispatch on Lead Submit
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#111111] hover:bg-[#161616] border border-white/10 hover:border-white/20 text-white py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Save Webhook Settings
                  </button>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span>Webhook Connection Status</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider font-semibold">
                  <span className={`w-2 h-2 rounded-full ${webhookEnabled && webhookUrl ? 'bg-emerald-500 animate-pulse' : 'bg-gray-700'}`} />
                  <span>{webhookEnabled && webhookUrl ? 'ACTIVE' : 'INACTIVE'}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid - Stats & Leads List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Stats sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-xs font-mono text-gray-400 mb-4 uppercase tracking-wider">Metrics Overview</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div>
                  <span className="text-gray-400 text-xs">Total Lead Entries</span>
                  <p className="text-3xl font-display font-bold text-brand-yellow mt-0.5">{leads.length}</p>
                </div>
                <div className="lg:border-t lg:border-white/10 lg:pt-4">
                  <span className="text-gray-400 text-xs font-sans">Active Integration</span>
                  <p className="text-sm font-mono text-white font-medium mt-1 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${webhookEnabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {webhookEnabled ? 'Sheets Webhook' : 'LocalStorage Only'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interest distribution stats card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-xs font-mono text-gray-400 mb-3.5 uppercase tracking-wider">Filter Interests</h3>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Services' },
                  { id: 'service_perf_marketing', label: 'Performance Marketing' },
                  { id: 'service_marketplace', label: 'Marketplace Growth' },
                  { id: 'service_shopify_dev', label: 'Shopify Store Development' },
                  { id: 'service_seo_organic', label: 'SEO & Organic Growth' },
                  { id: 'service_brand_creative', label: 'Creative & Video Ads' },
                  { id: 'service_automation', label: 'Marketing Automation' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFilterInterest(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      filterInterest === item.id
                        ? 'bg-brand-yellow text-black font-semibold'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Leads List */}
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
              <h2 className="text-lg font-display font-bold flex items-center gap-2">
                <span>Application Records</span>
                <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-gray-400 font-normal">
                  {filteredLeads.length} of {leads.length} leads
                </span>
              </h2>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black border border-white/10 rounded-xl text-xs placeholder-gray-500 focus:outline-none focus:border-brand-yellow/80 text-white"
                />
              </div>
            </div>

            {/* List Table wrapper */}
            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-xl">
                <Database className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-400">No application submissions found</p>
                <p className="text-xs text-gray-500 mt-1">Try modifying your search queries or complete a lead form submit!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono text-gray-400 uppercase tracking-wider pb-3">
                      <th className="py-3 px-2 font-semibold">Ref ID &amp; Timestamp</th>
                      <th className="py-3 px-2 font-semibold">Contact Details</th>
                      <th className="py-3 px-2 font-semibold">Brand &amp; Website</th>
                      <th className="py-3 px-2 font-semibold">Channel &amp; Revenue</th>
                      <th className="py-3 px-2 font-semibold">Services Requested</th>
                      <th className="py-3 px-2 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Ref & Time */}
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-brand-yellow font-semibold block">{lead.id}</span>
                            {lead.isSynced ? (
                              <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold" title="Synced to Google Sheets">
                                Synced
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-gray-500 px-1.5 py-0.5 rounded" title="Stored locally only">
                                Local
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 block mt-0.5">
                            {new Date(lead.timestamp).toLocaleString()}
                          </span>
                        </td>

                        {/* Contact Person Name, Email, Phone */}
                        <td className="py-4 px-2">
                          <span className="font-semibold text-white block">{lead.fullName}</span>
                          <span className="text-gray-400 block mt-0.5">{lead.email}</span>
                          <span className="text-gray-500 text-[11px] block mt-0.5 font-mono">{lead.phone}</span>
                        </td>

                        {/* Brand & Website URL */}
                        <td className="py-4 px-2">
                          <span className="font-semibold text-gray-200 block">{lead.companyName || 'Not Specified'}</span>
                          {lead.websiteUrl ? (
                            <a
                              href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-yellow/80 hover:text-brand-yellow hover:underline block mt-0.5 font-mono text-[11px] truncate max-w-[150px]"
                            >
                              {lead.websiteUrl}
                            </a>
                          ) : (
                            <span className="text-gray-600 block mt-0.5 italic text-[11px]">No Website</span>
                          )}
                        </td>

                        {/* Occupation & Experience (Channel & Revenue) */}
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px] inline-block mb-1.5 font-medium">
                            {getOccupationLabel(lead.occupation)}
                          </span>
                          <span className="block text-[11px] text-gray-400">
                            Rev: <strong className="text-brand-yellow font-mono">{getExperienceLabel(lead.experienceLevel)}</strong>
                          </span>
                        </td>

                        {/* Learning Interests */}
                        <td className="py-4 px-2 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {lead.interests.map(int => (
                              <span
                                key={int}
                                className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-brand-yellow px-1.5 py-0.5 rounded"
                              >
                                {getInterestLabel(int)}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Delete action */}
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => handleDeleteIndividual(lead.id)}
                            className="p-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 rounded-lg opacity-80 group-hover:opacity-100 transition-all border border-red-900/10 hover:border-red-500/30"
                            title="Delete this entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
