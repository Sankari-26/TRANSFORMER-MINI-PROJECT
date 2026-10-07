import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area
} from "recharts";

function PerformanceDashboard() {

  const { id } = useParams();
  const [summary, setSummary] = useState([]);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/performance/${id}/7day-summary`)
      .then(res => res.json())
      .then(data => {
        if (data.available) {
          setSummary(data.data);
          setAvailable(true);
        } else {
          setAvailable(false);
        }
      });
  }, [id]);

  if (!available) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Performance Dashboard</h2>
        <p>7 days data not yet available.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", background: "#f5f5f5" }}>

      <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
        Transformer {id} - Short Term Monitoring (Last 7 Days)
      </h2>

      {/* 1️⃣ Load Trend */}
      <div style={{ marginBottom: "50px" }}>
        <h3>Load vs Time (7-Day Trend)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 120]} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={80} stroke="red" label="80% Warning" />
            <Line type="monotone" dataKey="avgLoad" stroke="#8884d8" name="Load %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2️⃣ Temperature Trend */}
      <div style={{ marginBottom: "50px" }}>
        <h3>Oil Temperature vs Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <ReferenceLine y={70} stroke="red" label="70°C Warning" />
            <Line type="monotone" dataKey="avgTemp" stroke="#ff7300" name="Temperature °C" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3️⃣ Voltage Stability */}
      <div style={{ marginBottom: "50px" }}>
        <h3>Voltage Stability Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[210, 250]} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={220} stroke="red" label="Lower Limit" />
            <ReferenceLine y={240} stroke="red" label="Upper Limit" />
            <Area type="monotone" dataKey="avgVolt" stroke="#82ca9d" fill="#82ca9d" name="Voltage" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4️⃣ Load vs Temperature Correlation */}
      <div style={{ marginBottom: "50px" }}>
        <h3>Load vs Temperature Correlation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="avgLoad" stroke="#8884d8" name="Load %" />
            <Line yAxisId="right" type="monotone" dataKey="avgTemp" stroke="#ff7300" name="Temp °C" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 5️⃣ Health Score Trend */}
      <div>
        <h3>Daily Health Score Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="health" stroke="#000" name="Health %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default PerformanceDashboard;