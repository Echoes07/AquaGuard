import { AlertCircle, CheckCircle2, Droplets, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DashboardSummary, Alert } from '@/types';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  alerts: Alert[];
}

export default function DashboardView({ summary, alerts }: DashboardViewProps) {
  if (!summary) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Water Level</p>
              <p className="text-2xl font-bold">{summary.avgWaterLevel}%</p>
            </div>
            <Droplets className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Sensor Status</p>
              <p className="text-2xl font-bold capitalize">{summary.systemStatus}</p>
            </div>
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Unread Alerts</p>
              <p className="text-2xl font-bold">{summary.unreadAlerts}</p>
            </div>
            <Gauge className="text-cyan-500" size={32} />
          </div>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-slate-800/70 rounded">
                <AlertCircle size={20} className="text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium capitalize">{alert.type}</p>
                  <p className="text-sm text-slate-300">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
