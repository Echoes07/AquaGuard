import { useEffect, useState } from 'react';
import { Droplets, RefreshCw, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Sensor } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function SensorsView() {
  const [sensors, setSensors] = useState<Sensor[]>([]);

  const fetchSensors = async () => {
    const response = await fetch(`${API_URL}/api/sensors`);
    const result = await response.json();

    if (result.success) {
      setSensors(result.data);
    }
  };

  const simulateSensors = async () => {
    const response = await fetch(`${API_URL}/api/simulate`, {
      method: 'POST',
    });
    const result = await response.json();

    if (result.success) {
      await fetchSensors();
    }
  };

  useEffect(() => {
    fetchSensors().catch((error) => {
      console.error('Error fetching sensors:', error);
    });

    const interval = setInterval(() => {
      fetchSensors().catch((error) => {
        console.error('Error fetching sensors:', error);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Sensors</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchSensors().catch((error) => {
                console.error('Error refreshing sensors:', error);
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              simulateSensors().catch((error) => {
                console.error('Error simulating sensors:', error);
              });
            }}
          >
            <Waves className="mr-2 h-4 w-4" />
            Simulate
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sensors.map((sensor) => (
          <Card key={sensor.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{sensor.location}</p>
                <h2 className="text-xl font-semibold">{sensor.name}</h2>
                <p className="mt-4 text-4xl font-bold">
                  {sensor.value.toFixed(1)}
                  <span className="ml-1 text-xl text-slate-400">{sensor.unit}</span>
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Last update: {new Date(sensor.lastUpdate).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 p-3 text-cyan-400">
                <Droplets size={28} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
