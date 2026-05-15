import { Home, Eye, FileText, DollarSign, Handshake, AlertCircle, RotateCw, Plus } from 'lucide-react';
import { format } from 'date-fns';

export interface TimelineEvent {
  id: string;
  type: 'launched' | 'viewing_booked' | 'viewing_milestone' | 'media_uploaded' | 'price_adjusted' | 'offer_received' | 'offer_accepted' | 'offer_fallen_through' | 'back_on_market';
  title: string;
  description?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

interface MomentumTimelineProps {
  events: TimelineEvent[];
  propertyId?: string;
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'launched':
      return <Home size={20} className="text-purple-600" />;
    case 'viewing_booked':
      return <Eye size={20} className="text-blue-600" />;
    case 'viewing_milestone':
      return <Plus size={20} className="text-orange-600" />;
    case 'media_uploaded':
      return <FileText size={20} className="text-pink-600" />;
    case 'price_adjusted':
      return <DollarSign size={20} className="text-green-600" />;
    case 'offer_received':
      return <Handshake size={20} className="text-indigo-600" />;
    case 'offer_accepted':
      return <Handshake size={20} className="text-emerald-600" />;
    case 'offer_fallen_through':
      return <AlertCircle size={20} className="text-red-600" />;
    case 'back_on_market':
      return <RotateCw size={20} className="text-amber-600" />;
    default:
      return <Home size={20} className="text-gray-600" />;
  }
};

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'launched':
      return 'bg-purple-100 border-purple-300';
    case 'viewing_booked':
      return 'bg-blue-100 border-blue-300';
    case 'viewing_milestone':
      return 'bg-orange-100 border-orange-300';
    case 'media_uploaded':
      return 'bg-pink-100 border-pink-300';
    case 'price_adjusted':
      return 'bg-green-100 border-green-300';
    case 'offer_received':
      return 'bg-indigo-100 border-indigo-300';
    case 'offer_accepted':
      return 'bg-emerald-100 border-emerald-300';
    case 'offer_fallen_through':
      return 'bg-red-100 border-red-300';
    case 'back_on_market':
      return 'bg-amber-100 border-amber-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

const getEventBadgeColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'launched':
      return 'bg-purple-200 text-purple-800';
    case 'viewing_booked':
      return 'bg-blue-200 text-blue-800';
    case 'viewing_milestone':
      return 'bg-orange-200 text-orange-800';
    case 'media_uploaded':
      return 'bg-pink-200 text-pink-800';
    case 'price_adjusted':
      return 'bg-green-200 text-green-800';
    case 'offer_received':
      return 'bg-indigo-200 text-indigo-800';
    case 'offer_accepted':
      return 'bg-emerald-200 text-emerald-800';
    case 'offer_fallen_through':
      return 'bg-red-200 text-red-800';
    case 'back_on_market':
      return 'bg-amber-200 text-amber-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

export default function MomentumTimeline({ events }: MomentumTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No timeline events yet. Check back soon!</p>
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Property Momentum</h2>
        <span className="text-sm text-gray-600">{events.length} events</span>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-orange-400" />

        {/* Timeline events */}
        <div className="space-y-6">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative pl-20">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-12 h-12 bg-white border-4 border-purple-600 rounded-full flex items-center justify-center shadow-md">
                {getEventIcon(event.type)}
              </div>

              {/* Event card */}
              <div
                className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${getEventColor(
                  event.type
                )}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getEventBadgeColor(event.type)}`}>
                        {event.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                    )}
                    <p className="text-xs text-gray-600">
                      {format(new Date(event.timestamp), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Event details if available */}
                {event.details && Object.keys(event.details).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300 text-sm">
                    {Object.entries(event.details).map(([key, value]) => (
                      <div key={key} className="text-gray-700">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
