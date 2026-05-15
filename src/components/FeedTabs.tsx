import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp } from 'lucide-react';

export interface FeedTabsProps {
  forYouContent: React.ReactNode;
  trendingContent: React.ReactNode;
  isLoadingForYou?: boolean;
  isLoadingTrending?: boolean;
  onTabChange?: (tab: 'for-you' | 'trending') => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({
  forYouContent,
  trendingContent,
  isLoadingForYou,
  isLoadingTrending,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending'>('for-you');

  const handleTabChange = (value: string) => {
    const tab = value as 'for-you' | 'trending';
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
      defaultValue="for-you"
    >
      {/* Tab List */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <TabsList className="w-full grid w-full grid-cols-2 bg-transparent border-0 rounded-none p-0 h-auto">
            {/* For You Tab */}
            <TabsTrigger
              value="for-you"
              className="relative rounded-none border-0 bg-transparent px-4 py-4 font-semibold text-gray-600 data-[state=active]:text-purple-600 data-[state=active]:bg-transparent transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>For You</span>
              </div>
              {activeTab === 'for-you' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full" />
              )}
            </TabsTrigger>

            {/* Trending Tab */}
            <TabsTrigger
              value="trending"
              className="relative rounded-none border-0 bg-transparent px-4 py-4 font-semibold text-gray-600 data-[state=active]:text-purple-600 data-[state=active]:bg-transparent transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </div>
              {activeTab === 'trending' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* For You Content */}
      <TabsContent
        value="for-you"
        className="animate-in fade-in-50 duration-300 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-50"
      >
        {isLoadingForYou ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          forYouContent
        )}
      </TabsContent>

      {/* Trending Content */}
      <TabsContent
        value="trending"
        className="animate-in fade-in-50 duration-300 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-50"
      >
        {isLoadingTrending ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          trendingContent
        )}
      </TabsContent>
    </Tabs>
  );
};

export default FeedTabs;
