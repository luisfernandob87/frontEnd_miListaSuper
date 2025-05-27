import { useState, useRef } from 'react';
import Quagga from 'quagga';
import Publicidad from './Publicidad';
import ConfirmationModal from './ConfirmationModal';

function ScanPage() {
  const [scannedCodes, setScannedCodes] = useState([]);
  const [currentScan, setCurrentScan] = useState('Not Found');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempScannedCode, setTempScannedCode] = useState('');
  const scannerRef = useRef(null);

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
      <h2>Escáner de Código de Barras</h2>
      <button onClick={toggleScanner}>
        {isScannerActive ? 'Desactivar Escáner' : 'Activar Escáner'}
      </button>
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
            style={{ padding: '0.5rem 1.2rem', fontSize: '1.1rem', borderRadius: '6px', border: 'none', background: '#1976d2', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
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

export default ScanPage;