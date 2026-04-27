import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import EstimatePage from './pages/EstimatePage';
import EstimateHistoryPage from './pages/EstimateHistoryPage';
import MaterialsPage from './pages/MaterialsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/estimate" replace />} />
            <Route path="/estimate" element={<EstimatePage />} />
            <Route path="/estimates" element={<EstimateHistoryPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
