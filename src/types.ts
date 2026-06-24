/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Occupation =
  | 'brand_shopify'
  | 'brand_amazon'
  | 'brand_retail'
  | 'brand_startup'
  | 'brand_agency'
  | 'brand_other';

export type ExperienceLevel =
  | 'rev_early'
  | 'rev_growing'
  | 'rev_scale'
  | 'rev_enterprise';

export type Interest =
  | 'service_perf_marketing'
  | 'service_marketplace'
  | 'service_shopify_dev'
  | 'service_seo_organic'
  | 'service_brand_creative'
  | 'service_automation';

export interface LeadFormData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  websiteUrl: string;
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
  companyName?: string;
  websiteUrl?: string;
  occupation?: string;
  experienceLevel?: string;
  interests?: string;
}
