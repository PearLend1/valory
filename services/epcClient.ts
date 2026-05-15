/**
 * EPC Open Data API Client
 * Fetches energy performance certificate data by postcode or LMK-key
 * Docs: https://epc.opendatacommunities.org/docs/api
 */

import axios from 'axios';

const EPC_API_BASE = 'https://epc.opendatacommunities.org/api/v1';

export interface EPCCertificate {
  lmkKey: string;
  postcode: string;
  address: string;
  energyRating: string; // A-G
  energyRatingScore: number; // 0-100
  floorArea: number; // m²
  propertyType: string;
  builtForm: string;
  constructionAgeBand: string;
  heatingFuel: string;
  certificateDate: string;
  expiryDate: string;
}

export interface EPCSearchResult {
  data: EPCCertificate[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
}

/**
 * Search EPC certificates by postcode
 * Returns the most recent certificate for each property
 */
export async function searchEPCByPostcode(
  postcode: string,
  apiKey?: string
): Promise<EPCCertificate[]> {
  try {
    const params: Record<string, any> = {
      postcode: postcode.replace(/\s+/g, '').toUpperCase(),
      size: 100, // Max results per page
    };

    // Add API key if provided (optional for public data)
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await axios.get<EPCSearchResult>(
      `${EPC_API_BASE}/search`,
      { params, headers, timeout: 10000 }
    );

    // Transform API response to our interface
    return response.data.data.map(cert => ({
      lmkKey: cert.lmkKey,
      postcode: cert.postcode,
      address: cert.address,
      energyRating: cert.energyRating,
      energyRatingScore: cert.energyRatingScore,
      floorArea: cert.floorArea,
      propertyType: cert.propertyType,
      builtForm: cert.builtForm,
      constructionAgeBand: cert.constructionAgeBand,
      heatingFuel: cert.heatingFuel,
      certificateDate: cert.certificateDate,
      expiryDate: cert.expiryDate,
    }));
  } catch (error) {
    console.error('[EPC Client] Failed to search by postcode:', error);
    throw new Error(`EPC API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get specific EPC certificate by LMK-key
 */
export async function getEPCByLmkKey(
  lmkKey: string,
  apiKey?: string
): Promise<EPCCertificate | null> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await axios.get<EPCCertificate>(
      `${EPC_API_BASE}/certificates/${lmkKey}`,
      { headers, timeout: 10000 }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // Certificate not found
    }
    console.error('[EPC Client] Failed to get certificate by LMK-key:', error);
    throw new Error(`EPC API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract valuation signals from EPC data
 */
export function extractEPCSignals(cert: EPCCertificate): {
  energyEfficiency: string;
  estimatedAnnualCost: string;
  improvementPotential: string;
  floorAreaSignal: string;
} {
  const ratingToEfficiency: Record<string, string> = {
    'A': 'Very High',
    'B': 'High',
    'C': 'Good',
    'D': 'Average',
    'E': 'Poor',
    'F': 'Very Poor',
    'G': 'Extremely Poor',
  };

  return {
    energyEfficiency: ratingToEfficiency[cert.energyRating] || 'Unknown',
    estimatedAnnualCost: `£${Math.round(cert.energyRatingScore * 50)}`, // Rough estimate
    improvementPotential: cert.energyRating >= 'D' ? 'Limited' : 'Significant',
    floorAreaSignal: `${Math.round(cert.floorArea)} m²`,
  };
}
