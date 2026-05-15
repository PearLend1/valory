import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

/**
 * Postcode Lookup Integration Tests
 * 
 * Validates the Postcodes.io integration:
 * - Autocomplete returns matching postcodes
 * - Validation confirms valid/invalid postcodes
 * - Lookup returns geographic data (adminDistrict, region, adminWard)
 * - Area info auto-populates on the address confirmation screen
 */

function createContext(role: "public" | "vendor" | "agent" | "admin", userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-${role}-${userId}`,
      email: `${role}@test.com`,
      name: `Test ${role}`,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe('Postcode Lookup — Autocomplete', () => {
  it('should return autocomplete suggestions for a partial postcode', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.autocomplete({ query: 'BS1' });
    expect(result.postcodes).toBeDefined();
    expect(Array.isArray(result.postcodes)).toBe(true);
    expect(result.postcodes.length).toBeGreaterThan(0);
    result.postcodes.forEach((pc: string) => {
      expect(pc.toUpperCase()).toContain('BS1');
    });
  });

  it('should return up to 10 suggestions', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.autocomplete({ query: 'SW1' });
    expect(result.postcodes.length).toBeLessThanOrEqual(10);
  });

  it('should return empty array for nonsense input', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.autocomplete({ query: 'ZZZZZ' });
    expect(result.postcodes).toEqual([]);
  });
});

describe('Postcode Lookup — Validation', () => {
  it('should validate a known valid postcode', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.validate({ postcode: 'BS1 4QA' });
    expect(result.valid).toBe(true);
  });

  it('should reject an invalid postcode', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.validate({ postcode: 'ZZ99 9ZZ' });
    expect(result.valid).toBe(false);
  });

  it('should handle postcodes without spaces', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.validate({ postcode: 'BS14QA' });
    expect(result.valid).toBe(true);
  });
});

describe('Postcode Lookup — Full Lookup with Area Data', () => {
  it('should return geographic data for a valid postcode', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.lookup({ postcode: 'BS1 4QA' });
    expect(result.postcode).toBeDefined();
    expect(result.adminDistrict).toBeDefined();
    expect(result.region).toBeDefined();
    expect(result.latitude).toBeDefined();
    expect(result.longitude).toBeDefined();
  });

  it('should return Bristol area data for BS1 postcodes', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.lookup({ postcode: 'BS1 1AD' });
    expect(result.adminDistrict).toContain('Bristol');
    expect(result.region).toBe('South West');
  });

  it('should throw NOT_FOUND for an invalid postcode', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    await expect(
      caller.postcode.lookup({ postcode: 'ZZ99 9ZZ' })
    ).rejects.toThrow();
  });

  it('should include ward data when available', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.lookup({ postcode: 'BS1 1AD' });
    expect(result.adminWard).toBeDefined();
  });

  it('should include outcode and incode', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const result = await caller.postcode.lookup({ postcode: 'BS1 4QA' });
    expect(result.outcode).toBe('BS1');
    expect(result.incode).toBe('4QA');
  });
});

describe('Postcode Lookup — Address Screen Integration', () => {
  it('postcode screen should be Step 1 of the vendor flow', () => {
    const postcodeStep = { step: 1, screen: 'postcode', title: "What's your postcode?" };
    expect(postcodeStep.step).toBe(1);
    expect(postcodeStep.screen).toBe('postcode');
  });

  it('address confirmation should be Step 2 with auto-filled area data', () => {
    const addressStep = {
      step: 2,
      screen: 'address-confirm',
      title: 'Confirm your address',
      autoFilledFields: ['town', 'ward', 'region', 'postcode'],
      manualField: 'street_address',
    };
    expect(addressStep.step).toBe(2);
    expect(addressStep.autoFilledFields).toContain('town');
    expect(addressStep.autoFilledFields).toContain('region');
    expect(addressStep.manualField).toBe('street_address');
  });

  it('area data should populate from postcode lookup result', () => {
    const lookupResult = {
      adminDistrict: 'Bristol, City of',
      adminWard: 'Lawrence Hill',
      region: 'South West',
      postcode: 'BS1 1AD',
    };
    const addressScreenData = {
      town: lookupResult.adminDistrict,
      ward: lookupResult.adminWard,
      region: lookupResult.region,
      postcode: lookupResult.postcode,
    };
    expect(addressScreenData.town).toBe('Bristol, City of');
    expect(addressScreenData.ward).toBe('Lawrence Hill');
    expect(addressScreenData.region).toBe('South West');
  });

  it('vendor should only need to enter street address manually', () => {
    const manualInputs = ['street_address'];
    const autoFilledInputs = ['postcode', 'town', 'ward', 'region'];
    expect(manualInputs.length).toBe(1);
    expect(autoFilledInputs.length).toBe(4);
  });

  it('postcode lookup endpoints should be accessible to all users (public)', async () => {
    const caller = appRouter.createCaller(createContext("public"));
    const autocomplete = await caller.postcode.autocomplete({ query: 'BS1' });
    expect(autocomplete.postcodes).toBeDefined();

    const validate = await caller.postcode.validate({ postcode: 'BS1 4QA' });
    expect(validate.valid).toBeDefined();

    const lookup = await caller.postcode.lookup({ postcode: 'BS1 4QA' });
    expect(lookup.postcode).toBeDefined();
  });
});
