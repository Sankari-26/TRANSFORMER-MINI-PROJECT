import React, { useState, useEffect } from "react";

const AlertTab = ({ transformerId }) => {
  const [alertDays, setAlertDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/transformer/${transformerId}/alerts`);
        const result = await res.json();
        
        if (result.available) {
          setAlertDays(result.data); // Data is now grouped by day!
        }
      } catch (err) {
        console.error("Error fetching alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (transformerId) fetchAlerts();
  }, [transformerId]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Scanning system logs for anomalies...</div>;
  
  if (!alertDays.length) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#28a745", fontSize: "18px", fontWeight: "bold" }}>
      ✅ No critical alerts or power outages found in the system log.
    </div>
  );

  // Calculate total individual alerts across all days for the top counter
  const totalAlerts = alertDays.reduce((sum, day) => sum + day.alerts.length, 0);

  return (
    <div style={{ marginTop: "20px", paddingBottom: "40px" }}>
      
      {/* Top Summary Header */}
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, borderBottom: "2px solid #333", paddingBottom: "5px", display: "inline-block" }}>
          System Alarm Log
        </h3>
        <span style={{ backgroundColor: "#dc3545", color: "#fff", padding: "6px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>
          {totalAlerts} Total Events
        </span>
      </div>

      {/* Map through the Days */}
      {alertDays.map((dayGroup, index) => (
        <div key={index} style={{ marginBottom: "30px" }}>
          
          {/* Date Header Badge */}
          <div style={{
            backgroundColor: "#343a40",
            color: "#fff",
            padding: "8px 20px",
            borderRadius: "6px 6px 0 0",
            fontSize: "15px",
            fontWeight: "bold",
            display: "inline-block",
            marginBottom: "-1px", 
            position: "relative",
            zIndex: 1
          }}>
            📅 {dayGroup.date}
          </div>

          {/* Alert Container Box for that specific day */}
          <div style={{
            border: "1px solid #ccc",
            borderRadius: "0 8px 8px 8px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}>
            
            {/* Map through the specific alerts for this day */}
            {dayGroup.alerts.map((alert, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  backgroundColor: "#fff",
                  border: `1px solid ${alert.color}`,
                  borderRadius: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden"
                }}
              >
                {/* Left Color Bar with Icon */}
                <div style={{
                  backgroundColor: alert.color,
                  color: "#fff",
                  padding: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  minWidth: "60px"
                }}>
                  {alert.icon}
                </div>

                {/* Main Content */}
                <div style={{ padding: "15px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ color: "#333", fontSize: "16px" }}>{alert.type}</strong>
                    
                    {/* Time Badge */}
                    <span style={{ 
                      fontSize: "13px", 
                      color: "#444", 
                      fontWeight: "bold", 
                      backgroundColor: "#eee",
                      padding: "2px 8px",
                      borderRadius: "4px"
                    }}>
                      @ {alert.time}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "#555", fontSize: "15px" }}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertTab;