const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const UNISMS_API_BASE_URL = 'https://unismsapi.com/api';
const UNISMS_API_KEY = process.env.UNISMS_API_KEY || '';
const SMS_ALERT_RECIPIENTS = (process.env.SMS_ALERT_RECIPIENTS || '')
  .split(',')
  .map((recipient) => recipient.trim())
  .filter(Boolean);
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || '';
const SMS_ALERT_COOLDOWN_MS = Number(process.env.SMS_ALERT_COOLDOWN_MS || 10 * 60 * 1000);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory data stores
let sensors = [
  { id: 'S001', name: 'Prototype Tank Level', type: 'level', location: 'ESP32 + HC-SR04', value: 78.5, unit: '%', status: 'normal', lastUpdate: new Date().toISOString() },
];

let alerts = [
  { id: 'A001', type: 'info', message: 'Water level monitoring prototype is online', sensorId: 'S001', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
];

let historicalData = [];
let smsAlertLog = [];
const lastCriticalSmsBySensor = new Map();

const getLevelStatus = (value) => {
  if (value < 30) return 'critical';
  if (value < 60) return 'warning';
  return 'normal';
};

const createAlert = ({ type, message, sensorId }) => {
  const newAlert = {
    id: `A${String(alerts.length + 1).padStart(3, '0')}`,
    type,
    message,
    sensorId,
    timestamp: new Date().toISOString(),
    read: false
  };

  alerts.unshift(newAlert);
  return newAlert;
};

const sendSms = async ({ recipient, content, metadata }) => {
  if (!UNISMS_API_KEY) {
    throw new Error('UNISMS_API_KEY is not configured');
  }

  const body = {
    recipient,
    content: content.slice(0, 160),
  };

  if (SMS_SENDER_ID) {
    body.sender_id = SMS_SENDER_ID;
  }

  if (metadata) {
    body.metadata = metadata;
  }

  const response = await fetch(`${UNISMS_API_BASE_URL}/sms`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${UNISMS_API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = responseBody.message || responseBody.error || `UniSMS request failed with ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return responseBody;
};

const sendCriticalSmsAlert = async (sensor) => {
  if (sensor.status !== 'critical' || SMS_ALERT_RECIPIENTS.length === 0) {
    return;
  }

  const now = Date.now();
  const lastSentAt = lastCriticalSmsBySensor.get(sensor.id) || 0;

  if (now - lastSentAt < SMS_ALERT_COOLDOWN_MS) {
    return;
  }

  lastCriticalSmsBySensor.set(sensor.id, now);

  const content = `AquaGuard ALERT: ${sensor.name} is critical at ${Number(sensor.value).toFixed(1)}${sensor.unit}. Check water level.`;

  const results = await Promise.allSettled(
    SMS_ALERT_RECIPIENTS.map((recipient) =>
      sendSms({
        recipient,
        content,
        metadata: {
          source: 'aquaguard',
          sensor_id: sensor.id,
          status: sensor.status,
        },
      })
    )
  );

  results.forEach((result, index) => {
    smsAlertLog.unshift({
      id: `SMS${String(smsAlertLog.length + 1).padStart(3, '0')}`,
      sensorId: sensor.id,
      recipient: SMS_ALERT_RECIPIENTS[index],
      status: result.status === 'fulfilled' ? 'queued' : 'failed',
      timestamp: new Date().toISOString(),
      response: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null,
    });
  });

  smsAlertLog = smsAlertLog.slice(0, 50);
};

// Generate historical data for the past 7 days
for (let i = 0; i < 168; i++) {
  const timestamp = new Date(Date.now() - (167 - i) * 3600000).toISOString();
  historicalData.push({
    timestamp,
    sensors: {
      'S001': 75 + Math.random() * 10,
    }
  });
}

// Routes

// Health check / root endpoint for backend-only deployments
app.get('/', (req, res, next) => {
  if (fs.existsSync(frontendIndexPath)) {
    return next();
  }

  res.json({
    success: true,
    message: 'AquaGuard backend is running',
    endpoints: ['/api/dashboard', '/api/sensors', '/api/alerts', '/api/sms/status'],
  });
});

// Get all sensors
app.get('/api/sensors', (req, res) => {
  res.json({ success: true, data: sensors });
});

// Get sensor by ID
app.get('/api/sensors/:id', (req, res) => {
  const sensor = sensors.find(s => s.id === req.params.id);
  if (!sensor) {
    return res.status(404).json({ success: false, message: 'Sensor not found' });
  }
  res.json({ success: true, data: sensor });
});

// Update sensor value
app.post('/api/sensors/:id/update', (req, res) => {
  const sensor = sensors.find(s => s.id === req.params.id);
  if (!sensor) {
    return res.status(404).json({ success: false, message: 'Sensor not found' });
  }
  
  const numericValue = Number(req.body.value);
  if (!Number.isFinite(numericValue)) {
    return res.status(400).json({ success: false, message: 'Sensor value must be a number' });
  }

  const previousStatus = sensor.status;

  sensor.value = numericValue;
  sensor.lastUpdate = new Date().toISOString();
  
  // Auto-update status based on thresholds
  if (sensor.type === 'level') {
    sensor.status = getLevelStatus(numericValue);
  }

  if (sensor.status === 'critical' && previousStatus !== 'critical') {
    createAlert({
      type: 'critical',
      message: `${sensor.name} is critical at ${numericValue.toFixed(1)}${sensor.unit}`,
      sensorId: sensor.id,
    });

    sendCriticalSmsAlert(sensor).catch((error) => {
      console.error('Critical SMS alert failed:', error.message);
    });
  }
  
  // Add to historical data
  historicalData.push({
    timestamp: new Date().toISOString(),
    sensors: { [sensor.id]: numericValue }
  });
  
  res.json({ success: true, data: sensor });
});

// Get all alerts
app.get('/api/alerts', (req, res) => {
  res.json({ success: true, data: alerts });
});

// Create new alert
app.post('/api/alerts', (req, res) => {
  const { type, message, sensorId } = req.body;
  const newAlert = createAlert({
    type,
    message,
    sensorId
  });
  res.json({ success: true, data: newAlert });
});

// Mark alert as read
app.put('/api/alerts/:id/read', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ success: false, message: 'Alert not found' });
  }
  alert.read = true;
  res.json({ success: true, data: alert });
});

// Get historical data
app.get('/api/historical', (req, res) => {
  const { sensorId, hours = 24 } = req.query;
  let data = historicalData.slice(-parseInt(hours));
  
  if (sensorId) {
    data = data.map(d => ({
      timestamp: d.timestamp,
      value: d.sensors[sensorId] || null
    }));
  }
  
  res.json({ success: true, data });
});

// Get dashboard summary
app.get('/api/dashboard', (req, res) => {
  const totalSensors = sensors.length;
  const activeSensors = sensors.filter(s => s.status === 'normal').length;
  const warningSensors = sensors.filter(s => s.status === 'warning').length;
  const criticalSensors = sensors.filter(s => s.status === 'critical').length;
  const unreadAlerts = alerts.filter(a => !a.read).length;
  
  const avgLevel = sensors.filter(s => s.type === 'level').reduce((acc, s) => acc + s.value, 0) / 
                   sensors.filter(s => s.type === 'level').length;
  
  res.json({
    success: true,
    data: {
      summary: {
        totalSensors,
        activeSensors,
        warningSensors,
        criticalSensors,
        unreadAlerts,
        avgWaterLevel: avgLevel.toFixed(1),
        systemStatus: criticalSensors > 0 ? 'critical' : warningSensors > 0 ? 'warning' : 'normal'
      },
      sensors,
      recentAlerts: alerts.slice(0, 5)
    }
  });
});

app.get('/api/sms/status', (req, res) => {
  res.json({
    success: true,
    data: {
      configured: Boolean(UNISMS_API_KEY),
      recipientsConfigured: SMS_ALERT_RECIPIENTS.length,
      cooldownMs: SMS_ALERT_COOLDOWN_MS,
      recentAlerts: smsAlertLog.slice(0, 10),
    },
  });
});

// Simulate sensor data updates (for demo)
app.post('/api/simulate', (req, res) => {
  sensors.forEach(sensor => {
    if (sensor.type === 'level') {
      sensor.value = Math.max(10, Math.min(100, sensor.value + (Math.random() - 0.5) * 5));
      sensor.status = getLevelStatus(sensor.value);
    }
    sensor.lastUpdate = new Date().toISOString();
  });
  res.json({ success: true, message: 'Sensors updated' });
});

if (fs.existsSync(frontendIndexPath)) {
  // Serve static files from the React app when frontend/dist is available
  app.use(express.static(frontendDistPath));

  // Handle React routing, return all non-API requests to React app
  app.get('*', (req, res) => {
    res.sendFile(frontendIndexPath);
  });
}

app.listen(PORT, () => {
  console.log(`AquaGuard Server running on port ${PORT}`);
});

module.exports = app;
