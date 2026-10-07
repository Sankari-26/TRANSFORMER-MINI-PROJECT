import { Routes, Route } from "react-router-dom";
import TransformerList from "./components/TransformerList";
import TransformerDashboard from "./components/TransformerDashboard";
import PerformanceDashboard from "./components/PerformanceDashboard";
function App() {
  return (
    <Routes>
      <Route path="/" element={<TransformerList />} />
      <Route path="/transformer/:id" element={<TransformerDashboard />} />
    </Routes>
  );
}
<Route path="/transformer/:id/performance" element={<PerformanceDashboard />} />
export default App;