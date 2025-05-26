
import { useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Quagga from 'quagga';
import './App.css'

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <h1>Bienvenido</h1>
      <div className="home-buttons">
        <button onClick={() => navigate('/compare')}>Comparar Precios</button>
        <button onClick={() => navigate('/stores')}>Lista de Compras</button>
      </div>
    </div>
  );
};

const StoreSelect = () => {
  const navigate = useNavigate();
  const stores = ["Paiz", "Walmart", "Maxidespensa", "La Torre"];
  return (
    <div className="store-select-container">
      <h2>Selecciona una tienda</h2>
      <div className="store-buttons">
        {stores.map(store => (
          <button key={store} onClick={() => navigate('/scan', { state: { store } })}>{store}</button>
        ))}
      </div>
    </div>
  );
};

const ConfirmationModal = ({ code, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>¿Es este el código correcto?</h3>
      <p className="scanned-code">{code}</p>
      <div className="modal-buttons">
        <button onClick={onConfirm}>Sí, es correcto</button>
        <button onClick={onCancel}>No, volver a escanear</button>
      </div>
    </div>
  </div>
);

function ScanPage() {
  const [scannedCodes, setScannedCodes] = useState([]);
  const [currentScan, setCurrentScan] = useState('Not Found');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempScannedCode, setTempScannedCode] = useState('');
  const scannerRef = useRef(null); // For Quagga's target DOM element

  const initQuagga = () => {
    if (scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { ideal: 1280 }, // Higher resolution might help
            height: { ideal: 720 },
            facingMode: "environment"
          },
        },
        decoder: {
          readers: [
            "ean_reader" // Restrict to EAN for EAN-13
          ],
          debug: {
            drawBoundingBox: true,
            showFrequency: true,
            drawScanline: true,
            showPattern: true
          },
          multiple: false // Process only one barcode at a time for simplicity
        },
        locate: true, // Try to locate the barcode in the image
        locator: {
          patchSize: "medium", // "x-small", "small", "medium", "large", "x-large"
          halfSample: true // Speeds up locating
        },
        frequency: 10, // How often to attempt to decode a new frame (frames per second)
        numOfWorkers: navigator.hardwareConcurrency || 4, // Use available cores
      }, function (err) {
        if (err) {
          console.error("Error initializing Quagga:", err);
          setCurrentScan(`Error: ${err.message || 'Quagga init failed'}`);
          return;
        }
        console.log("Quagga initialization finished. Ready to start.");
        Quagga.start();
        setIsScannerActive(true);
      });

      Quagga.onDetected(_onDetected);
      Quagga.onProcessed(result => {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                // Optionally draw the decoded code on the canvas
                // Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
        }
      });
    }
  };

  const _onDetected = (result) => {
    const code = result.codeResult.code;
    const format = result.codeResult.format;
    // Validate for EAN-13 (13 digits and correct format)
    if (code && code.length === 13 && /^[0-9]+$/.test(code) && format === 'ean_13') {
      setTempScannedCode(code);
      setShowModal(true);
      Quagga.stop();
      setIsScannerActive(false);
    } else {
      // Optionally provide feedback if a non-EAN-13 code is detected but ignored
      console.log("Ignored code (not EAN-13 or invalid format/type):", code, "Format:", format);
    }
  };

  const handleConfirm = () => {
    setCurrentScan(tempScannedCode);
    if (!scannedCodes.includes(tempScannedCode)) {
      setScannedCodes(prevCodes => [...prevCodes, tempScannedCode]);
    }
    setShowModal(false);
    initQuagga(); // Restart scanner
  };

  const handleCancel = () => {
    setShowModal(false);
    initQuagga(); // Restart scanner
  };

  const toggleScanner = () => {
    if (isScannerActive) {
      Quagga.stop();
      setIsScannerActive(false);
      setCurrentScan('Not Found');
      if (scannerRef.current) {
        // Clear the canvas
        const canvas = scannerRef.current.querySelector('canvas');
        if (canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        // Remove video element if Quagga added one
        const video = scannerRef.current.querySelector('video');
        if(video) video.remove();
      }
    } else {
      initQuagga();
    }
  };

  return (
    <>
      <h1>Escáner de Código de Barras</h1>
      <button onClick={toggleScanner}>
        {isScannerActive ? 'Desactivar Escáner' : 'Activar Escáner'}
      </button>
      <div ref={scannerRef} id="interactive" className={`viewport scanner-container ${isScannerActive ? '' : 'hidden'}`}>
        {/* Quagga will attach video and canvas here */}
      </div>
      <p>Último escaneo: {currentScan}</p>
      {showModal && (
        <ConfirmationModal 
          code={tempScannedCode} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel} 
        />
      )}
      {scannedCodes.length > 0 && (
        <div className="scanned-codes-container">
          <h2>Códigos Escaneados:</h2>
          <ul>
            {scannedCodes.map((code, index) => (
              <li key={index}>{code}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <label htmlFor="manual-barcode">Entrada Manual (para agregar a la lista):</label>
        <input
          type="tel" // Changed for better numeric keyboard compatibility
          id="manual-barcode"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="13"
          onInput={(e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const manualCode = e.target.value.trim();
              // Validate for EAN-13 (13 digits, numeric)
              if (manualCode.length === 13 && /^[0-9]+$/.test(manualCode)) {
                if (!scannedCodes.includes(manualCode)) {
                  setScannedCodes(prevCodes => [...prevCodes, manualCode]);
                }
                e.target.value = ''; // Clear input after adding
              } else {
                console.log("Invalid manual entry (not 13 digits or not numeric):", manualCode);
                // Optionally, provide user feedback here (e.g., an alert or a message)
              }
            }
          }}
          placeholder="Ingresa código y presiona Enter"
        />
      </div>
    </>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stores" element={<StoreSelect />} />
        <Route path="/compare" element={<ScanPage />} />
        <Route path="/scan" element={<ScanPage />} />
      </Routes>
    </Router>
  );
}

export default App
