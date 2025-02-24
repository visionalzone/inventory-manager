import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import AddPage from './pages/AddPage';
import LocationManagement from './pages/LocationManagement';
import BatchAddPage from './pages/BatchAddPage';
import ModelManagement from './pages/ModelManagement';
import Navigation from './components/Navigation';
import WarehouseInit from './pages/WarehouseInit';
import ModelMatchPage from './pages/ModelMatchPage';

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/records" element={<ScanPage />} />
        <Route path="/location" element={<LocationManagement />} />
        <Route path="/add-record" element={<AddPage />} />
        <Route path="/batch-add" element={<BatchAddPage />} />
        <Route path="/model-management" element={<ModelManagement />} />
        <Route path="/warehouse-init" element={<WarehouseInit />} />
        <Route path="/model-match" element={<ModelMatchPage />} />
      </Routes>
    </Router>
  );
}

export default App;