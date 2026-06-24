/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Occupation =
  | 'student'
  | 'working_professional'
  | 'freelancer'
  | 'business_owner'
  | 'marketing_professional'
  | 'designer'
  | 'developer'
  | 'ai_enthusiast'
  | 'content_creator'
  | 'sales_professional'
  | 'teacher'
  | 'job_seeker'
  | 'startup_founder'
  | 'other';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type Interest =
  | 'ai_tools'
  | 'prompt_engineering'
  | 'ai_automation'
  | 'ai_content_creation'
  | 'ai_marketing'
  | 'ai_development'
  | 'ai_agents'
  | 'productivity_systems';

export interface LeadFormData {
  fullName: string;
  email: string;
  phone: string;
  occupation: Occupation | '';
  experienceLevel: ExperienceLevel | '';
  interests: Interest[];
}

export interface LeadSubmission extends LeadFormData {
  id: string; // Dynamic FAI-YYYY-XXXXXX style
  timestamp: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isSynced?: boolean;
}

export interface WebhookSettings {
  url: string;
  isEnabled: boolean;
}

export interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  occupation?: string;
  experienceLevel?: string;
  interests?: string;
}
