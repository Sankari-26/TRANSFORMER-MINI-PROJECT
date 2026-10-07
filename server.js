const express = require('express');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI("AIzaSyBT670iU4Io9S2S2jlypv3YPojDnD6-zYc");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000" }
});

app.use(cors());
app.use(express.json());

/* ===============================
   CONFIG
================================ */
const RATED_CURRENT = 120; // Rated transformer current

/* ===============================
   DATABASE CONNECTION
================================ */
mongoose.connect('mongodb://127.0.0.1:27017/transformer-monitor')
.then(async () => {
  console.log("MongoDB Connected");
  await initializeDemoData();
})
.catch(err => console.log(err));

/* ===============================
   SCHEMA
================================ */
const transformerSchema = new mongoose.Schema({
  transformerId: Number,
  current: Number,
  loadPercent: Number,
  oilLevel: Number,
  oilTemperature: Number,
  voltage: Number,
  date: Date,
  timeLabel: String
});

const TransformerData = mongoose.model("TransformerData", transformerSchema);

/* ===============================
   SYNTHETIC DATA GENERATOR
================================ */
function generateSyntheticData(transformerId, hour) {
  const isOutage = Math.random() < 0.05; 
  const baseLoad = 80 + transformerId * 1.5;
  const variation = Math.sin((hour / 24) * Math.PI * 2) * 10;

  let current = baseLoad + variation;
  let loadPercent = (current / RATED_CURRENT) * 100; 
  let voltage = 230 + (Math.sin(hour) * 3);

  if (isOutage) {
    current = 0;
    loadPercent = 0;
    voltage = 0;
  }

  const oilTemperature = 45 + current * 0.4;
  
  // 🔴 Tying Oil Level to Load Percent
  let oilLevel;
  if (loadPercent >= 85) {
    oilLevel = 50 + (Math.random() * 15);
  } else if (loadPercent >= 75) {
    oilLevel = 66 + (Math.random() * 19);
  } else {
    oilLevel = 99 - (hour * 0.02) - (Math.random() * 4); 
  }

  return {
    current: Number(current.toFixed(2)),
    loadPercent: Number(loadPercent.toFixed(2)),
    voltage: Number(voltage.toFixed(2)),
    oilTemperature: Number(oilTemperature.toFixed(2)),
    oilLevel: Number(oilLevel.toFixed(2))
  };
}

/* ===============================
   INITIALIZE DATA 
================================ */
async function initializeDemoData() {
  for (let t = 1; t <= 25; t++) {
    for (let day = 9; day >= 0; day--) {
      const today = new Date();
      const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);

      for (let entry = 0; entry < 8; entry++) {
        const hour = entry * 3;
        const recordDate = new Date(baseDate);
        recordDate.setHours(hour, 0, 0, 0);

        const exists = await TransformerData.findOne({ transformerId: t, date: recordDate });

        if (!exists) {
          const synthetic = generateSyntheticData(t, hour);
          await TransformerData.create({
            transformerId: t,
            current: synthetic.current,
            loadPercent: synthetic.loadPercent,
            oilLevel: synthetic.oilLevel,
            oilTemperature: synthetic.oilTemperature,
            voltage: synthetic.voltage,
            date: recordDate,
            timeLabel: `${hour}:00`
          });
        }
      }
    }
  }
}

/* ===============================
   BASIC DATA API
================================ */
app.get("/api/transformer/:id", async (req, res) => {
  const transformerId = parseInt(req.params.id);
  const data = await TransformerData.find({ transformerId }).sort({ date: -1 });
  res.json(data);
});

/* ===============================
   TODAY DATA
================================ */
app.get("/api/transformer/:id/today", async (req, res) => {
  const transformerId = parseInt(req.params.id);
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const data = await TransformerData.find({
    transformerId,
    date: { $gte: today, $lt: tomorrow }
  }).sort({ date: 1 });
  res.json(data);
});

/* ===============================
   7-DAY PERFORMANCE SUMMARY
================================ */
app.get("/api/performance/:id/7day-summary", async (req, res) => {
  const transformerId = parseInt(req.params.id);
  const past7 = new Date();
  past7.setDate(past7.getDate() - 6);
  past7.setHours(0,0,0,0);

  const raw = await TransformerData.find({ transformerId, date: { $gte: past7 } });
  const grouped = {};

  raw.forEach(entry => {
    const day = entry.date.toISOString().split("T")[0];
    if (!grouped[day]) {
      grouped[day] = { load: [], temp: [], voltage: [] };
    }
    const ratedCurrent = 100; 
    const loadPercent = (entry.current / ratedCurrent) * 100;
    grouped[day].load.push(loadPercent);
    grouped[day].temp.push(entry.oilTemperature);
    grouped[day].voltage.push(entry.voltage);
  });

  const summary = Object.keys(grouped).map(day => {
    const avgLoad = grouped[day].load.reduce((a,b)=>a+b,0) / grouped[day].load.length;
    const avgTemp = grouped[day].temp.reduce((a,b)=>a+b,0) / grouped[day].temp.length;
    const avgVolt = grouped[day].voltage.reduce((a,b)=>a+b,0) / grouped[day].voltage.length;
    const voltageDeviation = Math.abs(avgVolt - 230);
    const health = 100 - (avgLoad * 0.3) - (avgTemp * 0.4) - (voltageDeviation * 0.3);

    return {
      date: day,
      avgLoad: Number(avgLoad.toFixed(2)),
      avgTemp: Number(avgTemp.toFixed(2)),
      avgVolt: Number(avgVolt.toFixed(2)),
      health: Number(health.toFixed(2)),
      overloadCount: grouped[day].load.filter(l => l > 90).length,
      riskLevel: health > 75 ? "Low" : health > 50 ? "Medium" : "High"
    };
  });

  if (summary.length < 7) {
    return res.json({ available: false, message: "7 days data not yet available" });
  }
  res.json({ available: true, data: summary });
});

/* ===============================
   24-HOUR PERFORMANCE SUMMARY
================================ */
app.get("/api/performance/:id/24h-summary", async (req, res) => {
  const transformerId = parseInt(req.params.id);
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const raw = await TransformerData.find({
    transformerId,
    date: { $gte: today, $lt: tomorrow }
  }).sort({ date: 1 });

  if (!raw.length) {
    return res.json({ available: false });
  }

  const formatted = raw.map(entry => ({
    time: entry.timeLabel,
    load: entry.loadPercent,
    temp: entry.oilTemperature,
    voltage: entry.voltage,
    oilLevel: entry.oilLevel 
  }));
  res.json({ available: true, data: formatted });
});
/* ===============================
   20 DAY LONG TERM SUMMARY
================================ */
app.get("/api/performance/:id/20day-summary", async (req, res) => {
  try {
    const transformerId = parseInt(req.params.id);
    const past20 = new Date();
    past20.setDate(past20.getDate() - 19);
    past20.setHours(0, 0, 0, 0);

    const raw = await TransformerData.find({ transformerId, date: { $gte: past20 } }).sort({ date: 1 });

    if (raw.length === 0) {
      return res.json({ available: false });
    }

    const grouped = {};
    raw.forEach(entry => {
      const day = new Date(entry.date).toISOString().split("T")[0];
      if (!grouped[day]) {
        grouped[day] = { totalLoad: 0, totalTemp: 0, count: 0 };
      }
      grouped[day].totalLoad += entry.current;
      grouped[day].totalTemp += entry.oilTemperature;
      grouped[day].count += 1;
    });

    const daily = Object.keys(grouped).map(day => {
      return {
        date: day,
        avgLoad: grouped[day].totalLoad / grouped[day].count,
        avgTemp: grouped[day].totalTemp / grouped[day].count
      };
    });

    const windowSize = 5;
    for (let i = 0; i < daily.length; i++) {
      let sum = 0, count = 0;
      for (let j = i; j > i - windowSize && j >= 0; j--) {
        sum += daily[j].avgLoad;
        count++;
      }
      daily[i].movingAverage = sum / count;
    }

    for (let i = 1; i < daily.length; i++) {
      daily[i].degradation = daily[i].movingAverage - daily[i - 1].movingAverage;
    }

    daily.forEach(day => {
      let risk = 0;
      if (day.avgTemp > 80) risk += 30; 
      if (day.avgLoad > 80) risk += 30;
      if (day.degradation > 2) risk += 40;
      day.failureRisk = Math.min(risk, 100);
      day.maintenanceRequired = day.failureRisk > 60;
    });

    res.json({
      available: true, 
      totalDays: daily.length,
      data: daily
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

/* ===============================
   AVAILABLE DAYS COUNT
================================ */
app.get("/api/performance/:id/available-days", async (req, res) => {
  const transformerId = parseInt(req.params.id);
  try {
    const raw = await TransformerData.find({ transformerId });
    const uniqueDays = [...new Set(raw.map(e => e.date.toISOString().split("T")[0]))];
    res.json({ totalDays: uniqueDays.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate available days" });
  }
});

/* ===============================
   DAILY RISK HISTORY (AVERAGE-FOCUSED)
================================ */
app.get("/api/risk/:id/history", async (req, res) => {
  try {
    const transformerId = parseInt(req.params.id);
    const rawData = await TransformerData.find({ transformerId }).sort({ date: -1 });

    if (!rawData || rawData.length === 0) return res.json({ available: false });

    const groupedData = {};
    rawData.forEach(entry => {
      const day = new Date(entry.date).toISOString().split("T")[0]; 
      if (!groupedData[day]) {
        groupedData[day] = { date: day, sumLoad: 0, sumTemp: 0, sumOilLevel: 0, totalEntries: 0, sumVoltage: 0, validVoltageCount: 0 };
      }
      groupedData[day].sumLoad += entry.loadPercent;
      groupedData[day].sumTemp += entry.oilTemperature;
      groupedData[day].sumOilLevel += entry.oilLevel;
      groupedData[day].totalEntries += 1;
      
      if (entry.voltage > 0) {
        groupedData[day].sumVoltage += entry.voltage;
        groupedData[day].validVoltageCount += 1;
      }
    });

    const dailyRisks = Object.values(groupedData).map(dayData => {
      const avgLoad = dayData.sumLoad / dayData.totalEntries;
      const avgTemp = dayData.sumTemp / dayData.totalEntries;
      const avgOilLevel = dayData.sumOilLevel / dayData.totalEntries;
      const avgVoltage = dayData.validVoltageCount > 0 ? (dayData.sumVoltage / dayData.validVoltageCount) : 0; 

      let tempRisk = "Low";
      if (avgTemp > 90) tempRisk = "High";
      else if (avgTemp >= 80) tempRisk = "Medium";

      let loadRisk = "Low";
      if (avgLoad >= 95) loadRisk = "High";
      else if (avgLoad >= 80) loadRisk = "Medium";

      let oilRisk = "Low";
      if (avgOilLevel < 70) oilRisk = "High";
      else if (avgOilLevel < 85) oilRisk = "Medium";

      let voltageRisk = "Low";
      if (avgVoltage < 207 || avgVoltage > 253) voltageRisk = "High";
      else if ((avgVoltage >= 207 && avgVoltage < 218) || (avgVoltage > 242 && avgVoltage <= 253)) voltageRisk = "Medium";

      return {
        date: dayData.date,
        averages: {
          load: Number(avgLoad.toFixed(2)),
          temp: Number(avgTemp.toFixed(2)),
          oilLevel: Number(avgOilLevel.toFixed(2)),
          voltage: Number(avgVoltage.toFixed(2))
        },
        risks: { temperature: tempRisk, load: loadRisk, oilLevel: oilRisk, voltage: voltageRisk }
      };
    });

    res.json({ available: true, data: dailyRisks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

/* ===============================
   7-DAY RISK ANALYSIS (WORST-CASE) -> UPDATED TO NEW STANDARDS
================================ */
app.get("/api/risk/:id", async (req, res) => {
  try {
    const transformerId = parseInt(req.params.id);
    const past7 = new Date();
    past7.setDate(past7.getDate() - 6);
    past7.setHours(0, 0, 0, 0);

    const rawData = await TransformerData.find({ transformerId, date: { $gte: past7 } });

    if (!rawData || rawData.length === 0) {
      return res.json({ available: false, message: "No data available for the last 7 days." });
    }

    let maxLoad = 0, maxTemp = 0, minOilLevel = 100, minVoltage = 1000, maxVoltage = 0, hasOutage = false;

    rawData.forEach(entry => {
      if (entry.loadPercent > maxLoad) maxLoad = entry.loadPercent;
      if (entry.oilTemperature > maxTemp) maxTemp = entry.oilTemperature;
      if (entry.oilLevel < minOilLevel) minOilLevel = entry.oilLevel;
      
      if (entry.voltage === 0) {
         hasOutage = true;
      } else {
         if (entry.voltage < minVoltage) minVoltage = entry.voltage;
         if (entry.voltage > maxVoltage) maxVoltage = entry.voltage;
      }
    });

    // 🔴 APPLYING INDUSTRY STANDARDS HERE TOO
    let tempRisk = "Low";
    if (maxTemp > 90) tempRisk = "High";
    else if (maxTemp >= 80) tempRisk = "Medium";

    let loadRisk = "Low";
    if (maxLoad >= 95) loadRisk = "High";
    else if (maxLoad >= 80) loadRisk = "Medium";

    let oilLevelRisk = "Low";
    if (minOilLevel < 70) oilLevelRisk = "High";
    else if (minOilLevel < 85) oilLevelRisk = "Medium";

    let voltageRisk = "Low";
    if (hasOutage) {
      voltageRisk = "Outage";
    } else if (minVoltage < 207 || maxVoltage > 253) {
      voltageRisk = "High";
    } else if ((minVoltage >= 207 && minVoltage < 218) || (maxVoltage > 242 && maxVoltage <= 253)) {
      voltageRisk = "Medium";
    }

    let overallRisk = "Low";
    if (hasOutage) overallRisk = "Outage";
    else if (tempRisk === "High" || loadRisk === "High" || oilLevelRisk === "High" || voltageRisk === "High") overallRisk = "High";
    else if (tempRisk === "Medium" || loadRisk === "Medium" || oilLevelRisk === "Medium" || voltageRisk === "Medium") overallRisk = "Medium";

    res.json({
      available: true,
      worstCases: {
        maxLoad: Number(maxLoad.toFixed(2)),
        maxTemp: Number(maxTemp.toFixed(2)),
        minOilLevel: Number(minOilLevel.toFixed(2)),
        minVoltage: hasOutage ? 0 : Number(minVoltage.toFixed(2)),
        maxVoltage: hasOutage ? 0 : Number(maxVoltage.toFixed(2)),
        hasOutage
      },
      risks: {
        temperature: tempRisk,
        load: loadRisk,
        oilLevel: oilLevelRisk,
        voltage: voltageRisk,
        overall: overallRisk
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error calculating risk" });
  }
});
/* ===============================
   ALERTS & CRITICAL EVENTS (INDUSTRY STANDARDS)
================================ */
app.get("/api/transformer/:id/alerts", async (req, res) => {
  const transformerId = parseInt(req.params.id);

  try {
    const raw = await TransformerData.find({ transformerId }).sort({ date: -1 });

    if (!raw.length) return res.json({ available: false });

    const groupedByDate = {};

    raw.forEach(entry => {
      const d = new Date(entry.date);
      const formattedDate = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
      const timeStr = entry.timeLabel || `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

      if (!groupedByDate[formattedDate]) {
        groupedByDate[formattedDate] = { entries: [], dateVal: d };
      }
      
      entry.extractedTime = timeStr; 
      groupedByDate[formattedDate].entries.push(entry);
    });

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => groupedByDate[b].dateVal - groupedByDate[a].dateVal);
    const dailyAlerts = [];

    sortedDates.forEach(dateStr => {
      const dayEntries = groupedByDate[dateStr].entries;
      const alertsForDay = [];

      let worstTemp = { val: 0, time: "" };
      let worstLoad = { val: 0, time: "" };
      let lowestOil = { val: 100, time: "" };
      let highestOil = { val: 0, time: "" };
      let lowestVolt = { val: 1000, time: "" };
      let highestVolt = { val: 0, time: "" };

      // 1. Scan the day's data for exact database peaks/troughs
      dayEntries.forEach(e => {
        if (e.voltage === 0) {
          alertsForDay.push({ type: "Power Outage", severity: "Critical", color: "#dc3545", icon: "⚡", time: e.extractedTime, message: "Zero voltage detected. Transformer de-energized or grid failure." });
        } else {
          if (e.voltage < lowestVolt.val) lowestVolt = { val: e.voltage, time: e.extractedTime };
          if (e.voltage > highestVolt.val) highestVolt = { val: e.voltage, time: e.extractedTime };
        }

        if (e.oilTemperature > worstTemp.val) worstTemp = { val: e.oilTemperature, time: e.extractedTime };
        if (e.loadPercent > worstLoad.val) worstLoad = { val: e.loadPercent, time: e.extractedTime };
        if (e.oilLevel < lowestOil.val) lowestOil = { val: e.oilLevel, time: e.extractedTime };
        if (e.oilLevel > highestOil.val) highestOil = { val: e.oilLevel, time: e.extractedTime };
      });

      // 2. Apply Strict Industry Standards based on EXACT database values

      // Temperature Standards
      if (worstTemp.val > 90) {
        alertsForDay.push({ type: "Critical Overheating", severity: "Critical", color: "#dc3545", icon: "🌡️", time: worstTemp.time, message: `Peak exactly ${worstTemp.val}°C. Core insulation degradation imminent (Limit: 90°C).` });
      } else if (worstTemp.val >= 80) {
        alertsForDay.push({ type: "High Temperature", severity: "Warning", color: "#fd7e14", icon: "🌡️", time: worstTemp.time, message: `Peak exactly ${worstTemp.val}°C. Monitor cooling fins (Limit: 80°C).` });
      }

      // Load Standards
      if (worstLoad.val >= 95) {
        alertsForDay.push({ type: "Critical Overload", severity: "Critical", color: "#dc3545", icon: "⚠️", time: worstLoad.time, message: `Load exactly ${worstLoad.val}%. Approaching maximum rated capacity (Limit: 95%).` });
      } else if (worstLoad.val >= 80) {
        alertsForDay.push({ type: "High Load Stress", severity: "Warning", color: "#fd7e14", icon: "⚠️", time: worstLoad.time, message: `Load exactly ${worstLoad.val}%. Above optimal efficiency curve (Limit: 80%).` });
      }

      // Oil Level Standards (Matches your Risk Tab exactly)
      if (lowestOil.val < 70) {
        alertsForDay.push({ type: "Low Oil Level", severity: "Critical", color: "#dc3545", icon: "🛢️", time: lowestOil.time, message: `Level dropped to exactly ${lowestOil.val}%. Risk of exposed core and internal arcing.` });
      } else if (lowestOil.val < 85) {
        alertsForDay.push({ type: "Warning: Low Oil", severity: "Warning", color: "#fd7e14", icon: "🛢️", time: lowestOil.time, message: `Level dropped to exactly ${lowestOil.val}%. Check for minor leaks.` });
      }

      // Thermal Expansion (High Oil)
      if (highestOil.val >= 95) {
        alertsForDay.push({ type: "High Oil Pressure", severity: "Warning", color: "#fd7e14", icon: "🛢️", time: highestOil.time, message: `Level spiked to exactly ${highestOil.val}%. Check breather valve for blockages.` });
      }

      // Voltage Deviation Standards (230V Grid ± 10%)
      if (lowestVolt.val < 207 && lowestVolt.val > 0) {
         alertsForDay.push({ type: "Under-Voltage", severity: "Critical", color: "#dc3545", icon: "📉", time: lowestVolt.time, message: `Voltage exactly ${lowestVolt.val}V. Fell below safe 10% tolerance (207V).` });
      }
      if (highestVolt.val > 253) {
         alertsForDay.push({ type: "Over-Voltage", severity: "Critical", color: "#dc3545", icon: "📈", time: highestVolt.time, message: `Voltage exactly ${highestVolt.val}V. Exceeded safe 10% tolerance (253V).` });
      }

      if (alertsForDay.length > 0) {
        dailyAlerts.push({ date: dateStr, alerts: alertsForDay });
      }
    });

    res.json({ available: true, data: dailyAlerts });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});
/* ===============================
   HISTORICAL 7-DAY RECOMMENDATION BLOCKS (ADVANCED + PATTERN DETECTION)
================================ */
app.get("/api/transformer/:id/7day-recommendations", async (req, res) => {
  const transformerId = parseInt(req.params.id);

  try {
    const raw = await TransformerData.find({ transformerId }).sort({ date: 1 });
    if (!raw.length) return res.json({ available: false });

    const dailyData = {};
    raw.forEach(entry => {
      const dateStr = new Date(entry.date).toISOString().split('T')[0];
      if (!dailyData[dateStr]) dailyData[dateStr] = [];
      dailyData[dateStr].push(entry);
    });

    const uniqueDays = Object.keys(dailyData).sort();
    const blocks = [];
    let currentBlockDays = [];

    for (const day of uniqueDays) {
      currentBlockDays.push({ date: day, entries: dailyData[day] });

      if (currentBlockDays.length === 7) {
        const allEntriesInBlock = currentBlockDays.flatMap(d => d.entries);

        // Core Metrics
        const maxTemp = Math.max(...allEntriesInBlock.map(e => e.oilTemperature));
        const minTemp = Math.min(...allEntriesInBlock.map(e => e.oilTemperature));
        const minOilLevel = Math.min(...allEntriesInBlock.map(e => e.oilLevel));
        const maxLoad = Math.max(...allEntriesInBlock.map(e => e.loadPercent));
        const avgLoad = (allEntriesInBlock.reduce((sum, e) => sum + e.loadPercent, 0) / allEntriesInBlock.length).toFixed(1);
        
        const firstOilLevel = allEntriesInBlock[0].oilLevel;
        const lastOilLevel = allEntriesInBlock[allEntriesInBlock.length - 1].oilLevel;

        const formatDate = (dateString) => {
          const d = new Date(dateString);
          return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
        };

        const startDateStr = formatDate(currentBlockDays[0].date);
        const endDateStr = formatDate(currentBlockDays[6].date);

        const alerts = [];

        // --- NEW: Time-Pattern & Outage Tracking Trackers ---
        let outageCount = 0;
        const timePatterns = {
          highTemp: {},
          overload: {},
          lowOil: {},
          highOil: {}
        };

        allEntriesInBlock.forEach(e => {
          const d = new Date(e.date);
          const timeStr = e.time || `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          
          if (e.voltage === 0) outageCount++;
          
          if (e.oilTemperature > 80) timePatterns.highTemp[timeStr] = (timePatterns.highTemp[timeStr] || 0) + 1;
          if (e.loadPercent > 85) timePatterns.overload[timeStr] = (timePatterns.overload[timeStr] || 0) + 1;
          if (e.oilLevel < 50) timePatterns.lowOil[timeStr] = (timePatterns.lowOil[timeStr] || 0) + 1;
          if (e.oilLevel > 95) timePatterns.highOil[timeStr] = (timePatterns.highOil[timeStr] || 0) + 1;
        });

        // Helper function to find if any specific time happened 3 or more times
        const findRecurringTime = (patternObj) => Object.keys(patternObj).find(time => patternObj[time] >= 3);

        const recurringTempTime = findRecurringTime(timePatterns.highTemp);
        const recurringLoadTime = findRecurringTime(timePatterns.overload);
        const recurringLowOilTime = findRecurringTime(timePatterns.lowOil);
        const recurringHighOilTime = findRecurringTime(timePatterns.highOil);

        // --- RULE 1: Repeated Power Outages ---
        if (outageCount >= 2) {
          alerts.push({ priority: "High", color: "#dc3545", title: "Frequent Power Outages Detected", desc: `Transformer recorded ${outageCount} zero-voltage events this week. A comprehensive grid stability audit and breaker inspection is strongly recommended.` });
        }

        // --- RULE 2: Time-Based Patterns ---
        if (recurringLoadTime) {
          alerts.push({ priority: "Medium", color: "#fd7e14", title: "Daily Overload Pattern", desc: `Electrical load consistently surges around ${recurringLoadTime} every day. Investigate facility equipment schedules at this specific time to stagger power usage.` });
        }
        if (recurringTempTime) {
          alerts.push({ priority: "High", color: "#dc3545", title: "Daily Overheating Pattern", desc: `Oil temperature spikes dangerously around ${recurringTempTime} repeatedly. Check if this correlates with heavy shift loads or direct environmental heat/sunlight.` });
        }
        if (recurringHighOilTime) {
          alerts.push({ priority: "Medium", color: "#fd7e14", title: "Recurring High Oil Pressure", desc: `Oil expands to unsafe levels consistently around ${recurringHighOilTime}. This usually correlates with recurring load spikes. Monitor breather valves.` });
        }

        // --- RULE 3: Abnormal Heating (High Temp + Low Load) ---
        if (maxTemp > 75 && avgLoad < 55 && !recurringTempTime) {
          alerts.push({ priority: "High", color: "#dc3545", title: "Abnormal Heating Detected", desc: `Transformer reached ${maxTemp}°C despite a low weekly average load of ${avgLoad}%. This indicates an internal core fault or failed cooling pumps.` });
        }

        // --- RULE 4: Sustained Heavy Load ---
        if (avgLoad > 80) {
          alerts.push({ priority: "Medium", color: "#fd7e14", title: "Sustained Heavy Load", desc: `The weekly average load was consistently high (${avgLoad}%). Prolonged operation at this level rapidly accelerates insulation aging.` });
        } 

        // --- RULE 5: Active Slow Leak Detection ---
        if ((firstOilLevel - lastOilLevel) > 5) {
          alerts.push({ priority: "High", color: "#dc3545", title: "Active Oil Loss Trend", desc: `Oil level steadily dropped by ${(firstOilLevel - lastOilLevel).toFixed(1)}% over the course of the week. Investigate for slow physical leaks around seals or valves.` });
        }

        // --- RULE 6: Perfect Week ---
        if (alerts.length === 0) {
          alerts.push({ priority: "Low", color: "#28a745", title: "System Stable", desc: `All parameters remained within perfectly safe limits for this 7-day period. Average load was ${avgLoad}%.` });
        }

        blocks.push({
          dateRange: `${startDateStr} to ${endDateStr}`,
          alerts: alerts
        });

        currentBlockDays = [];
      }
    }

    blocks.reverse();
    res.json({ available: true, data: blocks });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});
/* ===============================
   AI ASSISTANT CHAT ROUTE
================================ */
app.post("/api/transformer/:id/chat", async (req, res) => {
  try {
    const transformerId = parseInt(req.params.id);
    const userMessage = req.body.message; // What the user typed in the chat

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Get the latest data for context (Last 24 hours)
    const past24h = new Date();
    past24h.setHours(past24h.getHours() - 24);
    
    const recentData = await TransformerData.find({ 
      transformerId, 
      date: { $gte: past24h } 
    }).sort({ date: -1 }).limit(10); // Grab the 10 most recent readings

    if (!recentData.length) {
      return res.json({ response: "I don't have any recent data for this transformer to analyze." });
    }

    // 2. Format the data so the AI can read it easily
    const latest = recentData[0];
    const dataContext = `
      CURRENT STATUS:
      - Load: ${latest.loadPercent}%
      - Oil Temp: ${latest.oilTemperature}°C
      - Oil Level: ${latest.oilLevel}%
      - Voltage: ${latest.voltage}V
      
      RECENT TREND (Last few readings):
      ${recentData.map(d => `Time: ${d.timeLabel} | Temp: ${d.oilTemperature}°C | Load: ${d.loadPercent}% | Oil: ${d.oilLevel}%`).join('\n')}
    `;

    // 3. The "System Prompt" - Tell the AI how to behave and give it the data
    const systemPrompt = `
      You are an expert electrical engineer and SCADA system AI assistant. 
      You are monitoring Transformer #${transformerId}. 
      Keep your answers concise, professional, and directly related to the data provided. 
      Do not use excessive formatting.
      
      Here is the live data for this transformer:
      ${dataContext}
      
      The user is asking: "${userMessage}"
    `;

    // 4. Send to Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const aiResponse = result.response.text();

    // 5. Send the smart answer back to the frontend
    res.json({ response: aiResponse });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Failed to communicate with AI.", details: err.message });
  }
});
// GET LIGHTGBM RISK PREDICTION
app.get('/api/transformer/:id/predict', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Get the latest sensor reading from MongoDB
    const recentData = await TransformerData.find({ transformerId: id })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!recentData || recentData.length === 0) {
      return res.status(404).json({ error: "No data available." });
    }

    const latest = recentData[0];

    // 2. Ask Python/LightGBM for the risk percentage
    const pythonProcess = spawn('python', ['predict.py', latest.loadPercent, latest.oilTemperature]);

    pythonProcess.stdout.on('data', (data) => {
      const riskPercent = parseFloat(data.toString().trim());
      res.json({ success: true, riskPercent: riskPercent });
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
      res.status(500).json({ error: "Model failed." });
    });

  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
});
/* ===============================
   SERVER START
================================ */
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});