import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DailyAnalysis = ({ transformerId }) => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch24hData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/performance/${transformerId}/24h-summary`);
        const result = await response.json();
        
        if (result.available) {
          setDailyData(result.data);
        }
      } catch (err) {
        console.error("Error fetching 24h data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (transformerId) fetch24hData();
  }, [transformerId]);

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Loading 24-Hour Cycle Data...</div>;
  if (!dailyData.length) return <div style={{ padding: "20px", textAlign: "center", color: "red" }}>No data available for today yet.</div>;

  return (
    <div style={{ marginTop: "10px" }}>
      
      {/* GRAPH 1: Oil Level vs. Oil Temperature */}
      <h3 style={{ marginTop: "20px" }}>Oil Level vs Oil Temp</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={dailyData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{fontSize: 12}} />
          
          {/* Left Axis for Oil Level (%) */}
          <YAxis yAxisId="left" domain={[0, 100]} tick={{fontSize: 12}} label={{ value: 'Oil Level %', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle'} }} />
          {/* Right Axis for Temperature (°C) */}
          <YAxis yAxisId="right" orientation="right" domain={[0, 120]} tick={{fontSize: 12}} label={{ value: 'Temp °C', angle: 90, position: 'insideRight', style: {textAnchor: 'middle'} }} />
          
          <Tooltip />
          <Legend />
          
          <Bar yAxisId="left" dataKey="oilLevel" fill="#4ade80" name="Oil Level (%)" barSize={30} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#ef4444" name="Oil Temp (°C)" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* GRAPH 2: Oil Level vs. Load Percent */}
      <h3 style={{ marginTop: "40px" }}>Oil Level vs Load Stress</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={dailyData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{fontSize: 12}} />
          
          <YAxis yAxisId="left" domain={[0, 100]} tick={{fontSize: 12}} label={{ value: 'Oil Level %', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle'} }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 150]} tick={{fontSize: 12}} label={{ value: 'Load %', angle: 90, position: 'insideRight', style: {textAnchor: 'middle'} }} />
          
          <Tooltip />
          <Legend />
          
          <Bar yAxisId="left" dataKey="oilLevel" fill="#60a5fa" name="Oil Level (%)" barSize={30} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="step" dataKey="load" stroke="#8b5cf6" name="Load Stress (%)" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>

    </div>
  );
};

export default DailyAnalysis;