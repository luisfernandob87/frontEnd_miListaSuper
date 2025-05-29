import { useState, useRef, useEffect } from 'react';
import Quagga from 'quagga';
import Publicidad from './Publicidad';
import ConfirmationModal from './ConfirmationModal';

function ComparePage() {
  const [scannedCodes, setScannedCodes] = useState([]);
  const [currentScan, setCurrentScan] = useState('Not Found');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempScannedCode, setTempScannedCode] = useState('');
  const [products, setProducts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);

  const fetchProductInfo = async (code) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://backend-milistasuper.onrender.com/api/product/${code}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setProducts(prevProducts => ({
        ...prevProducts,
        [code]: data
      }));
    } catch (error) {
      console.error('Error fetching product info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initQuagga = () => {
    if (scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment"
          },
        },
        decoder: {
          readers: ["ean_reader"],
          debug: {
            drawBoundingBox: true,
            showFrequency: true,
            drawScanline: true,
            showPattern: true
          },
          multiple: false
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        frequency: 10,
        numOfWorkers: navigator.hardwareConcurrency || 4,
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
        }
      });
    }
  };

  const _onDetected = (result) => {
    const code = result.codeResult.code;
    const format = result.codeResult.format;
    if (code && code.length === 13 && /^[0-9]+$/.test(code) && format === 'ean_13') {
      setTempScannedCode(code);
      setShowModal(true);
      Quagga.stop();
      setIsScannerActive(false);
    } else {
      console.log("Ignored code (not EAN-13 or invalid format/type):", code, "Format:", format);
    }
  };

  const handleConfirm = () => {
    setCurrentScan(tempScannedCode);
    if (!scannedCodes.includes(tempScannedCode)) {
      setScannedCodes(prevCodes => [...prevCodes, tempScannedCode]);
      fetchProductInfo(tempScannedCode);
    }
    setShowModal(false);
    initQuagga();
  };

  const handleCancel = () => {
    setShowModal(false);
    initQuagga();
  };

  const handleManualAdd = (e) => {
    const manualCode = e.target.value.trim();
    if (manualCode.length === 13 && /^[0-9]+$/.test(manualCode)) {
      if (!scannedCodes.includes(manualCode)) {
        setScannedCodes(prevCodes => [...prevCodes, manualCode]);
        fetchProductInfo(manualCode);
      }
      e.target.value = '';
    } else {
      console.log("Invalid manual entry (not 13 digits or not numeric):", manualCode);
    }
  };

  const toggleScanner = () => {
    if (isScannerActive) {
      Quagga.stop();
      setIsScannerActive(false);
      setCurrentScan('Not Found');
      if (scannerRef.current) {
        const canvas = scannerRef.current.querySelector('canvas');
        if (canvas) {
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
        const video = scannerRef.current.querySelector('video');
        if(video) video.remove();
      }
    } else {
      initQuagga();
    }
  };

  return (
    <>
      <Publicidad/>
      <h2>Comparar Precios</h2>
      <button onClick={toggleScanner} disabled={isLoading}>
        {isScannerActive ? 'Desactivar Escáner' : 'Activar Escáner'}
      </button>
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: 'white',
            textAlign: 'center'
          }}>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '10px' }}>Cargando...</p>
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div ref={scannerRef} id="interactive" className={`viewport scanner-container ${isScannerActive ? '' : 'hidden'}`}>
      </div>
      {showModal && (
        <ConfirmationModal 
          code={tempScannedCode} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel} 
        />
      )}
      {scannedCodes.length > 0 && (
        <div className="products-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          padding: '1rem'
        }}>
          {scannedCodes.map((code) => {
            const productInfo = products[code];
            if (!productInfo) return null;

            const stores = ['maxidespensa', 'walmart', 'latorre', 'paiz'];
            const lowestPrice = Math.min(...stores
              .filter(store => productInfo[store])
              .map(store => productInfo[store].precio));

            return stores.map(store => {
              const storeInfo = productInfo[store];
              if (!storeInfo) return null;

              return (
                <div key={`${code}-${store}`} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      textTransform: 'capitalize'
                    }}>{store}</h3>
                    <span style={{
                      backgroundColor: storeInfo.precio === lowestPrice ? '#4CAF50' : 'transparent',
                      color: storeInfo.precio === lowestPrice ? 'white' : 'inherit',
                      padding: storeInfo.precio === lowestPrice ? '0.25rem 0.5rem' : 0,
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      {storeInfo.precio === lowestPrice ? '¡Mejor Precio!' : ''}
                    </span>
                  </div>
                  <img 
                    src={storeInfo.imagen.replace(/[" ]/g, '')}
                    alt={storeInfo.nombre}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'contain',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <h4 style={{
                    margin: '0.5rem 0',
                    fontSize: '1rem',
                    lineHeight: '1.4'
                  }}>{storeInfo.nombre}</h4>
                  <p style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: storeInfo.precio === lowestPrice ? '#4CAF50' : '#333'
                  }}>Q{storeInfo.precio.toFixed(2)}</p>
                </div>
              );
            });
          })}
        </div>
      )}
      <div>
        <label htmlFor="manual-barcode">Entrada Manual (para agregar a la lista):</label>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
          <input
            type="tel"
            id="manual-barcode"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="13"
            onInput={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, '');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleManualAdd(e);
              }
            }}
            placeholder="Ingresa código y presiona Enter"
            style={{ fontSize: '1.1rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', width: '180px' }}
          />
          <button
            type="button"
            disabled={isLoading}
            style={{
              padding: '0.5rem 1.2rem',
              fontSize: '1.1rem',
              borderRadius: '6px',
              border: 'none',
              background: isLoading ? '#cccccc' : '#1976d2',
              color: 'white',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onClick={(e) => {
              const input = document.getElementById('manual-barcode');
              if (input) {
                handleManualAdd({ target: input });
              }
            }}
          >Agregar</button>
        </div>
      </div>
    </>
  );
}

export default ComparePage;