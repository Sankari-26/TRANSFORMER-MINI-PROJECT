import React, { useState, useEffect } from 'react';

const RiskTab = ({ transformerId }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 NEW: State for LightGBM AI Prediction
  const [riskPrediction, setRiskPrediction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Historical Data (Your existing code)
        const historyResponse = await fetch(`http://localhost:5000/api/risk/${transformerId}/history`);
        const historyResult = await historyResponse.json();
        if (historyResult.available) {
          setHistoryData(historyResult.data);
        }

        // 🔥 2. NEW: Fetch LightGBM Prediction
        const predictResponse = await fetch(`http://localhost:5000/api/transformer/${transformerId}/predict`);
        const predictResult = await predictResponse.json();
        if (predictResult.success) {
          setRiskPrediction(predictResult.riskPercent);
        }

      } catch (err) {
        console.error("Error fetching risk data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (transformerId) fetchData();
  }, [transformerId]);

  // Color mapper for Low (Green), Medium (Yellow), High (Red) using Tailwind
  const getRiskColors = (risk) => {
    switch (risk) {
      case 'Low': 
        return 'bg-[#e8f5e9] text-[#1b5e20] border-[#4caf50] shadow-sm'; // Crisp Green
      case 'Medium': 
        return 'bg-[#fff8e1] text-[#f57f17] border-[#ffb300] shadow-sm'; // Crisp Yellow/Amber
      case 'High': 
        return 'bg-[#ffebee] text-[#b71c1c] border-[#f44336] shadow-sm'; // Crisp Red
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) return <div className="text-center p-6 text-lg font-semibold text-gray-600">Loading risk analysis...</div>;
  if (!historyData.length && riskPrediction === null) return <div className="text-center p-6 text-lg font-semibold text-gray-600">No data found.</div>;

  return (
    <div className="space-y-8">
      
      {/* ========================================================= */}
      {/* 🔥 NEW: LIGHTGBM AI PREDICTION BANNER */}
      {/* ========================================================= */}
      <div className={`p-8 rounded-xl shadow-lg border-2 ${
        riskPrediction > 75 
          ? 'bg-[#ffebee] border-[#f44336] text-[#b71c1c]' 
          : 'bg-[#e8f5e9] border-[#4caf50] text-[#1b5e20]'
      }`}>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          ⚡ Real-Time AI Failure Probability (LightGBM)
        </h2>
        
        {riskPrediction !== null ? (
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-7xl font-black mb-4 md:mb-0 tracking-tight">
              {riskPrediction}%
            </div>
            <div className="text-lg font-medium md:max-w-lg md:text-right opacity-90">
              {riskPrediction > 75 
                ? "CRITICAL WARNING: The model predicts an imminent risk of failure based on the latest real-time load and temperature metrics." 
                : "System status is healthy. The predictive model detects low risk of failure based on current live metrics."}
            </div>
          </div>
        ) : (
          <div className="text-lg font-medium animate-pulse">Running AI Model...</div>
        )}
      </div>


      {/* ========================================================= */}
      {/* HISTORICAL DAILY AVERAGES (Your existing code below) */}
      {/* ========================================================= */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 pb-2">Historical Risk Averages</h2>
        
        <div className="space-y-8">
          {historyData.map((dayData, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              
              {/* CLEAN DATE HEADER */}
              <div className="mb-6 border-b pb-3">
                <h3 className="text-xl font-bold text-gray-800">Date : {dayData.date}</h3>
                <p className="text-sm text-gray-500 mt-1">Daily Average Parameters</p>
              </div>

              {/* PARAMETER BOXES */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* VOLTAGE AVERAGE */}
                <div className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center ${getRiskColors(dayData.risks.voltage)}`}>
                  <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Avg Voltage</div>
                  <div className="text-3xl font-black mb-1">{dayData.averages.voltage} V</div>
                  <div className="text-sm font-bold opacity-80">{dayData.risks.voltage} RISK</div>
                </div>

                {/* LOAD AVERAGE */}
                <div className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center ${getRiskColors(dayData.risks.load)}`}>
                  <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Avg Load</div>
                  <div className="text-3xl font-black mb-1">{dayData.averages.load}%</div>
                  <div className="text-sm font-bold opacity-80">{dayData.risks.load} RISK</div>
                </div>

                {/* TEMP AVERAGE */}
                <div className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center ${getRiskColors(dayData.risks.temperature)}`}>
                  <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Avg Temp</div>
                  <div className="text-3xl font-black mb-1">{dayData.averages.temp}°C</div>
                  <div className="text-sm font-bold opacity-80">{dayData.risks.temperature} RISK</div>
                </div>

                {/* OIL LEVEL AVERAGE */}
                <div className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center ${getRiskColors(dayData.risks.oilLevel)}`}>
                  <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Avg Oil Level</div>
                  <div className="text-3xl font-black mb-1">{dayData.averages.oilLevel}%</div>
                  <div className="text-sm font-bold opacity-80">{dayData.risks.oilLevel} RISK</div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskTab;