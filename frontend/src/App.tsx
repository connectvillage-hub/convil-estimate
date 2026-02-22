import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import EstimatePage from './pages/EstimatePage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/estimate" replace />} />
            <Route path="/estimate" element={<EstimatePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
