import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import AddPage from './pages/AddPage';
import LocationManagement from './pages/LocationManagement';
import BatchAddPage from './pages/BatchAddPage';
import ModelManagement from './pages/ModelManagement';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/add" element={<AddPage />} />
        <Route path="/location" element={<LocationManagement />} />
        <Route path="/batch-add" element={<BatchAddPage />} />
        <Route path="/model-management" element={<ModelManagement />} />
      </Routes>
    </Router>
  );
}

export default App;