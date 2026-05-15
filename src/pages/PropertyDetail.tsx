import { useState } from 'react';
import { Heart, MapPin, Bed, Bath, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MomentumTimeline from '@/components/MomentumTimeline';
import MomentumBadge from '@/components/MomentumBadge';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export default function PropertyDetail() {
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [location] = useLocation();
  
  // Extract property ID from URL
  const propertyIdStr = location.split('/').pop() || '1';
  const propertyId = parseInt(propertyIdStr, 10);
  
  // Fetch timeline events from backend
  const { data: timelineData, isLoading: timelineLoading } = trpc.timeline.getPropertyTimeline.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );
  
  // Use real timeline events from backend or fallback to mock
  const timelineEvents = (Array.isArray(timelineData) ? timelineData : []).map((event: any) => ({
    ...event,
    timestamp: new Date(event.timestamp),
  })) || [
    {
      id: '1',
      type: 'launched' as const,
      title: 'Property Launched',
      description: 'Property listing went live on Valory',
      timestamp: new Date('2026-01-15T10:00:00'),
    },
    {
      id: '2',
      type: 'viewing_booked' as const,
      title: 'First Viewing Booked',
      description: 'Initial viewing scheduled',
      timestamp: new Date('2026-01-16T14:30:00'),
    },
    {
      id: '3',
      type: 'viewing_milestone' as const,
      title: '5th Viewing Milestone',
      description: 'Property has reached 5 viewings!',
      timestamp: new Date('2026-01-18T16:00:00'),
      details: { viewingCount: 5 },
    },
    {
      id: '4',
      type: 'media_uploaded' as const,
      title: 'New Media Uploaded',
      description: 'Agent uploaded property video tour',
      timestamp: new Date('2026-01-19T11:00:00'),
    },
    {
      id: '5',
      type: 'offer_received' as const,
      title: 'Offer Received',
      description: 'First offer received from interested buyer',
      timestamp: new Date('2026-01-20T09:00:00'),
    },
  ];

  // Mock property data - replace with actual API call
  const property = {
    id: '1',
    title: '3 Bedroom Victorian Townhouse',
    location: 'Shoreditch, London',
    price: '£1,250,000',
    description:
      'Beautiful Victorian townhouse with original features, modern kitchen, and private garden. Perfect for families or professionals looking for character and space in a vibrant neighborhood.',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    lat: 51.5228,
    lng: -0.0855,
    images: [
      'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    ],
    agent: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@valory.com',
      phone: '+44 20 7946 0958',
    },
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section with Image Gallery */}
      <div className="relative bg-slate-800 h-96 md:h-[500px] overflow-hidden">
        <img
          src={property.images[currentImageIndex]}
          alt={property.title}
          className="w-full h-full object-cover"
        />

        {/* Image Navigation */}
        {property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-950 bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-950 bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
              aria-label="Next image"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white px-3 py-1 rounded-full text-sm">
          {currentImageIndex + 1} / {property.images.length}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className="absolute top-4 right-4 bg-slate-950 bg-opacity-80 rounded-full p-3 hover:bg-opacity-100 transition-all shadow-lg border border-slate-700"
          aria-label="Save property"
        >
          <Heart
            size={24}
            className={isFavorited ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}
          />
        </button>
      </div>

      {/* Property Info Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Title and Location */}
            <div className="mb-6">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h1 className="text-4xl font-bold text-white">{property.title}</h1>
                {timelineEvents && timelineEvents.length > 0 && (
                  <MomentumBadge timelineEvents={timelineEvents} size="md" showTooltip={true} />
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <MapPin size={20} />
                <span className="text-lg">{property.location}</span>
              </div>
              <div className="text-3xl font-bold text-amber-500 mb-4">{property.price}</div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Bed size={24} className="text-amber-600" />
                <div>
                  <p className="text-sm text-slate-400">Bedrooms</p>
                  <p className="text-xl font-semibold text-white">{property.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bath size={24} className="text-amber-600" />
                <div>
                  <p className="text-sm text-slate-400">Bathrooms</p>
                  <p className="text-xl font-semibold text-white">{property.bathrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Maximize2 size={24} className="text-amber-600" />
                <div>
                  <p className="text-sm text-slate-400">Square Feet</p>
                  <p className="text-xl font-semibold text-white">{property.squareFeet}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">About this property</h2>
              <p className="text-slate-300 leading-relaxed text-lg">{property.description}</p>
            </div>

            {/* Map Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Location</h2>
              <div className="bg-slate-800 h-96 rounded-lg flex items-center justify-center border border-slate-700">
                <p className="text-slate-400">
                  Map integration: {property.location} ({property.lat}, {property.lng})
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Agent Info & Actions */}
          <div className="md:col-span-1">
            {/* Agent Card */}
            <div className="bg-slate-900 rounded-lg p-6 mb-6 sticky top-24 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4">Listing Agent</h3>
              <div className="mb-4">
                <p className="font-semibold text-white">{property.agent.name}</p>
                <p className="text-sm text-slate-400">{property.agent.email}</p>
                <p className="text-sm text-slate-400">{property.agent.phone}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3"
                  onClick={() => alert('Book viewing feature coming soon')}
                >
                  Book a Viewing
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-amber-600 text-amber-500 hover:bg-amber-600/10 font-semibold py-3"
                  onClick={() => alert('Contact agent feature coming soon')}
                >
                  Contact Agent
                </Button>
              </div>

              {/* Save Search Alert */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-sm font-semibold text-white mb-3">Get alerts for similar properties</p>
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm mb-2 bg-slate-950 text-white placeholder-slate-500"
                />
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2"
                  onClick={() => alert('Alert subscription saved')}
                >
                  Notify Me
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Momentum Timeline Section */}
      <div className="bg-slate-900/50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <MomentumTimeline events={timelineEvents} propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}
