import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScanPage from './pages/ScanPage';
import AddPage from './pages/AddPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScanPage />} />
        <Route path="/add" element={<AddPage />} />
      </Routes>
    </Router>
  );
}

export default App;