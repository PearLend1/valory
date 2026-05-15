import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveSearchAlertsProps {
  title?: string;
  successMessage?: string;
  onSubmit?: (email: string) => void;
}

export default function SaveSearchAlerts({
  title = 'Get Alerts for Similar Properties',
  successMessage = "You'll receive alerts when new properties match!",
  onSubmit,
}: SaveSearchAlertsProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Validate email
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      // Call custom onSubmit if provided
      if (onSubmit) {
        onSubmit(email);
      } else {
        // Default: submit to API endpoint
        const response = await fetch('/api/search-alerts/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error('Failed to subscribe to alerts');
        }
      }

      setIsSuccess(true);
      setEmail('');

      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-[#E81F7A] to-purple-600 rounded-lg p-8 text-white">
      <div className="flex items-start gap-4 mb-6">
        <Bell size={28} className="flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-white text-opacity-90">
            Never miss a property that matches your criteria. Get instant notifications when new listings are added.
          </p>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-4 p-4 bg-white bg-opacity-20 border border-white border-opacity-40 rounded-lg flex items-start gap-3">
          <Check size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-300 border-opacity-40 rounded-lg">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          disabled={isSuccess}
        />
        <Button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="bg-white text-[#E81F7A] hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSuccess ? 'Subscribed!' : isSubmitting ? 'Subscribing...' : 'Notify Me'}
        </Button>
      </form>
    </div>
  );
}
