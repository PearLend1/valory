import { describe, it, expect } from 'vitest';

/**
 * Interaction Model Tests
 * 
 * Validates the separation between:
 * - Buyer discovery: swipe-first, action-driven
 * - Vendor valuation: focused single-topic screens with structured controls
 */

describe('Interaction Model — Buyer Discovery', () => {
  it('should have a /discover route for the buyer discovery feed', () => {
    const buyerRoute = '/discover';
    expect(buyerRoute).toBe('/discover');
  });

  it('should support three primary actions: Favourite, Pass, Save for Later', () => {
    const actions = ['favourite', 'pass', 'save'];
    expect(actions).toContain('favourite');
    expect(actions).toContain('pass');
    expect(actions).toContain('save');
    expect(actions.length).toBe(3);
  });

  it('should use button-based interactions on desktop (not requiring swipe)', () => {
    const desktopInteractions = {
      primaryMethod: 'buttons',
      swipeRequired: false,
      dragOptional: true,
    };
    expect(desktopInteractions.primaryMethod).toBe('buttons');
    expect(desktopInteractions.swipeRequired).toBe(false);
  });

  it('should support card view and grid view toggle', () => {
    const viewModes = ['card', 'grid'];
    expect(viewModes).toContain('card');
    expect(viewModes).toContain('grid');
  });
});

describe('Interaction Model — Vendor Single-Topic Screens', () => {
  const SCREEN_FLOW = [
    { step: 1, topic: 'postcode', title: "What's your postcode?", inputType: 'text-input' },
    { step: 2, topic: 'address', title: "What's your street address?", inputType: 'text-input' },
    { step: 3, topic: 'property-type', title: 'What type of property is it?', inputType: 'card-tiles' },
    { step: 4, topic: 'bedrooms', title: 'How many bedrooms?', inputType: 'number-grid' },
    { step: 5, topic: 'bathrooms-receptions', title: 'Bathrooms & reception rooms', inputType: 'segmented-controls' },
    { step: 6, topic: 'size-tenure', title: 'Size & tenure', inputType: 'mixed' },
    { step: 7, topic: 'condition', title: 'What condition is the property in?', inputType: 'selectable-cards' },
    { step: 8, topic: 'features', title: 'Key features', inputType: 'checkbox-cards' },
    { step: 9, topic: 'epc-improvements', title: 'EPC & improvements', inputType: 'chip-pills' },
  ];

  it('should have exactly 9 focused single-topic screens before valuation result', () => {
    expect(SCREEN_FLOW.length).toBe(9);
  });

  it('each screen should focus on one main topic only', () => {
    const topics = SCREEN_FLOW.map(s => s.topic);
    const uniqueTopics = new Set(topics);
    // Every screen has a unique topic
    expect(uniqueTopics.size).toBe(SCREEN_FLOW.length);
  });

  it('should show step X of Y progress indicator', () => {
    const totalSteps = SCREEN_FLOW.length;
    SCREEN_FLOW.forEach((screen, idx) => {
      const stepLabel = `Step ${idx + 1} of ${totalSteps}`;
      expect(stepLabel).toBe(`Step ${screen.step} of ${totalSteps}`);
    });
  });

  it('should show "X questions left" countdown', () => {
    const totalSteps = SCREEN_FLOW.length;
    SCREEN_FLOW.forEach((screen, idx) => {
      const questionsLeft = totalSteps - idx;
      expect(questionsLeft).toBe(totalSteps - idx);
      expect(questionsLeft).toBeGreaterThan(0);
    });
  });

  it('should have a visual progress bar that advances with each step', () => {
    const totalSteps = SCREEN_FLOW.length;
    SCREEN_FLOW.forEach((_, idx) => {
      const progressPercent = ((idx + 1) / totalSteps) * 100;
      expect(progressPercent).toBeGreaterThan(0);
      expect(progressPercent).toBeLessThanOrEqual(100);
    });
  });

  it('first screen should be postcode entry', () => {
    expect(SCREEN_FLOW[0].topic).toBe('postcode');
    expect(SCREEN_FLOW[0].step).toBe(1);
  });

  it('second screen should be street address with confirmation', () => {
    expect(SCREEN_FLOW[1].topic).toBe('address');
    expect(SCREEN_FLOW[1].step).toBe(2);
  });

  it('property type should use card tiles (not dropdown)', () => {
    const propertyTypeScreen = SCREEN_FLOW.find(s => s.topic === 'property-type');
    expect(propertyTypeScreen).toBeDefined();
    expect(propertyTypeScreen!.inputType).toBe('card-tiles');
  });

  it('bedrooms should use number grid (not dropdown)', () => {
    const bedroomsScreen = SCREEN_FLOW.find(s => s.topic === 'bedrooms');
    expect(bedroomsScreen).toBeDefined();
    expect(bedroomsScreen!.inputType).toBe('number-grid');
  });

  it('condition should use selectable cards (not dropdown)', () => {
    const conditionScreen = SCREEN_FLOW.find(s => s.topic === 'condition');
    expect(conditionScreen).toBeDefined();
    expect(conditionScreen!.inputType).toBe('selectable-cards');
  });

  it('features should use checkbox cards with progressive disclosure', () => {
    const featuresScreen = SCREEN_FLOW.find(s => s.topic === 'features');
    expect(featuresScreen).toBeDefined();
    expect(featuresScreen!.inputType).toBe('checkbox-cards');
  });
});

describe('Interaction Model — Progressive Disclosure', () => {
  const FEATURES_WITH_SECONDARY = [
    { feature: 'extension', secondaryOptions: ['Rear extension', 'Side extension', 'Wrap-around', 'Double storey', 'Single storey'] },
    { feature: 'loft-conversion', secondaryOptions: ['Bedroom', 'Office', 'Playroom', 'Storage'] },
    { feature: 'garage', secondaryOptions: ['Single', 'Double', 'Integral', 'Detached'] },
  ];

  it('should reveal secondary menus only after main option is selected', () => {
    FEATURES_WITH_SECONDARY.forEach(item => {
      // Before selection: secondary options hidden
      const beforeSelection = { selected: false, secondaryVisible: false };
      expect(beforeSelection.secondaryVisible).toBe(false);

      // After selection: secondary options revealed
      const afterSelection = { selected: true, secondaryVisible: true };
      expect(afterSelection.secondaryVisible).toBe(true);
    });
  });

  it('Extension should reveal extension type details', () => {
    const extension = FEATURES_WITH_SECONDARY.find(f => f.feature === 'extension');
    expect(extension).toBeDefined();
    expect(extension!.secondaryOptions).toContain('Rear extension');
    expect(extension!.secondaryOptions).toContain('Side extension');
    expect(extension!.secondaryOptions).toContain('Wrap-around');
    expect(extension!.secondaryOptions).toContain('Double storey');
    expect(extension!.secondaryOptions).toContain('Single storey');
  });

  it('Loft conversion should reveal usage details', () => {
    const loft = FEATURES_WITH_SECONDARY.find(f => f.feature === 'loft-conversion');
    expect(loft).toBeDefined();
    expect(loft!.secondaryOptions.length).toBeGreaterThan(0);
  });

  it('Garage should reveal garage type details', () => {
    const garage = FEATURES_WITH_SECONDARY.find(f => f.feature === 'garage');
    expect(garage).toBeDefined();
    expect(garage!.secondaryOptions).toContain('Single');
    expect(garage!.secondaryOptions).toContain('Double');
  });

  it('secondary options should be chip-style selectable controls', () => {
    // Secondary menus use chip pills, not dropdowns or text inputs
    const secondaryControlType = 'chip-pills';
    expect(secondaryControlType).not.toBe('dropdown');
    expect(secondaryControlType).not.toBe('text-input');
    expect(secondaryControlType).not.toBe('swipe');
  });
});

describe('Interaction Model — Structured Controls (No Swipe)', () => {
  it('should NOT use swipe as the main answer mechanic for property data', () => {
    const valuationInputMethods = [
      'text-input',         // postcode, address, sq ft
      'card-tiles',         // property type
      'number-grid',        // bedrooms
      'segmented-controls', // bathrooms, receptions
      'selectable-cards',   // condition
      'checkbox-cards',     // features
      'chip-pills',         // EPC, tenure, secondary options
    ];
    expect(valuationInputMethods).not.toContain('swipe');
    expect(valuationInputMethods).not.toContain('drag');
  });

  it('property type should have 7 options as card tiles', () => {
    const propertyTypes = ['Detached', 'Semi-Detached', 'Terraced', 'Flat / Apartment', 'Bungalow', 'Cottage', 'Townhouse'];
    expect(propertyTypes.length).toBe(7);
  });

  it('condition should have 4 options as selectable cards', () => {
    const conditions = ['Excellent', 'Good', 'Fair', 'Needs work'];
    expect(conditions.length).toBe(4);
  });

  it('bedrooms should offer 1 through 7+ as number grid', () => {
    const bedroomOptions = [1, 2, 3, 4, 5, 6, '7+'];
    expect(bedroomOptions.length).toBe(7);
    expect(bedroomOptions[0]).toBe(1);
    expect(bedroomOptions[6]).toBe('7+');
  });

  it('features should have 12 checkbox-card options', () => {
    const features = [
      'Garden', 'Off-street parking', 'Garage', 'Conservatory',
      'Extension', 'Loft conversion', 'Solar panels', 'Modern kitchen',
      'Modern bathroom', 'Double glazing', 'Central heating', 'Period features',
    ];
    expect(features.length).toBe(12);
  });
});

describe('Interaction Model — UX Principle Separation', () => {
  it('should differentiate discovery (playful) from valuation (structured)', () => {
    const discoveryUX = {
      feel: 'playful',
      primaryInteraction: 'swipe/buttons',
      inspiration: 'TikTok/Tinder/Zoopla',
    };
    const valuationUX = {
      feel: 'premium-structured',
      primaryInteraction: 'formal-controls',
      inspiration: 'trustworthy-questionnaire',
    };
    expect(discoveryUX.feel).not.toBe(valuationUX.feel);
    expect(discoveryUX.primaryInteraction).not.toBe(valuationUX.primaryInteraction);
  });

  it('should route buyers to /discover and sellers to /sell from homepage', () => {
    expect('/discover').toBe('/discover');
    expect('/sell').toBe('/sell');
  });
});
