/**
 * Valuation Engine
 * Integrates multiple data sources to generate property valuations
 * Returns price band (low/high) + confidence + signals for explainability
 */

import { searchEPCByPostcode, extractEPCSignals } from './epcClient';
import { getAmenityCounts, extractAmenitySignals } from './osmOverpass';
import { getComparableSales, calculateMedianPrice } from '../jobs/ppdImport';
import { getPostcodeData } from '../jobs/onspdImport';
import { getCachedEPC, getCachedOverpass, cacheKeys, CACHE_TTL } from './cacheManager';

export interface ValuationSignal {
  name: string;
  value: string | number;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
}

export interface ValuationResult {
  propertyId?: number;
  postcode: string;
  estimatedLowPrice: number;
  estimatedHighPrice: number;
  medianPrice: number;
  confidence: number; // 0-100
  signals: ValuationSignal[];
  dataSourcesUsed: string[];
  generatedAt: Date;
  validUntil: Date;
}

/**
 * Generate comprehensive property valuation
 */
export async function generateValuation(
  postcode: string,
  propertyType: string,
  latitude?: number,
  longitude?: number
): Promise<ValuationResult> {
  const signals: ValuationSignal[] = [];
  const dataSourcesUsed: string[] = [];
  let basePrice = 250000; // Default base price
  let priceAdjustment = 0;
  let confidence = 50;

  try {
    // 1. Get comparable sales from Land Registry data
    console.log('[Valuation] Fetching comparable sales...');
    const comparables = await getComparableSales(postcode, propertyType, 10);
    
    if (comparables.length > 0) {
      dataSourcesUsed.push('Land Registry Price Paid Data');
      const medianPrice = calculateMedianPrice(comparables);
      
      if (medianPrice) {
        basePrice = medianPrice;
        confidence = Math.min(100, 60 + comparables.length * 3); // Confidence increases with more comparables
        
        signals.push({
          name: 'Comparable Sales',
          value: `${comparables.length} recent sales`,
          impact: 'positive',
          weight: 0.4,
        });
      }
    }

    // 2. Get EPC energy rating and floor area
    console.log('[Valuation] Fetching EPC data...');
    try {
      const epcKey = cacheKeys.epcPostcode(postcode);
      const epcResults = await getCachedEPC(
        epcKey,
        () => searchEPCByPostcode(postcode),
        CACHE_TTL.EPC
      );

      if (epcResults.length > 0) {
        dataSourcesUsed.push('EPC Open Data');
        const epc = epcResults[0];
        const epcSignals = extractEPCSignals(epc);

        // Energy rating adjustment (A-C is positive, D is neutral, E-G is negative)
        const energyRatingAdjustment: Record<string, number> = {
          'A': 0.08, 'B': 0.05, 'C': 0.02, 'D': 0,
          'E': -0.05, 'F': -0.10, 'G': -0.15,
        };
        
        const adjustment = energyRatingAdjustment[epc.energyRating] || 0;
        priceAdjustment += adjustment * basePrice;

        signals.push({
          name: 'Energy Rating',
          value: `${epc.energyRating} (${epcSignals.energyEfficiency})`,
          impact: adjustment > 0 ? 'positive' : adjustment < 0 ? 'negative' : 'neutral',
          weight: 0.15,
        });

        signals.push({
          name: 'Floor Area',
          value: epcSignals.floorAreaSignal,
          impact: 'neutral',
          weight: 0.1,
        });

        confidence += 10;
      }
    } catch (error) {
      console.warn('[Valuation] EPC lookup failed:', error);
    }

    // 3. Get amenity counts from OSM
    if (latitude && longitude) {
      console.log('[Valuation] Fetching amenity data...');
      try {
        const osmKey = cacheKeys.osmAmenities(latitude, longitude, 1000);
        const amenities = await getCachedOverpass(
          osmKey,
          () => getAmenityCounts(latitude, longitude, 1000),
          CACHE_TTL.OSM_AMENITIES
        );

        dataSourcesUsed.push('OpenStreetMap Amenities');
        const amenitySignals = extractAmenitySignals(amenities);

        // Amenity score adjustment
        const amenityAdjustment = (amenitySignals.amenityScore - 50) / 500; // Normalize to -0.1 to +0.1
        priceAdjustment += amenityAdjustment * basePrice;

        signals.push({
          name: 'Amenity Score',
          value: `${amenitySignals.amenityScore}/100`,
          impact: amenitySignals.amenityScore > 60 ? 'positive' : amenitySignals.amenityScore < 40 ? 'negative' : 'neutral',
          weight: 0.2,
        });

        signals.push({
          name: 'Schools Nearby',
          value: amenitySignals.schoolsNearby,
          impact: amenities.schools > 0 ? 'positive' : 'neutral',
          weight: 0.08,
        });

        signals.push({
          name: 'Public Transport',
          value: amenitySignals.transportAccess,
          impact: amenities.publicTransport > 0 ? 'positive' : 'neutral',
          weight: 0.08,
        });

        confidence += 15;
      } catch (error) {
        console.warn('[Valuation] Amenity lookup failed:', error);
      }
    }

    // 4. Get postcode admin area for regional context
    console.log('[Valuation] Fetching postcode data...');
    try {
      const postcodeData = await getPostcodeData(postcode);
      
      if (postcodeData) {
        dataSourcesUsed.push('ONS Postcode Directory');
        
        signals.push({
          name: 'Location',
          value: `${postcodeData.adminArea}, ${postcodeData.region}`,
          impact: 'neutral',
          weight: 0.05,
        });
      }
    } catch (error) {
      console.warn('[Valuation] Postcode lookup failed:', error);
    }

    // Calculate final price band
    const adjustedPrice = basePrice + priceAdjustment;
    const margin = adjustedPrice * (0.1 + (100 - confidence) / 500); // Higher uncertainty = wider band

    const result: ValuationResult = {
      postcode,
      estimatedLowPrice: Math.round(adjustedPrice - margin),
      estimatedHighPrice: Math.round(adjustedPrice + margin),
      medianPrice: Math.round(adjustedPrice),
      confidence: Math.min(100, Math.max(0, confidence)),
      signals,
      dataSourcesUsed,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
    };

    console.log('[Valuation] Generated valuation:', {
      postcode,
      price: result.medianPrice,
      confidence: result.confidence,
      sources: dataSourcesUsed.length,
    });

    return result;
  } catch (error) {
    console.error('[Valuation] Failed to generate valuation:', error);
    
    // Return fallback valuation with low confidence
    return {
      postcode,
      estimatedLowPrice: 200000,
      estimatedHighPrice: 300000,
      medianPrice: 250000,
      confidence: 20,
      signals: [{
        name: 'Error',
        value: 'Limited data available',
        impact: 'negative',
        weight: 1,
      }],
      dataSourcesUsed: [],
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
}

/**
 * Generate valuation signals summary for display
 */
export function generateSignalsSummary(valuation: ValuationResult): string {
  const positiveSignals = valuation.signals.filter(s => s.impact === 'positive');
  const negativeSignals = valuation.signals.filter(s => s.impact === 'negative');

  const summary: string[] = [];

  if (positiveSignals.length > 0) {
    summary.push(`Positive factors: ${positiveSignals.map(s => s.name).join(', ')}`);
  }

  if (negativeSignals.length > 0) {
    summary.push(`Negative factors: ${negativeSignals.map(s => s.name).join(', ')}`);
  }

  if (valuation.dataSourcesUsed.length > 0) {
    summary.push(`Data sources: ${valuation.dataSourcesUsed.join(', ')}`);
  }

  return summary.join('. ');
}
