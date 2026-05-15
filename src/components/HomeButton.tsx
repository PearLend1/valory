import { Home } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

export default function HomeButton() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleClick = () => {
    // Route agents to dashboard, everyone else to home
    if (user?.role === 'agent') {
      setLocation('/agent-dashboard');
    } else {
      setLocation('/');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
      aria-label="Return to home"
      title={user?.role === 'agent' ? 'Go to Agent Dashboard' : 'Go to Home'}
    >
      <Home size={20} className="text-purple-600" />
      <span className="font-medium text-gray-900">
        {user?.role === 'agent' ? 'Dashboard' : 'Home'}
      </span>
    </button>
  );
}
