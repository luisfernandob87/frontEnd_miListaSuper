import { useNavigate } from 'react-router-dom';
import Publicidad from './Publicidad';

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <Publicidad/>
      <div className="home-container">
        <h1>Bienvenido</h1>
        <div className="home-buttons">
          <button onClick={() => navigate('/compare')}>Comparar Precios</button>
          <button onClick={() => navigate('/stores')}>Lista de Compras</button>
        </div>
      </div>
    </>
  );
};

export default Home;