import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, TrendingUp, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

export interface AgentMatchCardProps {
  agentId: number;
  name: string;
  profileImage?: string;
  matchReasons: string[];
  localRelevance: {
    postcode: string;
    yearsInArea: number;
    coverage: string;
  };
  marketingQuality: {
    score: number; // 0-15
    style: string;
    profileCompleteness: number; // 0-100
  };
  valuationRealism: {
    accuracy: number; // 0-100
    approach: string;
  };
  feedback: {
    averageRating: number; // 1-5
    count: number;
  };
  earlyInterest?: boolean;
  responseTime?: number; // minutes
  isSelected?: boolean;
  onContact?: () => void;
  onViewProfile?: () => void;
}

export const AgentMatchCard: React.FC<AgentMatchCardProps> = ({
  name,
  profileImage,
  matchReasons,
  localRelevance,
  marketingQuality,
  valuationRealism,
  feedback,
  earlyInterest,
  responseTime,
  isSelected,
  onContact,
  onViewProfile,
}) => {
  const getQualityColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-gray-400';
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.round(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className={`relative transition-all ${isSelected ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md'}`}>
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-purple-600 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Selected
          </Badge>
        </div>
      )}

      {earlyInterest && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-orange-500 text-white">Early Interest</Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {profileImage ? (
            <img
              src={profileImage}
              alt={name}
              className="w-12 h-12 rounded-full object-cover bg-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
              {name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {matchReasons.slice(0, 2).join(' • ')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quality Signals Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          {/* Local Relevance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              <MapPin className="w-3 h-3" />
              Local Knowledge
            </div>
            <div className="text-xs text-gray-600">
              <div>{localRelevance.postcode}</div>
              <div className="text-gray-500">{localRelevance.yearsInArea} years in area</div>
            </div>
          </div>

          {/* Marketing Quality */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              <TrendingUp className="w-3 h-3" />
              Marketing
            </div>
            <div className={`text-xs font-semibold ${getQualityColor(marketingQuality.score, 15)}`}>
              {marketingQuality.style}
            </div>
            <div className="text-xs text-gray-500">{marketingQuality.profileCompleteness}% profile</div>
          </div>

          {/* Valuation Realism */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              <TrendingUp className="w-3 h-3" />
              Valuation
            </div>
            <div className={`text-xs font-semibold ${getQualityColor(valuationRealism.accuracy, 100)}`}>
              {Math.round(valuationRealism.accuracy)}% accurate
            </div>
            <div className="text-xs text-gray-500">{valuationRealism.approach}</div>
          </div>

          {/* Star Rating */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              <Star className="w-3 h-3" />
              Rating
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {renderStars(feedback.averageRating)}
              </div>
              <span className="text-xs text-gray-500 ml-1">({feedback.count})</span>
            </div>
          </div>
        </div>

        {/* Response Time */}
        {responseTime && (
          <div className="flex items-center gap-2 px-2 py-2 bg-blue-50 rounded text-xs">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-blue-700">
              Responds in <strong>{formatResponseTime(responseTime)}</strong>
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onContact}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Contact
          </Button>
          <Button
            onClick={onViewProfile}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentMatchCard;
