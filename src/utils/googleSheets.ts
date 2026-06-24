/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { LeadSubmission } from '../types';
import { getOccupationLabel, getInterestLabel, getExperienceLabel } from './storage';

// 1. Initialize Firebase App and Auth if not already done
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth: Auth = getAuth(app);

// 2. Google OAuth Provider with appropriate Sheets & Drive scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// 3. Initialize Auth State Listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Try to retrieve or fallback
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// 4. Perform Google Sign In Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get current cached access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Perform logout
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * 5. Create a new Google Spreadsheet for lead capture
 */
export async function createLeadsSpreadsheet(token: string): Promise<{ id: string; url: string }> {
  try {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: 'FirstSight. Lead Capture Records',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl;

    // Immediately add the Header Row
    await appendHeaders(token, spreadsheetId);

    return { id: spreadsheetId, url: spreadsheetUrl };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Helper to append the default high-fidelity headers to a spreadsheet
 */
async function appendHeaders(token: string, spreadsheetId: string): Promise<void> {
  const headers = [
    [
      'Timestamp (UTC)',
      'Reference ID',
      'Contact Name',
      'Email Address',
      'Mobile Number',
      'Company Name',
      'Website URL',
      'Sales Channel / Brand Type',
      'Monthly Revenue Stage',
      'Services Needed',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
    ],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Sheet1!A1',
        majorDimension: 'ROWS',
        values: headers,
      }),
    }
  );
}

/**
 * 6. Sync existing or bulk leads into the selected Google Spreadsheet
 */
export async function syncLeadsToSpreadsheet(
  token: string,
  spreadsheetId: string,
  leads: LeadSubmission[]
): Promise<boolean> {
  try {
    if (leads.length === 0) return true;

    // Build values rows (We write newest leads first, or reverse them to match chronological order)
    const sortedLeads = [...leads].reverse(); // oldest first to write chronologically down the sheet
    const values = sortedLeads.map(lead => [
      lead.timestamp,
      lead.id,
      lead.fullName,
      lead.email,
      lead.phone,
      lead.companyName || '',
      lead.websiteUrl || '',
      getOccupationLabel(lead.occupation),
      getExperienceLabel(lead.experienceLevel),
      lead.interests.map(getInterestLabel).join(', '),
      lead.utmSource || 'direct',
      lead.utmMedium || 'web',
      lead.utmCampaign || 'firstsight_b2b_growth',
    ]);

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: 'Sheet1!A2',
          majorDimension: 'ROWS',
          values: values,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Spreadsheet batch write failed:', errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error syncing leads bulk:', error);
    return false;
  }
}

/**
 * 7. Append a single lead to a Google Spreadsheet in real-time
 */
export async function appendLeadToSpreadsheet(
  token: string,
  spreadsheetId: string,
  lead: LeadSubmission
): Promise<boolean> {
  try {
    const values = [
      [
        lead.timestamp,
        lead.id,
        lead.fullName,
        lead.email,
        lead.phone,
        lead.companyName || '',
        lead.websiteUrl || '',
        getOccupationLabel(lead.occupation),
        getExperienceLabel(lead.experienceLevel),
        lead.interests.map(getInterestLabel).join(', '),
        lead.utmSource || 'direct',
        lead.utmMedium || 'web',
        lead.utmCampaign || 'firstsight_b2b_growth',
      ],
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: 'Sheet1!A2',
          majorDimension: 'ROWS',
          values: values,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error appending single lead to spreadsheet:', error);
    return false;
  }
}
