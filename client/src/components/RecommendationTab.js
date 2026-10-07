import React, { useState, useEffect } from "react";

const RecommendationTab = ({ transformerId }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/transformer/${transformerId}/7day-recommendations`);
        const result = await res.json();
        
        if (result.available) {
          setBlocks(result.data);
        }
      } catch (err) {
        console.error("Error fetching 7-day recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    if (transformerId) fetchRecommendations();
  }, [transformerId]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666", fontSize: "18px" }}>Analyzing Historical 7-Day Blocks...</div>;
  
  if (!blocks.length) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#dc3545", fontSize: "18px", fontWeight: "bold" }}>
      Not enough data yet. Waiting to complete the first full 7-day period...
    </div>
  );

  return (
    <div style={{ marginTop: "20px", paddingBottom: "40px" }}>
      {blocks.map((block, index) => (
        <div key={index} style={{ marginBottom: "40px" }}>
          
          {/* Top Date Header Badge */}
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
            📅 {block.dateRange}
          </div>

          {/* Wrapper Box for the week's recommendations */}
          <div style={{
            border: "1px solid #ccc",
            borderRadius: "0 8px 8px 8px",
            padding: "20px",
            backgroundColor: "#f4f6f8",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}>
            {block.alerts.map((rec, i) => (
              <div
                key={i}
                style={{
                  borderLeft: `6px solid ${rec.color}`,
                  backgroundColor: "#fff",
                  padding: "16px",
                  borderRadius: "4px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <h4 style={{ margin: 0, color: "#222", fontSize: "17px" }}>{rec.title}</h4>
                  <span
                    style={{
                      backgroundColor: rec.color,
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}
                  >
                    {rec.priority} Priority
                  </span>
                </div>
                <p style={{ margin: 0, color: "#555", fontSize: "15px", lineHeight: "1.5" }}>
                  {rec.desc}
                </p>
              </div>
            ))}
          </div>
          
        </div>
      ))}
    </div>
  );
};

export default RecommendationTab;