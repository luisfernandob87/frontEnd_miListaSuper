import { useNavigate } from 'react-router-dom';
import Publicidad from './Publicidad';

const StoreSelect = () => {
  const navigate = useNavigate();
  const stores = ["Paiz", "Walmart", "Maxidespensa", "La Torre"];
  return (
    <>
      <Publicidad/>
      <div className="store-select-container">
        <h2>Selecciona una tienda</h2>
        <div className="store-buttons">
          {stores.map(store => (
            <button key={store} onClick={() => navigate('/Compras', { state: { store } })}>{store}</button>
          ))}
        </div>
      </div>
    </>
  );
};

export default StoreSelect;