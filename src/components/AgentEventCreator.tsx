import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface AgentEventCreatorProps {
  propertyId: string;
  agentId: string;
  onEventCreated?: () => void;
}

type EventType = 'viewing' | 'price' | 'offer' | 'status' | 'media';

export default function AgentEventCreator({ propertyId, agentId, onEventCreated }: AgentEventCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EventType>('viewing');
  const [loading, setLoading] = useState(false);

  // Log Viewing state
  const [viewingNote, setViewingNote] = useState('');
  const [viewingDate, setViewingDate] = useState('');

  // Update Price state
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('market');

  // Record Offer state
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');

  // Change Status state
  const [statusType, setStatusType] = useState<'under_offer' | 'fell_through' | 'back_on_market' | 'sold'>('under_offer');

  // tRPC mutation for creating timeline events
  const createEventMutation = trpc.timeline.createEvent.useMutation();

  const handleLogViewing = async () => {
    if (!viewingDate) {
      alert('Please select a date');
      return;
    }
    setLoading(true);
    try {
      // Call tRPC to create viewing_booked event
      await createEventMutation.mutateAsync({
        propertyId: parseInt(propertyId, 10),
        type: 'viewing_booked',
        title: 'Viewing Booked',
        description: viewingNote || 'Viewing scheduled',
        details: { viewingDate },
      });
      setViewingNote('');
      setViewingDate('');
      onEventCreated?.();
      alert('Viewing logged successfully');
    } catch (error) {
      console.error('Failed to log viewing:', error);
      alert('Failed to log viewing');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice) {
      alert('Please enter new price');
      return;
    }
    setLoading(true);
    try {
      // Call tRPC to create price_adjusted event
      await createEventMutation.mutateAsync({
        propertyId: parseInt(propertyId, 10),
        type: 'price_adjusted',
        title: 'Price Adjusted',
        description: `Price updated to £${newPrice}`,
        details: { newPrice, priceReason },
      });
      setNewPrice('');
      setPriceReason('market');
      onEventCreated?.();
      alert('Price updated successfully');
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOffer = async () => {
    if (!offerAmount) {
      alert('Please enter offer amount');
      return;
    }
    setLoading(true);
    try {
      // Call tRPC to create offer_received event
      await createEventMutation.mutateAsync({
        propertyId: parseInt(propertyId, 10),
        type: 'offer_received',
        title: 'Offer Received',
        description: `Offer of £${offerAmount} received`,
        details: { offerAmount, offerNote },
      });
      setOfferAmount('');
      setOfferNote('');
      onEventCreated?.();
      alert('Offer recorded successfully');
    } catch (error) {
      console.error('Failed to record offer:', error);
      alert('Failed to record offer');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    setLoading(true);
    try {
      // Map status types to timeline event types
      const eventTypeMap: Record<typeof statusType, string> = {
        under_offer: 'offer_accepted',
        fell_through: 'offer_fallen_through',
        back_on_market: 'back_on_market',
        sold: 'sold',
      };

      const eventType = eventTypeMap[statusType];
      const titleMap: Record<typeof statusType, string> = {
        under_offer: 'Under Offer',
        fell_through: 'Offer Fell Through',
        back_on_market: 'Back on Market',
        sold: 'Sold',
      };

      // Call tRPC to create status change event
      await createEventMutation.mutateAsync({
        propertyId: parseInt(propertyId, 10),
        type: eventType as any,
        title: titleMap[statusType],
        description: `Property status changed to ${titleMap[statusType]}`,
        details: { statusType },
      });
      onEventCreated?.();
      alert('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 mb-4"
      >
        Agent Actions
      </Button>
    );
  }

  return (
    <Card className="p-6 mb-6 border-purple-200 bg-purple-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Agent Actions</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { id: 'viewing' as const, label: 'Log Viewing' },
          { id: 'price' as const, label: 'Update Price' },
          { id: 'offer' as const, label: 'Record Offer' },
          { id: 'status' as const, label: 'Change Status' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Log Viewing */}
      {activeTab === 'viewing' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Viewing Date & Time
            </label>
            <input
              type="datetime-local"
              value={viewingDate}
              onChange={(e) => setViewingDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={viewingNote}
              onChange={(e) => setViewingNote(e.target.value)}
              placeholder="Add any notes about the viewing..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
          </div>
          <Button
            onClick={handleLogViewing}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
          >
            {loading ? 'Logging...' : 'Log Viewing'}
          </Button>
        </div>
      )}

      {/* Update Price */}
      {activeTab === 'price' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Price (£)
            </label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="e.g., 500000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Change
            </label>
            <select
              value={priceReason}
              onChange={(e) => setPriceReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="market">Market Adjustment</option>
              <option value="strategy">Strategic Decision</option>
              <option value="vendor">Vendor Request</option>
            </select>
          </div>
          <Button
            onClick={handleUpdatePrice}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
          >
            {loading ? 'Updating...' : 'Update Price'}
          </Button>
        </div>
      )}

      {/* Record Offer */}
      {activeTab === 'offer' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Offer Amount (£)
            </label>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="e.g., 475000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={offerNote}
              onChange={(e) => setOfferNote(e.target.value)}
              placeholder="Add any notes about the offer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
          </div>
          <Button
            onClick={handleRecordOffer}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2"
          >
            {loading ? 'Recording...' : 'Record Offer'}
          </Button>
        </div>
      )}

      {/* Change Status */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Status
            </label>
            <select
              value={statusType}
              onChange={(e) => setStatusType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
            >
              <option value="under_offer">Under Offer</option>
              <option value="fell_through">Offer Fell Through</option>
              <option value="back_on_market">Back on Market</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <Button
            onClick={handleChangeStatus}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      )}
    </Card>
  );
}
