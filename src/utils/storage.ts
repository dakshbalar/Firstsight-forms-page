/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LeadSubmission, LeadFormData, WebhookSettings } from '../types';

const LEADS_STORAGE_KEY = 'first_ai_captured_leads';
const WEBHOOK_STORAGE_KEY = 'first_ai_webhook_settings';

// Generate dynamic Reference ID like FAI-2026-001284
export function generateReferenceId(existingCount: number): string {
  const currentYear = new Date().getFullYear();
  const baseCounter = 1284 + existingCount;
  const paddedCounter = String(baseCounter).padStart(6, '0');
  return `FS-${currentYear}-${paddedCounter}`;
}

// Get all submissions from localStorage
export function getStoredLeads(): LeadSubmission[] {
  try {
    const rawData = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!rawData) {
      // Seed B2B e-commerce growth partner mock entries if empty
      const initialSeed: LeadSubmission[] = [
        {
          id: 'FS-2026-001280',
          fullName: 'Sarah Jenkins',
          email: 'sarah.j@snackbyte.com',
          phone: '+91 98765 43210',
          companyName: 'SnackByte Foods',
          websiteUrl: 'snackbyte.co',
          occupation: 'brand_shopify',
          experienceLevel: 'rev_growing',
          interests: ['service_perf_marketing', 'service_automation'],
          timestamp: '2026-06-21T10:14:32.000Z',
        },
        {
          id: 'FS-2026-001281',
          fullName: 'Marcus Chen',
          email: 'm.chen@aurajewels.in',
          phone: '+91 91234 56789',
          companyName: 'Aura Premium Jewels',
          websiteUrl: 'aurajewels.in',
          occupation: 'brand_amazon',
          experienceLevel: 'rev_scale',
          interests: ['service_marketplace', 'service_brand_creative'],
          timestamp: '2026-06-22T14:45:10.000Z',
        },
        {
          id: 'FS-2026-001282',
          fullName: 'Rajesh Mehta',
          email: 'rajesh@mehtahomeware.com',
          phone: '+91 98222 33344',
          companyName: 'Mehta Homeware',
          websiteUrl: 'mehtahomeware.com',
          occupation: 'brand_retail',
          experienceLevel: 'rev_enterprise',
          interests: ['service_shopify_dev', 'service_seo_organic', 'service_perf_marketing'],
          timestamp: '2026-06-23T09:30:15.000Z',
        },
      ];
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(initialSeed));
      return initialSeed;
    }
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to load stored leads:', error);
    return [];
  }
}

// Add a new submission
export async function addLeadSubmission(formData: LeadFormData): Promise<LeadSubmission> {
  const existingLeads = getStoredLeads();
  const newId = generateReferenceId(existingLeads.length);

  // Parse UTM values from current window URL
  let utmSource = 'direct';
  let utmMedium = 'web';
  let utmCampaign = 'firstsight_b2b_growth';

  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      utmSource = params.get('utm_source') || 'direct';
      utmMedium = params.get('utm_medium') || 'web';
      utmCampaign = params.get('utm_campaign') || 'firstsight_b2b_growth';
    } catch (e) {
      console.error('Error parsing UTM values:', e);
    }
  }

  const newSubmission: LeadSubmission = {
    ...formData,
    id: newId,
    timestamp: new Date().toISOString(),
    utmSource,
    utmMedium,
    utmCampaign,
  };

  const updatedLeads = [newSubmission, ...existingLeads];
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updatedLeads));

  // Trigger Webhook if enabled
  const webhookSettings = getWebhookSettings();
  if (webhookSettings.isEnabled && webhookSettings.url) {
    try {
      const payload = {
        Timestamp: newSubmission.timestamp,
        'Reference ID': newSubmission.id,
        'Full Name': newSubmission.fullName,
        Email: newSubmission.email,
        Phone: newSubmission.phone,
        'Company Name': newSubmission.companyName,
        'Website URL': newSubmission.websiteUrl,
        'Sales Channel': getOccupationLabel(newSubmission.occupation),
        'Monthly Revenue': getExperienceLabel(newSubmission.experienceLevel),
        'Services Needed': newSubmission.interests.map(getInterestLabel).join(', '),
      };

      await fetch(webhookSettings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      console.log('Webhook dispatched successfully for ID:', newId);
    } catch (e) {
      console.error('Failed to dispatch webhook:', e);
    }
  }

  return newSubmission;
}

// Clear lead logs
export function clearStoredLeads(): void {
  localStorage.removeItem(LEADS_STORAGE_KEY);
}

// Webhook Settings management
export function getWebhookSettings(): WebhookSettings {
  try {
    const raw = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    if (!raw) {
      return { url: '', isEnabled: false };
    }
    return JSON.parse(raw);
  } catch {
    return { url: '', isEnabled: false };
  }
}

export function saveWebhookSettings(settings: WebhookSettings): void {
  localStorage.setItem(WEBHOOK_STORAGE_KEY, JSON.stringify(settings));
}

// Labels formatting helper
export function getOccupationLabel(value: string): string {
  switch (value) {
    case 'brand_shopify':
      return 'D2C Brand (Shopify/Woo)';
    case 'brand_amazon':
      return 'Marketplace Seller (Amazon/Flipkart)';
    case 'brand_retail':
      return 'Retail / Offline Brand';
    case 'brand_startup':
      return 'Pre-launch Brand';
    case 'brand_agency':
      return 'Agency Partner';
    case 'brand_other':
      return 'Other Business Model';
    default:
      return value || 'Not Specified';
  }
}

export function getExperienceLabel(value: string): string {
  switch (value) {
    case 'rev_early':
      return 'Early Stage (< ₹5 Lakhs /mo)';
    case 'rev_growing':
      return 'Growing (₹5 - ₹20 Lakhs /mo)';
    case 'rev_scale':
      return 'Established (₹20 - ₹50 Lakhs /mo)';
    case 'rev_enterprise':
      return 'Enterprise (₹50 Lakhs+ /mo)';
    default:
      return value || 'Not Specified';
  }
}

export function getInterestLabel(value: string): string {
  switch (value) {
    case 'service_perf_marketing':
      return 'Performance Marketing';
    case 'service_marketplace':
      return 'Marketplace Growth';
    case 'service_shopify_dev':
      return 'Shopify Store Development';
    case 'service_seo_organic':
      return 'SEO & Organic Growth';
    case 'service_brand_creative':
      return 'Creative & Video Ads';
    case 'service_automation':
      return 'Marketing & Retention Automation';
    default:
      return value;
  }
}

// Convert leads array to CSV string
export function exportToCSV(leads: LeadSubmission[]): string {
  const headers = ['Timestamp', 'Reference ID', 'Contact Name', 'Email', 'Phone', 'Company Name', 'Website', 'Business Type', 'Monthly Revenue', 'Services Needed'];
  const rows = leads.map(lead => [
    lead.timestamp,
    lead.id,
    `"${lead.fullName.replace(/"/g, '""')}"`,
    lead.email,
    lead.phone,
    `"${lead.companyName.replace(/"/g, '""')}"`,
    `"${lead.websiteUrl.replace(/"/g, '""')}"`,
    getOccupationLabel(lead.occupation),
    getExperienceLabel(lead.experienceLevel),
    `"${lead.interests.map(getInterestLabel).join(', ').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
