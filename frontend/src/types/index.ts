export interface DashboardSummary {
  totalSensors: number;
  activeSensors: number;
  warningSensors: number;
  criticalSensors: number;
  unreadAlerts: number;
  avgWaterLevel: string;
  systemStatus: 'normal' | 'warning' | 'critical';
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  sensorId: string | null;
  timestamp: string;
  read: boolean;
}

export interface Sensor {
  id: string;
  name: string;
  type: 'level';
  location: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: string;
}
