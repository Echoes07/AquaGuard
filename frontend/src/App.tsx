import { useState, useEffect } from 'react';
import { 
  Droplets, 
  Activity, 
  Bell, 
  Menu,
  X,
  RefreshCw,
  Settings,
  Home,
  CheckCircle2,
  AlertTriangle,
  Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import DashboardView from '@/sections/DashboardView';
import SensorsView from '@/sections/SensorsView';
import AlertsView from '@/sections/AlertsView';
import type { DashboardSummary, Alert } from '@/types';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard`);
      const result = await response.json();
      if (result.success) {
        setSummary(result.data.summary);
        setAlerts(result.data.recentAlerts);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'sensors', label: 'Water Level', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  const pageTitle = activeTab === 'settings'
    ? 'Settings'
    : navItems.find(n => n.id === activeTab)?.label;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return 'System Normal';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  const getStatusTheme = (status: string) => {
    switch (status) {
      case 'normal':
        return {
          icon: CheckCircle2,
          label: 'System Normal',
          tone: 'text-emerald-300',
          border: 'border-emerald-500/25',
          background: 'bg-emerald-500/10',
          bar: 'bg-emerald-400',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'Needs Attention',
          tone: 'text-amber-300',
          border: 'border-amber-500/25',
          background: 'bg-amber-500/10',
          bar: 'bg-amber-400',
        };
      case 'critical':
        return {
          icon: AlertTriangle,
          label: 'Critical Level',
          tone: 'text-red-300',
          border: 'border-red-500/25',
          background: 'bg-red-500/10',
          bar: 'bg-red-400',
        };
      default:
        return {
          icon: Gauge,
          label: 'Unknown',
          tone: 'text-slate-300',
          border: 'border-slate-700',
          background: 'bg-slate-800',
          bar: 'bg-slate-400',
        };
    }
  };

  const waterLevel = summary ? Number(summary.avgWaterLevel) : 0;
  const clampedWaterLevel = Number.isFinite(waterLevel)
    ? Math.min(100, Math.max(0, waterLevel))
    : 0;
  const statusTheme = getStatusTheme(summary?.systemStatus ?? 'unknown');
  const StatusIcon = statusTheme.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 z-50",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">AquaGuard</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    activeTab === item.id 
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  {item.id === 'alerts' && alerts.filter(a => !a.read).length > 0 && sidebarOpen && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {alerts.filter(a => !a.read).length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <>
              <Separator className="my-4 bg-slate-800" />
              <div className="px-3 py-2">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase text-slate-500">System Status</p>
                  {summary && (
                    <span className={cn("h-2 w-2 rounded-full status-pulse", getStatusColor(summary.systemStatus))} />
                  )}
                </div>
                {summary && (
                  <div className={cn("rounded-lg border p-3", statusTheme.border, statusTheme.background)}>
                    <div className="flex items-start gap-3">
                      <div className={cn("rounded-md p-2", statusTheme.background, statusTheme.tone)}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold", statusTheme.tone)}>
                          {statusTheme.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {getStatusText(summary.systemStatus)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Water level</span>
                        <span className="font-semibold text-slate-100">{summary.avgWaterLevel}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-950/70">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", statusTheme.bar)}
                          style={{ width: `${clampedWaterLevel}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-slate-950/40 p-2">
                        <p className="text-slate-500">Sensors</p>
                        <p className="mt-1 font-semibold text-slate-100">
                          {summary.activeSensors}/{summary.totalSensors} active
                        </p>
                      </div>
                      <div className="rounded-md bg-slate-950/40 p-2">
                        <p className="text-slate-500">Alerts</p>
                        <p className={cn("mt-1 font-semibold", summary.unreadAlerts > 0 ? "text-red-300" : "text-slate-100")}>
                          {summary.unreadAlerts} unread
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Last update: {lastUpdate.toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </ScrollArea>

        {/* Bottom Actions */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-sm font-medium">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-slate-500">AURWSA Manager</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400"
                onClick={() => setActiveTab('settings')}
                aria-label="Open settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-semibold">
              {pageTitle}
            </h1>
            <p className="text-xs text-slate-500">Smart Water Monitoring System</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDashboardData}
              className="border-slate-700 text-slate-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-400"
              onClick={() => setActiveTab('alerts')}
              aria-label="Open alerts"
            >
              <Bell className="w-5 h-5" />
              {alerts.filter(a => !a.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && <DashboardView summary={summary} alerts={alerts} />}
          {activeTab === 'sensors' && <SensorsView />}
          {activeTab === 'alerts' && <AlertsView onAlertsChanged={fetchDashboardData} />}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Settings</h1>
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">API endpoint</p>
                    <p className="font-medium">{API_URL || 'Vite proxy / same origin'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Auto refresh</p>
                    <p className="font-medium">Dashboard updates every 5 seconds</p>
                  </div>
                  <Button onClick={fetchDashboardData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh system data
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
