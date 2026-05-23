import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Alert } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AlertsViewProps {
  onAlertsChanged?: () => void;
}

export default function AlertsView({ onAlertsChanged }: AlertsViewProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = async () => {
    const response = await fetch(`${API_URL}/api/alerts`);
    const result = await response.json();

    if (result.success) {
      setAlerts(result.data);
    }
  };

  const markAsRead = async (alertId: string) => {
    const response = await fetch(`${API_URL}/api/alerts/${alertId}/read`, {
      method: 'PUT',
    });
    const result = await response.json();

    if (result.success) {
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
      onAlertsChanged?.();
    }
  };

  useEffect(() => {
    fetchAlerts().catch((error) => {
      console.error('Error fetching alerts:', error);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-4">Alerts</h1>
      <Card className="p-6">
        {alerts.length === 0 ? (
          <p className="text-slate-400">No alerts yet.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 rounded bg-slate-800/70 p-3">
                <AlertCircle className="mt-0.5 text-amber-500" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium capitalize">{alert.type}</p>
                  <p className="text-sm text-slate-300">{alert.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                {!alert.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      markAsRead(alert.id).catch((error) => {
                        console.error('Error marking alert as read:', error);
                      });
                    }}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
