import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import EstimatePage from './pages/EstimatePage';
import EstimateHistoryPage from './pages/EstimateHistoryPage';
import MaterialsPage from './pages/MaterialsPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 모바일 상단 바 (md 미만에서만 표시) */}
          <div className="md:hidden bg-[#1a3352] text-white flex items-center justify-between px-4 py-3 shadow-md flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#2E75B6] rounded-md flex items-center justify-center font-bold text-sm">
                C
              </div>
              <span className="font-bold text-sm">컨빌 디자인</span>
            </div>
            <span className="w-6"></span>
          </div>
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/estimate" replace />} />
              <Route path="/estimate" element={<EstimatePage clientType="customer" />} />
              <Route path="/contractor-estimate" element={<EstimatePage clientType="contractor" />} />
              <Route path="/estimates" element={<EstimateHistoryPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
