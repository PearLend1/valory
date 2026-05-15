import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { DEMO_MODE } from "./demo-mode";
import { DEMO_POSTCODES } from "./mock-data";

const POSTCODES_IO_BASE = "https://api.postcodes.io";

/**
 * Postcode Lookup Router
 * 
 * Uses Postcodes.io (free, no API key required) to provide:
 * - Postcode autocomplete as user types
 * - Postcode validation
 * - Full postcode lookup with geographic/admin data
 */

interface PostcodesIoResult {
  postcode: string;
  quality: number;
  eastings: number;
  northings: number;
  country: string;
  nhs_ha: string;
  longitude: number;
  latitude: number;
  european_electoral_region: string;
  primary_care_trust: string;
  region: string;
  lsoa: string;
  msoa: string;
  incode: string;
  outcode: string;
  parliamentary_constituency: string;
  admin_district: string;
  parish: string;
  admin_county: string | null;
  admin_ward: string;
}

async function fetchPostcodesIo<T>(path: string): Promise<T> {
  const response = await fetch(`${POSTCODES_IO_BASE}${path}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Postcode not found" });
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Postcode service unavailable" });
  }
  const data = await response.json();
  return data as T;
}

export const postcodeRouter = router({
  /**
   * Autocomplete postcodes as the user types
   * Returns up to 10 matching postcodes
   */
  autocomplete: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(10),
    }))
    .query(async ({ input }) => {
      try {
        // In demo mode, return mock autocomplete results
        if (DEMO_MODE) {
          const query = input.query.toUpperCase();
          const matches = Object.keys(DEMO_POSTCODES)
            .filter(pc => pc.startsWith(query))
            .slice(0, 10);

          return {
            postcodes: matches,
          };
        }

        const data = await fetchPostcodesIo<{ status: number; result: string[] | null }>(
          `/postcodes/${encodeURIComponent(input.query)}/autocomplete`
        );
        return {
          postcodes: data.result || [],
        };
      } catch (error) {
        // If the query is too short or invalid, return empty
        if (error instanceof TRPCError && error.code === "NOT_FOUND") {
          return { postcodes: [] };
        }
        throw error;
      }
    }),

  /**
   * Validate a postcode
   * Returns true/false
   */
  validate: publicProcedure
    .input(z.object({
      postcode: z.string().min(1).max(10),
    }))
    .query(async ({ input }) => {
      try {
        // In demo mode, validate against mock postcodes
        if (DEMO_MODE) {
          const normalized = input.postcode.toUpperCase();
          const valid = normalized in DEMO_POSTCODES;
          return { valid };
        }

        const data = await fetchPostcodesIo<{ status: number; result: boolean }>(
          `/postcodes/${encodeURIComponent(input.postcode)}/validate`
        );
        return {
          valid: data.result,
        };
      } catch {
        return { valid: false };
      }
    }),

  /**
   * Full postcode lookup
   * Returns geographic data, admin district, region, town, etc.
   */
  lookup: publicProcedure
    .input(z.object({
      postcode: z.string().min(1).max(10),
    }))
    .query(async ({ input }) => {
      // In demo mode, return mock postcode data
      if (DEMO_MODE) {
        const normalized = input.postcode.toUpperCase();
        const mockData = DEMO_POSTCODES[normalized as keyof typeof DEMO_POSTCODES];

        if (!mockData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Postcode not found" });
        }

        return {
          postcode: mockData.postcode,
          adminDistrict: mockData.adminDistrict,
          region: mockData.region,
          country: mockData.country,
          parish: undefined,
          adminWard: mockData.adminWard,
          adminCounty: undefined,
          latitude: 0,
          longitude: 0,
          outcode: mockData.outcode,
          incode: mockData.incode,
        };
      }

      const data = await fetchPostcodesIo<{ status: number; result: PostcodesIoResult }>(
        `/postcodes/${encodeURIComponent(input.postcode)}`
      );

      const result = data.result;

      return {
        postcode: result.postcode,
        // Area information for auto-populating address fields
        adminDistrict: result.admin_district, // e.g. "Bristol, City of"
        region: result.region,                 // e.g. "South West"
        country: result.country,               // e.g. "England"
        parish: result.parish,
        adminWard: result.admin_ward,
        adminCounty: result.admin_county,
        // Coordinates for map display
        latitude: result.latitude,
        longitude: result.longitude,
        // Outcode for area-level matching
        outcode: result.outcode,
        incode: result.incode,
      };
    }),
});
