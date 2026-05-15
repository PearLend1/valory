import { Flame, TrendingUp, Clock, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateMomentum, TimelineEvent } from '@/lib/momentumCalculator';

interface MomentumBadgeProps {
  // Support both direct momentum string and timeline events for calculation
  momentum?: 'high' | 'rising' | 'stable' | 'cooling';
  timelineEvents?: TimelineEvent[];
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function MomentumBadge({
  momentum,
  timelineEvents,
  size = 'md',
  showTooltip = true,
}: MomentumBadgeProps) {
  // Calculate momentum from timeline events if provided, otherwise use direct value
  let momentumLevel: string;
  let calculatedData: ReturnType<typeof calculateMomentum> | undefined;

  if (timelineEvents && timelineEvents.length > 0) {
    calculatedData = calculateMomentum(timelineEvents);
    momentumLevel = calculatedData.level.toLowerCase();
  } else {
    momentumLevel = momentum || 'cooling';
  }

  const getConfig = (m: string) => {
    switch (m) {
      case 'high':
        return {
          icon: Flame,
          label: '🔥 High',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          description: 'Hot property - high activity',
          details: calculatedData
            ? `${calculatedData.recentEventCount}+ events in last 7 days`
            : 'Very active market',
        };
      case 'rising':
        return {
          icon: TrendingUp,
          label: '📈 Rising',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
          description: 'Rising interest - moderate activity',
          details: calculatedData
            ? `${calculatedData.recentEventCount} events in last 7 days`
            : 'Gaining momentum',
        };
      case 'stable':
        return {
          icon: Clock,
          label: '⏳ Stable',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          description: 'Stable - consistent interest',
          details: 'Recent activity within 14 days',
        };
      case 'cooling':
        return {
          icon: TrendingDown,
          label: '📉 Cooling',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          description: 'Cooling - low recent activity',
          details: 'No recent activity in 21 days',
        };
      default:
        return {
          icon: Clock,
          label: 'Unknown',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          description: 'Unknown momentum',
          details: 'Unable to determine momentum',
        };
    }
  };

  const config = getConfig(momentumLevel);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  const badgeContent = (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full border ${config.bgColor} ${config.borderColor} ${config.textColor} font-semibold`}
      title={config.description}
    >
      <Icon size={iconSize} />
      <span>{config.label}</span>
    </div>
  );

  // If tooltip is disabled or no events, return badge without tooltip
  if (!showTooltip || !timelineEvents || timelineEvents.length === 0) {
    return badgeContent;
  }

  // Wrap with tooltip showing momentum details
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badgeContent}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">{config.description}</p>
          <p className="text-xs text-gray-300">{config.details}</p>
          {calculatedData?.hasOfferActivity && (
            <p className="text-xs text-yellow-300 font-medium">💰 Offer activity detected</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
