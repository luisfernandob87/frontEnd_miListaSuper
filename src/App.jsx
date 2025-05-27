
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './components/Home';
import StoreSelect from './components/StoreSelect';
import ComparePage from './components/ComparePage';
import ScanPage from './components/ScanPage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stores" element={<StoreSelect />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/scan" element={<ScanPage />} />
      </Routes>
    </Router>
  );
}

export default App
