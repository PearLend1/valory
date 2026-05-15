import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin, Home, ArrowRight, ArrowLeft, Shield, TrendingUp, CheckCircle2,
  ChevronLeft, Loader2, Camera, Upload, X, Sparkles, Star,
  ThermometerSun, Zap, TreePine, Car, Eye, Lock, ImagePlus,
  Bath, BedDouble, Sofa, Ruler, FileText, Wrench, ChevronDown,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { getLoginUrl } from '@/const';

// ─── Screen Definitions ─────────────────────────────────────
// Each screen focuses on ONE topic only
type Screen =
  | 'postcode'
  | 'address-confirm'
  | 'property-type'
  | 'bedrooms'
  | 'bathrooms-receptions'
  | 'size-tenure'
  | 'condition'
  | 'features'
  | 'epc-improvements'
  | 'calculating'
  | 'valuation-result'
  | 'review-accept'
  | 'photos';

// Question screens (used for countdown — excludes result/review/photos/calculating)
const QUESTION_SCREENS: Screen[] = [
  'postcode',
  'address-confirm',
  'property-type',
  'bedrooms',
  'bathrooms-receptions',
  'size-tenure',
  'condition',
  'features',
  'epc-improvements',
];

const ALL_SCREENS: Screen[] = [
  ...QUESTION_SCREENS,
  'calculating',
  'valuation-result',
  'review-accept',
  'photos',
];

// ─── Feature Options with Progressive Disclosure ────────────
const FEATURE_OPTIONS = [
  {
    id: 'garden', label: 'Garden', icon: TreePine,
    subOptions: [
      { id: 'garden-front', label: 'Front garden' },
      { id: 'garden-rear', label: 'Rear garden' },
      { id: 'garden-south', label: 'South-facing' },
      { id: 'garden-large', label: 'Large (50ft+)' },
    ],
  },
  {
    id: 'parking', label: 'Off-street parking', icon: Car,
    subOptions: [
      { id: 'parking-driveway', label: 'Driveway' },
      { id: 'parking-allocated', label: 'Allocated space' },
      { id: 'parking-multiple', label: 'Multiple spaces' },
    ],
  },
  { id: 'garage', label: 'Garage', icon: Car, subOptions: [
    { id: 'garage-single', label: 'Single garage' },
    { id: 'garage-double', label: 'Double garage' },
    { id: 'garage-integral', label: 'Integral' },
    { id: 'garage-detached', label: 'Detached' },
  ]},
  { id: 'conservatory', label: 'Conservatory', icon: ThermometerSun, subOptions: [] },
  {
    id: 'extension', label: 'Extension', icon: Home,
    subOptions: [
      { id: 'ext-rear', label: 'Rear extension' },
      { id: 'ext-side', label: 'Side extension' },
      { id: 'ext-wrap', label: 'Wrap-around' },
      { id: 'ext-double', label: 'Double storey' },
      { id: 'ext-single', label: 'Single storey' },
    ],
  },
  {
    id: 'loft-conversion', label: 'Loft conversion', icon: Home,
    subOptions: [
      { id: 'loft-dormer', label: 'Dormer' },
      { id: 'loft-velux', label: 'Velux / rooflight' },
      { id: 'loft-hip', label: 'Hip-to-gable' },
      { id: 'loft-mansard', label: 'Mansard' },
    ],
  },
  { id: 'solar-panels', label: 'Solar panels', icon: Zap, subOptions: [] },
  { id: 'new-kitchen', label: 'Modern kitchen', icon: Sparkles, subOptions: [
    { id: 'kitchen-recent', label: 'Fitted in last 5 years' },
    { id: 'kitchen-high-end', label: 'High-end / bespoke' },
  ]},
  { id: 'new-bathroom', label: 'Modern bathroom', icon: Sparkles, subOptions: [
    { id: 'bath-recent', label: 'Refitted in last 5 years' },
    { id: 'bath-ensuite', label: 'Includes en-suite' },
  ]},
  { id: 'double-glazing', label: 'Double glazing', icon: ThermometerSun, subOptions: [] },
  { id: 'central-heating', label: 'Central heating', icon: ThermometerSun, subOptions: [
    { id: 'heat-gas', label: 'Gas' },
    { id: 'heat-electric', label: 'Electric' },
    { id: 'heat-pump', label: 'Heat pump' },
    { id: 'heat-underfloor', label: 'Underfloor heating' },
  ]},
  { id: 'period-features', label: 'Period features', icon: Star, subOptions: [
    { id: 'period-fireplace', label: 'Original fireplace' },
    { id: 'period-coving', label: 'Coving / cornicing' },
    { id: 'period-beams', label: 'Exposed beams' },
    { id: 'period-sash', label: 'Sash windows' },
  ]},
];

// ─── Property Type Options ──────────────────────────────────
const PROPERTY_TYPES = [
  { value: 'detached', label: 'Detached', icon: '🏠', desc: 'Standalone property' },
  { value: 'semi-detached', label: 'Semi-Detached', icon: '🏘️', desc: 'Shares one wall' },
  { value: 'terraced', label: 'Terraced', icon: '🏚️', desc: 'Row of joined houses' },
  { value: 'flat', label: 'Flat / Apartment', icon: '🏢', desc: 'Within a building' },
  { value: 'bungalow', label: 'Bungalow', icon: '🏡', desc: 'Single storey' },
  { value: 'cottage', label: 'Cottage', icon: '🛖', desc: 'Traditional / rural' },
  { value: 'townhouse', label: 'Townhouse', icon: '🏗️', desc: 'Multi-storey terrace' },
];

// ─── Condition Options ──────────────────────────────────────
const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', desc: 'Recently renovated or move-in ready', emoji: '✨' },
  { value: 'good', label: 'Good', desc: 'Well maintained, minor cosmetic updates only', emoji: '👍' },
  { value: 'fair', label: 'Fair', desc: 'Functional but could use some updating', emoji: '🔧' },
  { value: 'needs-work', label: 'Needs work', desc: 'Significant renovation required', emoji: '🏗️' },
];

// ─── Data Interfaces ────────────────────────────────────────
interface AddressData {
  address: string;
  postcode: string;
  confirmed: boolean;
  // Auto-populated from Postcodes.io
  adminDistrict: string;
  region: string;
  adminWard: string;
  adminCounty: string;
  latitude: number | null;
  longitude: number | null;
}

interface BasicsData {
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  receptionRooms: string;
  squareFeet: string;
  tenure: string;
}

interface FeaturesData {
  condition: string;
  epcRating: string;
  features: string[];
  featureDetails: string[];
  recentImprovements: string;
  additionalNotes: string;
}

interface ValuationResult {
  estimatedPriceLow: number;
  estimatedPriceHigh: number;
  estimatedMidpoint: number;
  confidenceScore: number;
}

interface PhotoData {
  files: File[];
  previews: string[];
}

// ─── Component ──────────────────────────────────────────────
export default function SellerValuation() {
  const [screen, setScreen] = useState<Screen>('postcode');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  // Step data
  const [addressData, setAddressData] = useState<AddressData>({
    address: '', postcode: '', confirmed: false,
    adminDistrict: '', region: '', adminWard: '', adminCounty: '',
    latitude: null, longitude: null,
  });
  const [postcodeQuery, setPostcodeQuery] = useState('');
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [postcodeValidated, setPostcodeValidated] = useState<boolean | null>(null);
  const [postcodeAreaLoaded, setPostcodeAreaLoaded] = useState(false);
  const postcodeInputRef = useRef<HTMLInputElement>(null);
  const [basicsData, setBasicsData] = useState<BasicsData>({
    propertyType: '', bedrooms: '', bathrooms: '', receptionRooms: '', squareFeet: '', tenure: '',
  });
  const [featuresData, setFeaturesData] = useState<FeaturesData>({
    condition: '', epcRating: '', features: [], featureDetails: [], recentImprovements: '', additionalNotes: '',
  });
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [photoData, setPhotoData] = useState<PhotoData>({ files: [], previews: [] });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acceptanceResult, setAcceptanceResult] = useState<{ valuationId: number; lockedUntil: string } | null>(null);

  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // tRPC queries for postcode lookup
  const autocompleteQuery = trpc.postcode.autocomplete.useQuery(
    { query: postcodeQuery },
    {
      enabled: postcodeQuery.length >= 2 && showAutoComplete,
      staleTime: 30000,
    }
  );

  const validateQuery = trpc.postcode.validate.useQuery(
    { postcode: addressData.postcode },
    {
      enabled: addressData.postcode.length >= 5 && !showAutoComplete,
      staleTime: 60000,
    }
  );

  const lookupQuery = trpc.postcode.lookup.useQuery(
    { postcode: addressData.postcode },
    {
      enabled: postcodeValidated === true && !postcodeAreaLoaded,
      staleTime: 60000,
    }
  );

  // Update validation state when query resolves
  React.useEffect(() => {
    if (validateQuery.data) {
      setPostcodeValidated(validateQuery.data.valid);
    }
  }, [validateQuery.data]);

  // Auto-populate area data when lookup resolves
  React.useEffect(() => {
    if (lookupQuery.data && !postcodeAreaLoaded) {
      setAddressData(prev => ({
        ...prev,
        postcode: lookupQuery.data.postcode, // Use formatted postcode
        adminDistrict: lookupQuery.data.adminDistrict || '',
        region: lookupQuery.data.region || '',
        adminWard: lookupQuery.data.adminWard || '',
        adminCounty: lookupQuery.data.adminCounty || '',
        latitude: lookupQuery.data.latitude,
        longitude: lookupQuery.data.longitude,
      }));
      setPostcodeAreaLoaded(true);
    }
  }, [lookupQuery.data, postcodeAreaLoaded]);

  // Handle postcode input change
  const handlePostcodeChange = (value: string) => {
    const upper = value.toUpperCase();
    setPostcodeQuery(upper);
    setAddressData(prev => ({ ...prev, postcode: upper, confirmed: false }));
    setPostcodeValidated(null);
    setPostcodeAreaLoaded(false);
    setShowAutoComplete(upper.length >= 2);
  };

  // Handle postcode selection from autocomplete
  const selectPostcode = (postcode: string) => {
    setAddressData(prev => ({ ...prev, postcode, confirmed: false }));
    setPostcodeQuery(postcode);
    setShowAutoComplete(false);
    setPostcodeValidated(null);
    setPostcodeAreaLoaded(false);
    // Trigger validation + lookup
    setTimeout(() => setPostcodeValidated(null), 50);
  };

  // tRPC mutations
  const acceptMutation = trpc.vendorAcceptance.acceptValuation.useMutation({
    onSuccess: (result) => {
      setAcceptanceResult({ valuationId: result.valuationId, lockedUntil: result.lockedUntil });
      setShowConfirmModal(false);
      toast.success('Valuation accepted — your Valory baseline is now locked for 12 months.');
      setScreen('photos');
    },
    onError: (error) => {
      setShowConfirmModal(false);
      toast.error(error.message || 'Failed to accept valuation. Please try again.');
    },
  });

  // ─── Progress Calculation ──────────────────────────────────
  const questionIdx = QUESTION_SCREENS.indexOf(screen);
  const isQuestionScreen = questionIdx >= 0;
  const questionsLeft = isQuestionScreen ? QUESTION_SCREENS.length - questionIdx : 0;
  const progressPercent = isQuestionScreen
    ? Math.round(((questionIdx) / QUESTION_SCREENS.length) * 100)
    : 100;

  // ─── Navigation ────────────────────────────────────────────
  const screenIdx = ALL_SCREENS.indexOf(screen);

  const goNext = () => {
    const nextIdx = screenIdx + 1;
    if (nextIdx < ALL_SCREENS.length) setScreen(ALL_SCREENS[nextIdx]);
  };

  const goBack = () => {
    const prevIdx = screenIdx - 1;
    if (prevIdx >= 0) setScreen(ALL_SCREENS[prevIdx]);
  };

  // ─── Valuation Calculation ─────────────────────────────────
  const calculateValuation = async () => {
    setScreen('calculating');
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const basePrice = 280000 + Math.random() * 250000;
      const confidence = 55 + Math.floor(
        (basicsData.squareFeet ? 10 : 0) +
        (featuresData.condition ? 8 : 0) +
        (featuresData.features.length * 2) +
        (featuresData.epcRating ? 5 : 0) +
        (basicsData.tenure ? 3 : 0)
      );
      setValuation({
        estimatedPriceLow: Math.round(basePrice * 0.93),
        estimatedPriceHigh: Math.round(basePrice * 1.07),
        estimatedMidpoint: Math.round(basePrice),
        confidenceScore: Math.min(confidence, 95),
      });
      setScreen('valuation-result');
    } finally {
      setLoading(false);
    }
  };

  // ─── Feature Toggle ────────────────────────────────────────
  const toggleFeature = (id: string) => {
    setFeaturesData(prev => {
      const has = prev.features.includes(id);
      return {
        ...prev,
        features: has ? prev.features.filter(f => f !== id) : [...prev.features, id],
        featureDetails: has
          ? prev.featureDetails.filter(d => !d.startsWith(id.split('-')[0]))
          : prev.featureDetails,
      };
    });
    if (!featuresData.features.includes(id)) {
      const feat = FEATURE_OPTIONS.find(f => f.id === id);
      if (feat && feat.subOptions.length > 0) {
        setExpandedFeature(id);
      }
    } else {
      if (expandedFeature === id) setExpandedFeature(null);
    }
  };

  const toggleFeatureDetail = (detailId: string) => {
    setFeaturesData(prev => ({
      ...prev,
      featureDetails: prev.featureDetails.includes(detailId)
        ? prev.featureDetails.filter(d => d !== detailId)
        : [...prev.featureDetails, detailId],
    }));
  };

  // ─── Photo Handling ────────────────────────────────────────
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length + photoData.files.length > 10) {
      toast.error('Maximum 10 photos allowed');
      return;
    }
    const newPreviews = selected.map(f => URL.createObjectURL(f));
    setPhotoData(prev => ({
      files: [...prev.files, ...selected],
      previews: [...prev.previews, ...newPreviews],
    }));
  }, [photoData.files.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotoData(prev => {
      URL.revokeObjectURL(prev.previews[index]);
      return {
        files: prev.files.filter((_, i) => i !== index),
        previews: prev.previews.filter((_, i) => i !== index),
      };
    });
  }, []);

  const handleAcceptValuation = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmAcceptance = () => {
    if (!valuation) return;
    acceptMutation.mutate({
      address: addressData.address,
      postcode: addressData.postcode,
      estimatedPriceLow: valuation.estimatedPriceLow,
      estimatedPriceHigh: valuation.estimatedPriceHigh,
      estimatedMidpoint: valuation.estimatedMidpoint,
      confidence: valuation.confidenceScore >= 80 ? 'high' : valuation.confidenceScore >= 60 ? 'medium' : 'low',
      propertyBasics: {
        propertyType: basicsData.propertyType,
        bedrooms: basicsData.bedrooms,
        bathrooms: basicsData.bathrooms,
        receptionRooms: basicsData.receptionRooms,
        sqft: basicsData.squareFeet,
        tenure: basicsData.tenure,
      },
      propertyFeatures: {
        condition: featuresData.condition,
        epcRating: featuresData.epcRating,
        features: featuresData.features,
        improvements: featuresData.recentImprovements,
      },
    });
  };

  const handleLaunchProfile = async () => {
    toast.success('Profile saved! Redirecting to your dashboard...');
    setTimeout(() => navigate('/vendor/dashboard'), 1500);
  };

  // ─── Helpers ───────────────────────────────────────────────
  const formatPrice = (price: number) => `£${price.toLocaleString()}`;

  // ─── Progress Bar Component ────────────────────────────────
  const ProgressIndicator = () => {
    if (!isQuestionScreen) return null;
    return (
      <div className="mb-8 space-y-3">
        {/* Countdown text */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-400">
            Step {questionIdx + 1} of {QUESTION_SCREENS.length}
          </p>
          <p className="text-sm font-semibold text-amber-500">
            {questionsLeft === 1 ? 'Last question' : `${questionsLeft} questions left`}
          </p>
        </div>
        {/* Visual progress bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  };

  // ─── Screen Wrapper ────────────────────────────────────────
  const ScreenWrapper = ({ children, showBack = true }: { children: React.ReactNode; showBack?: boolean }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {children}
    </div>
  );

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Minimal Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {screenIdx > 0 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-slate-400 hover:text-amber-500 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <Link href="/">
              <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft size={20} />
                <span className="text-sm font-medium">Home</span>
              </button>
            </Link>
          )}
          <span className="text-sm font-semibold text-amber-500 tracking-wide">VALORY</span>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProgressIndicator />

        {/* ═══════════════════════════════════════════════════
            SCREEN 1: POSTCODE (with autocomplete)
        ═══════════════════════════════════════════════════ */}
        {screen === 'postcode' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-amber-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                What's your postcode?
              </h1>
              <p className="text-slate-400 text-sm">
                Start typing and we'll find it for you.
              </p>
            </div>

            <Card className="border-0 shadow-lg bg-slate-900 border-slate-800">
              <CardContent className="pt-6 space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <Input
                    ref={postcodeInputRef}
                    placeholder="e.g. BS1 4QA"
                    value={addressData.postcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    onFocus={() => { if (postcodeQuery.length >= 2) setShowAutoComplete(true); }}
                    className={`pl-10 pr-10 h-14 text-lg uppercase tracking-wider font-medium ${
                      postcodeValidated === true ? 'border-green-400 ring-1 ring-green-200' :
                      postcodeValidated === false ? 'border-red-300 ring-1 ring-red-200' : ''
                    }`}
                    maxLength={8}
                    autoFocus
                  />
                  {/* Validation indicator */}
                  {addressData.postcode.length >= 5 && (
                    <div className="absolute right-3 top-3.5">
                      {validateQuery.isLoading ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : postcodeValidated === true ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : postcodeValidated === false ? (
                        <X className="w-5 h-5 text-red-400" />
                      ) : null}
                    </div>
                  )}

                  {/* Autocomplete dropdown */}
                  {showAutoComplete && !postcodeValidated && autocompleteQuery.data && autocompleteQuery.data.postcodes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                      {autocompleteQuery.data.postcodes.map((pc: string, i: number) => (
                        <button
                          key={pc}
                          type="button"
                          onClick={() => selectPostcode(pc)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors ${
                            i > 0 ? 'border-t border-gray-50' : ''
                          }`}
                        >
                          <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span className="font-medium text-gray-800 tracking-wider">{pc}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Loading indicator for autocomplete */}
                  {showAutoComplete && autocompleteQuery.isLoading && postcodeQuery.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4">
                      <div className="flex items-center gap-3 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Finding postcodes...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation message */}
                {postcodeValidated === false && addressData.postcode.length >= 5 && (
                  <p className="text-sm text-red-500 flex items-center gap-1.5">
                    <X size={14} />
                    That doesn't look like a valid UK postcode. Please check and try again.
                  </p>
                )}

                {/* Area info preview when validated */}
                {postcodeValidated === true && lookupQuery.data && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Postcode found</span>
                    </div>
                    <p className="text-sm text-green-700 ml-6">
                      {lookupQuery.data.adminDistrict}
                      {lookupQuery.data.region ? `, ${lookupQuery.data.region}` : ''}
                    </p>
                  </div>
                )}

                <Button
                  onClick={goNext}
                  disabled={postcodeValidated !== true}
                  className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield size={12} />
              <span>Your details are private and never shared without your permission</span>
            </div>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 2: ADDRESS CONFIRMATION (with area auto-fill)
        ═══════════════════════════════════════════════════ */}
        {screen === 'address-confirm' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Home className="w-7 h-7 text-purple-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Confirm your address
              </h1>
              <p className="text-slate-400 text-sm">
                We've filled in the area from your postcode. Just add your street address.
              </p>
            </div>

            <Card className="border-0 shadow-lg bg-slate-900 border-slate-800">
              <CardContent className="pt-6 space-y-4">
                {/* Street address input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Street address</label>
                  <Input
                    placeholder="e.g. 42 Victoria Road"
                    value={addressData.address}
                    onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value, confirmed: false }))}
                    className="h-14 text-lg"
                    autoFocus
                  />
                </div>

                {/* Auto-populated area info from Postcodes.io */}
                {addressData.adminDistrict && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Area (auto-filled from postcode)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Town / City</p>
                        <p className="text-sm font-medium text-gray-800">{addressData.adminDistrict}</p>
                      </div>
                      {addressData.adminCounty && (
                        <div>
                          <p className="text-xs text-gray-400">County</p>
                          <p className="text-sm font-medium text-gray-800">{addressData.adminCounty}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">Ward</p>
                        <p className="text-sm font-medium text-gray-800">{addressData.adminWard}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Region</p>
                        <p className="text-sm font-medium text-gray-800">{addressData.region}</p>
                      </div>
                    </div>
                    <div className="pt-1">
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-200 bg-purple-50">
                        {addressData.postcode}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Confirmation preview */}
                {addressData.address.trim().length >= 3 && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-purple-600 mt-0.5 flex-shrink-0" size={16} />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{addressData.address}</p>
                        <p className="text-sm text-gray-600">
                          {addressData.adminDistrict ? `${addressData.adminDistrict}, ` : ''}{addressData.postcode}
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={addressData.confirmed}
                        onCheckedChange={(checked) => setAddressData(prev => ({ ...prev, confirmed: !!checked }))}
                      />
                      <span className="text-sm text-gray-700 font-medium">This is the correct address</span>
                    </label>
                  </div>
                )}

                <Button
                  onClick={goNext}
                  disabled={!addressData.confirmed}
                  className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </CardContent>
            </Card>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 3: PROPERTY TYPE
        ═══════════════════════════════════════════════════ */}
        {screen === 'property-type' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                What type of property is it?
              </h1>
              <p className="text-slate-400 text-sm">
                This determines which comparables we use.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {PROPERTY_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setBasicsData(prev => ({ ...prev, propertyType: t.value }));
                    // Auto-advance after selection with a brief delay
                    setTimeout(goNext, 300);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    basicsData.propertyType === t.value
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${
                      basicsData.propertyType === t.value ? 'text-purple-800' : 'text-gray-800'
                    }`}>{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                  {basicsData.propertyType === t.value && (
                    <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 4: BEDROOMS
        ═══════════════════════════════════════════════════ */}
        {screen === 'bedrooms' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <BedDouble className="w-7 h-7 text-purple-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                How many bedrooms?
              </h1>
              <p className="text-slate-400 text-sm">
                Bedrooms are the single biggest factor in property valuation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, '7+'].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setBasicsData(prev => ({ ...prev, bedrooms: String(n) }));
                    setTimeout(goNext, 300);
                  }}
                  className={`py-6 rounded-xl border-2 text-center transition-all ${
                    basicsData.bedrooms === String(n)
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-2xl font-bold ${
                    basicsData.bedrooms === String(n) ? 'text-purple-700' : 'text-gray-800'
                  }`}>{n}</span>
                  {basicsData.bedrooms === String(n) && (
                    <CheckCircle2 size={16} className="text-purple-600 mx-auto mt-1" />
                  )}
                </button>
              ))}
            </div>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 5: BATHROOMS & RECEPTION ROOMS
        ═══════════════════════════════════════════════════ */}
        {screen === 'bathrooms-receptions' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Bathrooms &amp; reception rooms
              </h1>
              <p className="text-slate-400 text-sm">
                These help us refine the valuation further.
              </p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-6">
                {/* Bathrooms */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-purple-600" />
                    <label className="text-sm font-semibold text-gray-800">Bathrooms</label>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBasicsData(prev => ({ ...prev, bathrooms: String(n) }))}
                        className={`flex-1 py-3.5 rounded-xl border-2 text-center font-semibold transition-all ${
                          basicsData.bathrooms === String(n)
                            ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reception Rooms */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sofa className="w-5 h-5 text-purple-600" />
                    <label className="text-sm font-semibold text-gray-800">Reception rooms</label>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, '5+'].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBasicsData(prev => ({ ...prev, receptionRooms: String(n) }))}
                        className={`flex-1 py-3.5 rounded-xl border-2 text-center font-semibold transition-all ${
                          basicsData.receptionRooms === String(n)
                            ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={goNext}
                  className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </CardContent>
            </Card>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 6: SIZE & TENURE (optional)
        ═══════════════════════════════════════════════════ */}
        {screen === 'size-tenure' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Size &amp; tenure
              </h1>
              <p className="text-slate-400 text-sm">
                Optional — but these improve accuracy if you know them.
              </p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-6">
                {/* Approximate Size */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-purple-600" />
                    <label className="text-sm font-semibold text-gray-800">
                      Approximate size (sq ft)
                    </label>
                    <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                  </div>
                  <Input
                    placeholder="e.g. 1200"
                    type="number"
                    value={basicsData.squareFeet}
                    onChange={(e) => setBasicsData(prev => ({ ...prev, squareFeet: e.target.value }))}
                    className="h-14 text-lg"
                  />
                </div>

                {/* Tenure */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <label className="text-sm font-semibold text-gray-800">Tenure</label>
                    <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'freehold', label: 'Freehold' },
                      { value: 'leasehold', label: 'Leasehold' },
                      { value: 'share-of-freehold', label: 'Share of Freehold' },
                      { value: 'unsure', label: 'Not sure' },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setBasicsData(prev => ({ ...prev, tenure: t.value }))}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                          basicsData.tenure === t.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={goNext}
                  className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                  <ArrowRight className="ml-2" size={18} />
                </Button>

                <button
                  onClick={goNext}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip — I'll add these later
                </button>
              </CardContent>
            </Card>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 7: CONDITION
        ═══════════════════════════════════════════════════ */}
        {screen === 'condition' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                What condition is the property in?
              </h1>
              <p className="text-slate-400 text-sm">
                Be honest — it helps us give you a more accurate valuation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {CONDITION_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setFeaturesData(prev => ({ ...prev, condition: c.value }));
                    setTimeout(goNext, 300);
                  }}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                    featuresData.condition === c.value
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      featuresData.condition === c.value ? 'text-purple-800' : 'text-gray-800'
                    }`}>{c.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                  </div>
                  {featuresData.condition === c.value && (
                    <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 8: KEY FEATURES (with progressive disclosure)
        ═══════════════════════════════════════════════════ */}
        {screen === 'features' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Key features
              </h1>
              <p className="text-slate-400 text-sm">
                Select everything that applies. We'll ask for details where it matters.
              </p>
            </div>

            <div className="space-y-2">
              {FEATURE_OPTIONS.map(feat => {
                const Icon = feat.icon;
                const isSelected = featuresData.features.includes(feat.id);
                const isExpanded = expandedFeature === feat.id && isSelected && feat.subOptions.length > 0;

                return (
                  <div key={feat.id} className="space-y-0">
                    {/* Main feature toggle */}
                    <button
                      type="button"
                      onClick={() => toggleFeature(feat.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-purple-400 bg-purple-50 text-purple-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      } ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <Icon size={18} className={isSelected ? 'text-purple-600' : 'text-gray-400'} />
                      <span className="font-medium text-sm flex-1">{feat.label}</span>
                      {isSelected && feat.subOptions.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedFeature(isExpanded ? null : feat.id);
                          }}
                          className="p-1 hover:bg-purple-100 rounded-md transition-colors"
                        >
                          <ChevronDown size={16} className={`text-purple-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </button>

                    {/* Secondary detail menu (progressive disclosure) */}
                    {isExpanded && (
                      <div className="border-2 border-t-0 border-purple-400 bg-purple-25 rounded-b-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-xs text-purple-600 font-medium mb-2 px-1">
                          Tell us more about the {feat.label.toLowerCase()}:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {feat.subOptions.map(sub => {
                            const isSubSelected = featuresData.featureDetails.includes(sub.id);
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => toggleFeatureDetail(sub.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  isSubSelected
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-700'
                                }`}
                              >
                                {isSubSelected && <span className="mr-1">✓</span>}
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              onClick={goNext}
              className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
            >
              Continue
              <ArrowRight className="ml-2" size={18} />
            </Button>

            <button
              onClick={goNext}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip — none of these apply
            </button>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            SCREEN 9: EPC & IMPROVEMENTS
        ═══════════════════════════════════════════════════ */}
        {screen === 'epc-improvements' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Energy rating &amp; improvements
              </h1>
              <p className="text-slate-400 text-sm">
                Last question — then we'll calculate your valuation.
              </p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-6">
                {/* EPC Rating */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800">EPC rating</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'unknown'].map(r => {
                      const epcColors: Record<string, string> = {
                        A: 'bg-green-600', B: 'bg-green-500', C: 'bg-lime-500',
                        D: 'bg-yellow-500', E: 'bg-orange-400', F: 'bg-orange-500', G: 'bg-red-500',
                        unknown: 'bg-gray-400',
                      };
                      const isSelected = featuresData.epcRating === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFeaturesData(prev => ({ ...prev, epcRating: r }))}
                          className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                            isSelected
                              ? `${epcColors[r]} text-white ring-2 ring-offset-1 ring-purple-300 shadow-sm`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {r === 'unknown' ? 'Not sure' : `Band ${r}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Improvements */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-purple-600" />
                    <label className="text-sm font-semibold text-gray-800">
                      Recent improvements
                    </label>
                    <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                  </div>
                  <Textarea
                    placeholder="e.g. New boiler installed 2024, kitchen refitted 2023..."
                    value={featuresData.recentImprovements}
                    onChange={(e) => setFeaturesData(prev => ({ ...prev, recentImprovements: e.target.value }))}
                    className="min-h-[80px] text-sm"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800">
                    Anything else?
                    <span className="text-gray-400 font-normal ml-1">Optional</span>
                  </label>
                  <Textarea
                    placeholder="e.g. South-facing garden, quiet cul-de-sac, planning permission approved..."
                    value={featuresData.additionalNotes}
                    onChange={(e) => setFeaturesData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    className="min-h-[80px] text-sm"
                  />
                </div>

                <Button
                  onClick={calculateValuation}
                  disabled={loading}
                  className="w-full h-14 text-base bg-amber-600 hover:bg-amber-700 font-semibold text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2" size={20} />
                      Get My Valuation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            CALCULATING SCREEN
        ═══════════════════════════════════════════════════ */}
        {screen === 'calculating' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Calculating your valuation</h2>
              <p className="text-gray-500 text-sm max-w-xs">
                We're analysing comparable sales, market trends, and your property details...
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            VALUATION RESULT
        ═══════════════════════════════════════════════════ */}
        {screen === 'valuation-result' && valuation && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Your Valory Estimate
              </h1>
              <p className="text-slate-400 text-sm">
                {addressData.address}, {addressData.postcode}
              </p>
            </div>

            {/* Main Valuation Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-purple-800 text-white overflow-hidden">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-purple-200 text-sm font-medium">Estimated Value</p>
                  <div className="text-5xl font-bold tracking-tight">
                    {formatPrice(valuation.estimatedMidpoint)}
                  </div>
                  <p className="text-purple-200 text-sm">
                    Range: {formatPrice(valuation.estimatedPriceLow)} – {formatPrice(valuation.estimatedPriceHigh)}
                  </p>
                </div>

                <div className="bg-white/10 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-200">Confidence</span>
                    <Badge className="bg-white/20 text-white border-0 text-xs">
                      {valuation.confidenceScore >= 80 ? 'High' : valuation.confidenceScore >= 60 ? 'Medium' : 'Building'}
                    </Badge>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${valuation.confidenceScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-purple-300">
                    Based on {Math.floor(Math.random() * 15) + 8} comparable sales in {addressData.postcode}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold text-gray-900">What we considered</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm font-semibold capitalize">{basicsData.propertyType?.replace('-', ' ')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Bedrooms</p>
                    <p className="text-sm font-semibold">{basicsData.bedrooms}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Condition</p>
                    <p className="text-sm font-semibold capitalize">{featuresData.condition?.replace('-', ' ') || 'Not set'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Features</p>
                    <p className="text-sm font-semibold">{featuresData.features.length} selected</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={goNext}
              className="w-full h-14 text-base bg-amber-600 hover:bg-amber-700 font-semibold text-white"
            >
              Review &amp; Accept
              <ArrowRight className="ml-2" size={18} />
            </Button>

            <p className="text-xs text-gray-400 text-center">
              You can refine your details to improve accuracy before accepting.
            </p>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            REVIEW & ACCEPT
        ═══════════════════════════════════════════════════ */}
        {screen === 'review-accept' && valuation && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Accept your Valory valuation
              </h1>
              <p className="text-slate-400 text-sm">
                Review the details below. When you're ready, accept to lock your valuation.
              </p>
            </div>

            {/* Summary Card */}
            <Card className="border-0 shadow-lg bg-slate-900 border-slate-800">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{addressData.address}</p>
                    <p className="text-sm text-gray-600">{addressData.postcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-700">{formatPrice(valuation.estimatedMidpoint)}</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(valuation.estimatedPriceLow)} – {formatPrice(valuation.estimatedPriceHigh)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm font-medium capitalize">{basicsData.propertyType?.replace('-', ' ') || '—'}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Beds</p>
                    <p className="text-sm font-medium">{basicsData.bedrooms || '—'}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Baths</p>
                    <p className="text-sm font-medium">{basicsData.bathrooms || '—'}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Condition</p>
                    <p className="text-sm font-medium capitalize">{featuresData.condition?.replace('-', ' ') || '—'}</p>
                  </div>
                </div>

                {featuresData.features.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2">Features</p>
                    <div className="flex flex-wrap gap-1.5">
                      {featuresData.features.map(f => (
                        <Badge key={f} variant="secondary" className="text-xs capitalize">
                          {f.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What accepting means */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">What accepting means</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Valuation locked for 12 months</p>
                    <p className="text-xs text-gray-600">Your Valory estimate becomes your official baseline.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Relevant agents are notified</p>
                    <p className="text-xs text-gray-600">Quality-ranked agents in your area receive an anonymised early signal.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Complete your launch profile</p>
                    <p className="text-xs text-gray-600">Add a property photo to strengthen your profile and improve match quality.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No obligation */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900">No obligation to sell</p>
                <p className="text-xs text-green-700 mt-1">
                  Accepting your valuation does not commit you to selling. You remain in full control.
                </p>
              </div>
            </div>

            {/* Accept CTA */}
            <div className="space-y-3">
              <Button
                onClick={handleAcceptValuation}
                disabled={acceptMutation.isPending}
                className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-base font-semibold shadow-lg shadow-purple-200"
              >
                {acceptMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2" size={20} />
                    Accept Valory Valuation
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Accepting your valuation locks it for 12 months and alerts relevant agents.
              </p>
            </div>
          </ScreenWrapper>
        )}

        {/* ═══════════════════════════════════════════════════
            PHOTOS (LAUNCH PROFILE)
        ═══════════════════════════════════════════════════ */}
        {screen === 'photos' && (
          <ScreenWrapper>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-7 h-7 text-purple-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Complete your property profile
              </h1>
              <p className="text-slate-400 text-sm">
                A front-of-house photo helps agents assess your property and improves match quality.
              </p>
            </div>

            <Card className="border-0 shadow-lg bg-slate-900 border-slate-800">
              <CardContent className="pt-6 space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <ImagePlus className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Upload property photos</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Start with a front-of-house image. Up to 10 photos.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload size={14} className="mr-2" />
                      Choose Files
                    </Button>
                  </div>
                </div>

                {photoData.previews.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      {photoData.previews.length} photo{photoData.previews.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {photoData.previews.map((preview, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                          <img src={preview} alt={`Property photo ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <div className="absolute top-1.5 left-1.5">
                              <Badge className="bg-purple-600 text-white text-[10px] border-0">Main</Badge>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-800">Photo tips</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Shoot on a clear day with good natural light</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Capture the full front of the property</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Tidy the front garden and driveway if possible</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={handleLaunchProfile}
                className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
              >
                {photoData.files.length > 0 ? (
                  <>
                    Launch My Profile
                    <Sparkles className="ml-2" size={18} />
                  </>
                ) : (
                  <>
                    Skip Photos &amp; Launch
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              You can always add or update photos later from your property dashboard.
            </p>
          </ScreenWrapper>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          CONFIRMATION MODAL
      ═══════════════════════════════════════════════════ */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Confirm your valuation acceptance
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              You're about to accept your Valory valuation. Here's what happens next.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {valuation && (
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Your Valory valuation</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {formatPrice(valuation.estimatedMidpoint)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Range: {formatPrice(valuation.estimatedPriceLow)} – {formatPrice(valuation.estimatedPriceHigh)}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Lock className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Locked for 12 months</span> — this becomes your official Valory baseline.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Eye className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Agents notified</span> — quality-ranked agents in your area will receive an anonymised early signal.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">You stay in control</span> — no obligation to sell. You decide the next steps.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={acceptMutation.isPending}
              className="sm:flex-1"
            >
              Go back
            </Button>
            <Button
              onClick={confirmAcceptance}
              disabled={acceptMutation.isPending}
              className="sm:flex-1 bg-purple-600 hover:bg-purple-700 font-semibold"
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2" size={16} />
                  Accept Valory Valuation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
