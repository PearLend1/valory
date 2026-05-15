import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import AgentProfile from './AgentProfile';
import BuyerProfile from './BuyerProfile';
import SellerProfile from './SellerProfile';

/**
 * Profile Router - Routes to the correct profile page based on user role
 */
export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Auto-redirect if no user
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Route to role-specific profiles
  switch (user.role) {
    case 'agent':
      return <AgentProfile />;
    case 'public':
      return <BuyerProfile />;
    case 'vendor':
      return <SellerProfile />;
    case 'admin':
      return <BuyerProfile />; // Fallback for admin
    default:
      return <BuyerProfile />; // Default profile
  }
}
