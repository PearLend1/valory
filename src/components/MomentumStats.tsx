import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Users, Clock } from 'lucide-react';

interface MomentumStatsProps {
  properties: any[];
  momentumData: Record<number, any>;
}

export default function MomentumStats({ properties, momentumData }: MomentumStatsProps) {
  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Rising':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Stable':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cooling':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'High':
        return '🔥';
      case 'Rising':
        return '📈';
      case 'Stable':
        return '⏳';
      case 'Cooling':
        return '📉';
      default:
        return '•';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Events (7 days)</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {(Object.values(momentumData).reduce((sum: number, s: any) => sum + (s.recentEvents || 0), 0) / (properties.length || 1)).toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Properties Updated</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {Object.values(momentumData).filter((s: any) => s.daysSinceUpdate <= 7).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {Object.values(momentumData).filter((s: any) => s.needsAttention).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Property Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Property Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Momentum</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Events (7d)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Events</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Update</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property: any) => {
                  const stats = momentumData[property.id];
                  if (!stats) return null;

                  return (
                    <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{property.title}</p>
                          <p className="text-xs text-gray-500">{property.address}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getMomentumColor(stats.momentum)}`}>
                          {getMomentumIcon(stats.momentum)} {stats.momentum}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-gray-900">{stats.recentEvents}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-600">{stats.eventCount}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-600">{stats.daysSinceUpdate}d ago</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stats.needsAttention ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ⚠️ Needs Attention
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Properties Needing Attention */}
      {Object.values(momentumData).some((s: any) => s.needsAttention) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Properties Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {properties
                .filter((p: any) => momentumData[p.id]?.needsAttention)
                .map((property: any) => {
                  const stats = momentumData[property.id];
                  return (
                    <div key={property.id} className="p-3 bg-white rounded border border-red-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{property.title}</p>
                          <p className="text-sm text-gray-600">
                            No updates for {stats.daysSinceUpdate} days
                          </p>
                        </div>
                        <button className="text-sm font-medium text-red-600 hover:text-red-700">
                          Update Now
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
