
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './components/Home';
import StoreSelect from './components/StoreSelect';
import ComparePage from './components/ComparePage';
import Compras from './components/Compras';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stores" element={<StoreSelect />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/Compras" element={<Compras />} />
      </Routes>
    </Router>
  );
}

export default App
