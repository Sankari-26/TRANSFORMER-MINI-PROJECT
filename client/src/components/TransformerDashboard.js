import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import RiskTab from "./RiskTab";
import DailyAnalysis from './DailyAnalysis';
import RecommendationTab from "./RecommendationTab";
import AlertTab from "./AlertTab";
import AIAssistant from './AIAssistant';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from "recharts";

const todayDate = new Date().toLocaleDateString("en-GB");
function TransformerDashboard() {
  const { id } = useParams();

  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("data");
  const [performanceData, setPerformanceData] = useState([]);
  const [shortTermData, setShortTermData] = useState([]);
  const [longTermData, setLongTermData] = useState([]);
  const [longTermAvailable, setLongTermAvailable] = useState(false);

  /* ===============================
     FETCH DATA
  ================================ */
  useEffect(() => {
    // Today Data
    fetch(`http://localhost:5000/api/transformer/${id}/today`)
      .then(res => res.json())
      .then(result => setData(result))
      .catch(err => console.log(err));
      

    if (activeTab === "performance") {
      // 24 Hour Summary
      fetch(`http://localhost:5000/api/performance/${id}/24h-summary`)
        .then(res => res.json())
        .then(response => {
          if (response.available && Array.isArray(response.data)) {
            setShortTermData(response.data);
          } else {
            setShortTermData([]);
          }
        })
        .catch(err => console.log(err));

      // 7 Day Summary
      fetch(`http://localhost:5000/api/performance/${id}/7day-summary`)
        .then(res => res.json())
        .then(response => {
          if (response.available && Array.isArray(response.data)) {
            setPerformanceData(response.data);
          } else {
            setPerformanceData([]);
          }
        })
        .catch(err => console.log(err));

      // 20 Day Summary (Long Term)
      fetch(`http://localhost:5000/api/performance/${id}/20day-summary`)
        .then(res => res.json())
        .then(response => {
          if (response.available && Array.isArray(response.data)) {
            setLongTermData(response.data);
            setLongTermAvailable(true);
          } else {
            setLongTermData([]);
            setLongTermAvailable(false);
          }
        })
        .catch(err => console.log(err));
        
    }
    
  }, [id, activeTab]);

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        padding: "40px",
        boxSizing: "border-box",
        backgroundColor: "#f5f5f5"
      }}
    >
      <h2 style={{ marginBottom: "30px", textAlign: "center", color: "#333" }}>
        Transformer - {id}
      </h2>

      {/* ---------- TABS ---------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          marginBottom: "40px",
          borderBottom: "2px solid #ddd",
          paddingBottom: "10px"
        }}
      >
        {["data", "performance", "risk", "recommendation", "alerts", "ai"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              padding: "8px 12px",
              borderBottom: activeTab === tab ? "3px solid #007bff" : "none",
              fontWeight: activeTab === tab ? "bold" : "normal",
              color: activeTab === tab ? "#007bff" : "#555"
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ---------- DATA TAB ---------- */}
      {activeTab === "data" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* CENTERED DATE BANNER (Aligned with Sketch) */}
          <div
            style={{
              border: "1px solid #aaa", 
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "40px",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#333",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            Date : {todayDate}
          </div>

          {/* DATA CARDS GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "30px"
            }}
          >
            {data.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #aaa",
                  borderRadius: "12px",
                  padding: "20px 30px", // Increased side padding for better alignment
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.05)"
                }}
              >
                {/* TIME HEADER */}
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#222"
                  }}
                >
                  Time : {new Date(item.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>

                {/* ALIGNED PARAMETERS */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px", color: "#444" }}>
                  <span>Current :</span>
                  <span style={{ fontWeight: "600", color: "#000" }}>{item.current} A</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px", color: "#444" }}>
                  <span>Oil Level :</span>
                  <span style={{ fontWeight: "600", color: "#000" }}>{item.oilLevel} %</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px", color: "#444" }}>
                  <span>Oil Temp :</span>
                  <span style={{ fontWeight: "600", color: "#000" }}>{item.oilTemperature} °C</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", color: "#444" }}>
                  <span>Voltage :</span>
                  <span style={{ fontWeight: "600", color: "#000" }}>{item.voltage} V</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- PERFORMANCE TAB ---------- */}
      {activeTab === "performance" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
          {/* 🔵 SHORT TERM */}
          {shortTermData.length > 0 && (
            <>
              <h2>🔵 Short Term (24 Hours Analysis)</h2>
              <DailyAnalysis transformerId={id} />
              <h3 style={{ marginTop: "20px" }}>Load Trend (Line Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={shortTermData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="load" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>

              <h3 style={{ marginTop: "30px" }}>Load Distribution (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={shortTermData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="load" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>

              <h3 style={{ marginTop: "30px" }}>Load vs Temperature (Scatter Plot)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="load" />
                  <YAxis type="number" dataKey="temp" />
                  <Tooltip />
                  <Scatter data={shortTermData} fill="#ff5733" />
                </ScatterChart>
              </ResponsiveContainer>
            </>
          )}

          {/* 🟡 MEDIUM TERM */}
          {performanceData.length > 0 && (
            <>
              <h2 style={{ marginTop: "50px" }}>
                🟡 Medium Term (7 Days Behavior Pattern)
              </h2>

              <h3 style={{ marginTop: "20px" }}>Health & Load Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgLoad" stroke="#007bff" />
                  <Line type="monotone" dataKey="health" stroke="#ff0000" />
                </LineChart>
              </ResponsiveContainer>

              <h3 style={{ marginTop: "30px" }}>Temperature Stability (Area Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="avgTemp"
                    stroke="#ff7300"
                    fill="#ffe0b2"
                  />
                </AreaChart>
              </ResponsiveContainer>

              <h3 style={{ marginTop: "30px" }}>Overload Frequency</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="overloadCount" fill="#dc3545" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {/* 🔴 LONG TERM */}
          {longTermAvailable && longTermData.length > 0 && (
            <>
              <h2 style={{ marginTop: "60px" }}>
                🔴 Long Term (20 Days Strategic Analysis)
              </h2>

              <h3 style={{ marginTop: "20px" }}>Load Moving Average Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={longTermData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="movingAverage" stroke="#6f42c1" />
                </LineChart>
              </ResponsiveContainer>

              <h3 style={{ marginTop: "30px" }}>Degradation Slope Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={longTermData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="degradation" fill="#fd7e14" />
                </BarChart>
              </ResponsiveContainer>

              <h3 style={{ marginTop: "30px" }}>Failure Risk Projection</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={longTermData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="failureRisk"
                    stroke="#dc3545"
                    fill="#f8d7da"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

        </div>
      )}
      
      {/* ---------- RISK TAB ---------- */}
      {activeTab === "risk" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
           <RiskTab transformerId={id} />
        </div>
      )}
      {/* ---------- RECOMMENDATION TAB ---------- */}
      {activeTab === "recommendation" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
           <RecommendationTab transformerId={id} />
        </div>
      )}
      {/* ---------- ALERTS TAB ---------- */}
      {activeTab === "alerts" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
           <AlertTab transformerId={id} />
        </div>
      )}
      {/* ---------- AI ASSISTANT TAB (Persists in background) ---------- */}
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto", 
        display: activeTab === "ai" ? "block" : "none" 
      }}>
         <AIAssistant key={id} transformerId={id} />
      </div>
    </div>
  );
}
export default TransformerDashboard;