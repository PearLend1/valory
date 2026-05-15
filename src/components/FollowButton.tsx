import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface FollowButtonProps {
  propertyId: string;
  initialFollowed?: boolean;
  onFollowChange?: (followed: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
}

export default function FollowButton({
  propertyId,
  initialFollowed = false,
  onFollowChange,
  size = 'md',
  variant = 'icon',
}: FollowButtonProps) {
  const [isFollowed, setIsFollowed] = useState(initialFollowed);
  
  // Use tRPC mutation for toggling follow
  const toggleFollowMutation = trpc.follow.toggleFollowProperty.useMutation();
  
  // Check if already following
  const { data: followStatus } = trpc.follow.isFollowing.useQuery({ propertyId });

  const handleToggleFollow = async () => {
    try {
      const result = await toggleFollowMutation.mutateAsync({ propertyId });
      const newFollowedState = result.followed;
      setIsFollowed(newFollowedState);
      onFollowChange?.(newFollowedState);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  if (variant === 'icon') {
    const iconSize = size === 'sm' ? 18 : size === 'md' ? 24 : 32;
    return (
      <button
        onClick={handleToggleFollow}
        disabled={toggleFollowMutation.isPending}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
        title={isFollowed ? 'Remove from saved' : 'Save property'}
      >
        <Heart
          size={iconSize}
          className={`transition-colors ${
            isFollowed
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 hover:text-red-500'
          }`}
        />
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={toggleFollowMutation.isPending}
      variant={isFollowed ? 'default' : 'outline'}
      className={`${
        isFollowed
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'border-red-600 text-red-600 hover:bg-red-50'
      } font-semibold ${
        size === 'sm' ? 'py-1 px-3 text-sm' : size === 'lg' ? 'py-3 px-6 text-lg' : 'py-2 px-4'
      }`}
    >
      <Heart
        size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
        className={`mr-2 ${isFollowed ? 'fill-white' : ''}`}
      />
      {isFollowed ? 'Saved' : 'Save Property'}
    </Button>
  );
}
