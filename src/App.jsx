import { useState } from 'react'
import BarcodeScanner from 'react-qr-barcode-scanner';
import './App.css'

function App() {
  const [data, setData] = useState('Not Found');
  const [isScannerActive, setIsScannerActive] = useState(false);

  const toggleScanner = () => {
    setIsScannerActive(prevState => !prevState);
    // Reset data when scanner is toggled off
    if (isScannerActive) {
      setData('Not Found');
    }
  };

  return (
    <>
      <h1>Escáner de Código de Barras</h1>
      <button onClick={toggleScanner}>
        {isScannerActive ? 'Desactivar Escáner' : 'Activar Escáner'}
      </button>
      {isScannerActive && (
        <div className="scanner-container">
          <BarcodeScanner
            formats={['ean_13', 'ean_8', 'upc_a', 'upc_e']}
            width={500}
            height={500}
            videoConstraints={{
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: 'environment'
            }}
            onUpdate={(err, result) => {
              if (err) {
                console.error(err);
                setData(`Error: ${err.message || 'Unknown error'}`);
              } else if (result) {
                setData(result.text);
              } else {
                setData('Not Found');
              }
            }}
          />
        </div>
      )}
      <p>{data}</p>
      <div>
        <label htmlFor="manual-barcode">Entrada Manual:</label>
        <input
          type="text"
          id="manual-barcode"
          onChange={(e) => setData(e.target.value)}
          value={data === 'Not Found' ? '' : data}
        />
      </div>
    </>
  )
}

export default App
