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
  // We can pad with leading zeros, start counter around 1284 or generate a elegant number based on index
  const baseCounter = 1284 + existingCount;
  const paddedCounter = String(baseCounter).padStart(6, '0');
  return `FAI-${currentYear}-${paddedCounter}`;
}

// Get all submissions from localStorage
export function getStoredLeads(): LeadSubmission[] {
  try {
    const rawData = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!rawData) {
      // Seed some beautiful, high-fidelity mock entries if empty, so the admin preview looks active and real!
      const initialSeed: LeadSubmission[] = [
        {
          id: 'FAI-2026-001280',
          fullName: 'Sarah Jenkins',
          email: 'sarah.j@techstart.io',
          phone: '+1 (555) 019-2834',
          occupation: 'working_professional',
          experienceLevel: 'intermediate',
          interests: ['ai_automation', 'prompt_engineering', 'ai_agents'],
          timestamp: '2026-06-21T10:14:32.000Z',
        },
        {
          id: 'FAI-2026-001281',
          fullName: 'Marcus Chen',
          email: 'm.chen@creative-studio.com',
          phone: '+1 (555) 014-9921',
          occupation: 'business_owner',
          experienceLevel: 'beginner',
          interests: ['ai_content_creation', 'ai_marketing', 'productivity_systems'],
          timestamp: '2026-06-22T14:45:10.000Z',
        },
        {
          id: 'FAI-2026-001282',
          fullName: 'Elena Rostova',
          email: 'elena.rostov@edu.org',
          phone: '+1 (555) 017-4830',
          occupation: 'student',
          experienceLevel: 'advanced',
          interests: ['ai_tools', 'ai_development', 'prompt_engineering'],
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
  let utmCampaign = 'first_sight_luxury';

  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      utmSource = params.get('utm_source') || 'direct';
      utmMedium = params.get('utm_medium') || 'web';
      utmCampaign = params.get('utm_campaign') || 'first_sight_luxury';
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

  // Trigger real Webhook if enabled and URL is provided
  const webhookSettings = getWebhookSettings();
  if (webhookSettings.isEnabled && webhookSettings.url) {
    try {
      // Map keys to premium human-readable Google Sheets friendly keys
      const payload = {
        Timestamp: newSubmission.timestamp,
        'Reference ID': newSubmission.id,
        'Full Name': newSubmission.fullName,
        Email: newSubmission.email,
        Phone: newSubmission.phone,
        Occupation: getOccupationLabel(newSubmission.occupation),
        Experience: getExperienceLabel(newSubmission.experienceLevel),
        Interests: newSubmission.interests.map(getInterestLabel).join(', '),
      };

      // Since we are inside client side iframe, we perform a non-blocking fetch
      // Mode 'no-cors' allows sending to arbitrary endpoints like Google Apps Script without failing on CORS
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
    case 'student':
      return 'Student';
    case 'working_professional':
      return 'Working Professional';
    case 'freelancer':
      return 'Freelancer';
    case 'business_owner':
      return 'Business Owner';
    case 'marketing_professional':
      return 'Marketing Professional';
    case 'designer':
      return 'Designer';
    case 'developer':
      return 'Developer';
    case 'ai_enthusiast':
      return 'AI Enthusiast';
    case 'content_creator':
      return 'Content Creator';
    case 'sales_professional':
      return 'Sales Professional';
    case 'teacher':
      return 'Teacher';
    case 'job_seeker':
      return 'Job Seeker';
    case 'startup_founder':
      return 'Startup Founder';
    case 'other':
      return 'Other';
    default:
      return value || 'Not Specified';
  }
}

export function getExperienceLabel(value: string): string {
  switch (value) {
    case 'beginner':
      return 'Beginner (0-1 yrs)';
    case 'intermediate':
      return 'Intermediate (1-3 yrs)';
    case 'advanced':
      return 'Advanced (3+ yrs)';
    default:
      return value || 'Not Specified';
  }
}

export function getInterestLabel(value: string): string {
  switch (value) {
    case 'ai_tools':
      return 'AI Tools Explorer';
    case 'prompt_engineering':
      return 'Prompt Engineering';
    case 'ai_automation':
      return 'AI Workflow Automation';
    case 'ai_content_creation':
      return 'AI Content Creation';
    case 'ai_marketing':
      return 'AI Growth Marketing';
    case 'ai_development':
      return 'AI Development & Coding';
    case 'ai_agents':
      return 'Autonomous AI Agents';
    case 'productivity_systems':
      return 'Productivity Systems';
    default:
      return value;
  }
}

// Convert leads array to CSV string
export function exportToCSV(leads: LeadSubmission[]): string {
  const headers = ['Timestamp', 'Reference ID', 'Full Name', 'Email', 'Phone', 'Occupation', 'Experience Level', 'Learning Interests'];
  const rows = leads.map(lead => [
    lead.timestamp,
    lead.id,
    `"${lead.fullName.replace(/"/g, '""')}"`,
    lead.email,
    lead.phone,
    getOccupationLabel(lead.occupation),
    getExperienceLabel(lead.experienceLevel),
    `"${lead.interests.map(getInterestLabel).join(', ').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
