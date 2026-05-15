import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface EventCreatorModalProps {
  propertyId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EventCreatorModal({
  propertyId,
  isOpen,
  onClose,
  onSuccess,
}: EventCreatorModalProps) {
  const [eventType, setEventType] = useState<'viewing' | 'offer' | 'price' | 'status'>('viewing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Viewing form state
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('');
  const [viewingNote, setViewingNote] = useState('');

  // Offer form state
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');

  // Price form state
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');

  // Status form state
  const [newStatus, setNewStatus] = useState<'under_offer' | 'offer_fell_through' | 'back_on_market' | 'sold'>('under_offer');

  // Mutations
  const createEventMutation = trpc.timeline.createEvent.useMutation();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let details: Record<string, any> = {};
      let title = '';
      let description = '';
      let type = '';

      switch (eventType) {
        case 'viewing':
          if (!viewingDate || !viewingTime) {
            toast.error('Please fill in date and time');
            setIsSubmitting(false);
            return;
          }
          title = 'Viewing Booked';
          description = `Viewing scheduled for ${viewingDate} at ${viewingTime}`;
          type = 'viewing_booked';
          details = {
            viewingDate,
            viewingTime,
            note: viewingNote,
          };
          break;

        case 'offer':
          if (!offerAmount) {
            toast.error('Please enter offer amount');
            setIsSubmitting(false);
            return;
          }
          title = 'Offer Received';
          description = `Offer received: £${parseInt(offerAmount).toLocaleString()}`;
          type = 'offer_received';
          details = {
            offerAmount: parseInt(offerAmount),
            note: offerNote,
          };
          break;

        case 'price':
          if (!newPrice) {
            toast.error('Please enter new price');
            setIsSubmitting(false);
            return;
          }
          title = 'Price Updated';
          description = `Price updated to £${parseInt(newPrice).toLocaleString()}`;
          type = 'price_adjusted';
          details = {
            newPrice: parseInt(newPrice),
            reason: priceReason,
          };
          break;

        case 'status':
          const statusLabels: Record<string, string> = {
            under_offer: 'Under Offer',
            offer_fell_through: 'Offer Fell Through',
            back_on_market: 'Back on Market',
            sold: 'Sold',
          };
          title = statusLabels[newStatus];
          description = `Property status changed to: ${statusLabels[newStatus]}`;
          type = newStatus === 'sold' ? 'sold' : newStatus.replace(/_/g, '_');
          details = { status: newStatus };
          break;
      }

      await createEventMutation.mutateAsync({
        propertyId,
        type: type as any,
        title,
        description,
        details,
      });

      toast.success('Event created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setViewingDate('');
    setViewingTime('');
    setViewingNote('');
    setOfferAmount('');
    setOfferNote('');
    setNewPrice('');
    setPriceReason('');
    setNewStatus('under_offer');
    setEventType('viewing');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Property Event</DialogTitle>
        </DialogHeader>

        <Tabs value={eventType} onValueChange={(v) => setEventType(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="viewing">Viewing</TabsTrigger>
            <TabsTrigger value="offer">Offer</TabsTrigger>
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          {/* Viewing Tab */}
          <TabsContent value="viewing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="viewing-date">Viewing Date</Label>
              <Input
                id="viewing-date"
                type="date"
                value={viewingDate}
                onChange={(e) => setViewingDate(e.target.value)}
                placeholder="Select date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="viewing-time">Viewing Time</Label>
              <Input
                id="viewing-time"
                type="time"
                value={viewingTime}
                onChange={(e) => setViewingTime(e.target.value)}
                placeholder="Select time"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="viewing-note">Notes (Optional)</Label>
              <Textarea
                id="viewing-note"
                value={viewingNote}
                onChange={(e) => setViewingNote(e.target.value)}
                placeholder="Add any notes about the viewing..."
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Offer Tab */}
          <TabsContent value="offer" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="offer-amount">Offer Amount (£)</Label>
              <Input
                id="offer-amount"
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="e.g., 350000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-note">Notes (Optional)</Label>
              <Textarea
                id="offer-note"
                value={offerNote}
                onChange={(e) => setOfferNote(e.target.value)}
                placeholder="Add any notes about the offer..."
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Price Tab */}
          <TabsContent value="price" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-price">New Price (£)</Label>
              <Input
                id="new-price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g., 345000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price-reason">Reason for Change</Label>
              <Select value={priceReason} onValueChange={setPriceReason}>
                <SelectTrigger id="price-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market_adjustment">Market Adjustment</SelectItem>
                  <SelectItem value="competitive_pressure">Competitive Pressure</SelectItem>
                  <SelectItem value="inspection_findings">Inspection Findings</SelectItem>
                  <SelectItem value="vendor_request">Vendor Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as any)}>
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_offer">Under Offer</SelectItem>
                  <SelectItem value="offer_fell_through">Offer Fell Through</SelectItem>
                  <SelectItem value="back_on_market">Back on Market</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 rounded text-sm text-blue-900">
              <p>This will create a timeline event and update the property status.</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
