import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  getPopularitySignal,
  shouldShowPopularityBadge,
  getSaveCountDisplay,
  getTimeBasedPopularityLabel,
  type PopularityMetrics,
} from '@shared/popularity-signals';

interface PopularityBadgeProps {
  metrics: PopularityMetrics;
  variant?: 'card' | 'detail' | 'compact';
  showSaveCount?: boolean;
}

/**
 * PopularityBadge Component
 * 
 * Displays privacy-safe popularity signals on property cards and detail pages.
 * Shows aggregate engagement without exposing individual user data.
 */
export function PopularityBadge({
  metrics,
  variant = 'card',
  showSaveCount = true,
}: PopularityBadgeProps) {
  if (!shouldShowPopularityBadge(metrics)) {
    return null;
  }

  const signal = getPopularitySignal(metrics);
  if (!signal) {
    return null;
  }

  const saveCountDisplay = getSaveCountDisplay(metrics.saveCount);
  const timeLabel = getTimeBasedPopularityLabel(metrics.recentSaveCount, metrics.recentViewCount);

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1">
              <span>{signal.icon}</span>
              <span>{signal.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{signal.description}</p>
            {saveCountDisplay && <p className="text-xs">{saveCountDisplay}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{signal.icon}</span>
          <div>
            <p className="font-semibold text-sm">{signal.label}</p>
            <p className="text-xs text-muted-foreground">{signal.description}</p>
          </div>
        </div>
        {timeLabel && <p className="text-xs text-muted-foreground">{timeLabel}</p>}
        {showSaveCount && saveCountDisplay && (
          <p className="text-sm font-medium">{saveCountDisplay}</p>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base">{signal.icon}</span>
      <span className="text-xs font-medium">{signal.label}</span>
      {showSaveCount && saveCountDisplay && (
        <span className="text-xs text-muted-foreground">• {saveCountDisplay}</span>
      )}
    </div>
  );
}

/**
 * PopularityStats Component
 * 
 * Displays detailed popularity statistics for property detail pages.
 */
interface PopularityStatsProps {
  metrics: PopularityMetrics;
}

export function PopularityStats({ metrics }: PopularityStatsProps) {
  const signal = getPopularitySignal(metrics);
  const saveCountDisplay = getSaveCountDisplay(metrics.saveCount);
  const timeLabel = getTimeBasedPopularityLabel(metrics.recentSaveCount, metrics.recentViewCount);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">Buyer Interest</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {signal ? signal.description : 'Standard interest level'}
          </p>
        </div>
        {signal && <span className="text-2xl">{signal.icon}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        {saveCountDisplay && (
          <div>
            <p className="text-xs text-muted-foreground">Total Saves</p>
            <p className="font-semibold text-sm">{saveCountDisplay}</p>
          </div>
        )}
        {timeLabel && (
          <div>
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="font-semibold text-sm">{timeLabel}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        Popularity metrics help you understand buyer interest in this property.
      </p>
    </div>
  );
}

/**
 * PopularityIndicator Component
 * 
 * Minimal inline popularity indicator for list views.
 */
interface PopularityIndicatorProps {
  metrics: PopularityMetrics;
}

export function PopularityIndicator({ metrics }: PopularityIndicatorProps) {
  const signal = getPopularitySignal(metrics);
  if (!signal) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary ${signal.color}`}>
            <span className="text-sm">{signal.icon}</span>
            <span className="text-xs font-medium">{signal.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{signal.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
