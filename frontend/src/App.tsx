import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HistoryWorkspace from './pages/HistoryWorkspace';
import AnalysisDetail from './pages/AnalysisDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<HistoryWorkspace />} />
        <Route path="/analysis/:id" element={<AnalysisDetail />} />
      </Routes>
    </Router>
  );
}
