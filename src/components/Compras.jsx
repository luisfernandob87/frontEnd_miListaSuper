import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Quagga from 'quagga';
import Publicidad from './Publicidad';
import ConfirmationModal from './ConfirmationModal';
import config from '../config';

function Compras() {
  const location = useLocation();
  const selectedStore = location.state?.store || "Walmart";
  const storeApiMap = {
    "Paiz": "paiz",
    "Walmart": "walmart",
    "Maxidespensa": "maxidespensa",
    "La Torre": "latorre"
  };
  
  const [scannedCodes, setScannedCodes] = useState([]);
  const [currentScan, setCurrentScan] = useState('Not Found');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempScannedCode, setTempScannedCode] = useState('');
  const [products, setProducts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const scannerRef = useRef(null);

  const fetchProductInfo = async (code) => {
    setIsLoading(true);
    try {
      const apiBaseUrl = config.getApiBaseUrl();
      const storeApiEndpoint = storeApiMap[selectedStore];
      const response = await fetch(`${apiBaseUrl}/api/${storeApiEndpoint}/${code}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const responseData = await response.json();
      
      console.log('Respuesta completa de la API:', responseData);
      
      // Extraer los datos del producto según la estructura de respuesta
      // La API devuelve un objeto con una propiedad que corresponde al nombre de la tienda
      const data = responseData[storeApiEndpoint] || {};
      
      console.log('Datos extraídos para la tienda:', data);
      
      // Actualizar productos
      setProducts(prevProducts => ({
        ...prevProducts,
        [code]: data
      }));
      
      // Añadir al carrito
      const newItem = {
        id: code,
        name: data.nombre || 'Producto sin nombre',
        price: data.precio || 0,
        quantity: 1,
        image: data.imagen?.replace(/[" ]/g, '') || ''
      };
      
      console.log('Nuevo item creado:', newItem);
      
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === code);
        if (existingItem) {
          return prevItems.map(item => 
            item.id === code ? {...item, quantity: item.quantity + 1} : item
          );
        } else {
          return [...prevItems, newItem];
        }
      });
      
      // Actualizar total
      updateTotal();
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

  const updateTotal = () => {
    setTotal(cartItems.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0));
  };
  
  useEffect(() => {
    updateTotal();
  }, [cartItems]);
  
  const handleConfirm = () => {
    setCurrentScan(tempScannedCode);
    if (!scannedCodes.includes(tempScannedCode)) {
      setScannedCodes(prevCodes => [...prevCodes, tempScannedCode]);
      fetchProductInfo(tempScannedCode);
    } else {
      // Si ya existe, solo incrementamos la cantidad
      setCartItems(prevItems => {
        return prevItems.map(item => 
          item.id === tempScannedCode ? {...item, quantity: item.quantity + 1} : item
        );
      });
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
      } else {
        // Si ya existe, solo incrementamos la cantidad
        setCartItems(prevItems => {
          return prevItems.map(item => 
            item.id === manualCode ? {...item, quantity: item.quantity + 1} : item
          );
        });
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
  
  const increaseQuantity = (id) => {
    setCartItems(prevItems => {
      return prevItems.map(item => 
        item.id === id ? {...item, quantity: item.quantity + 1} : item
      );
    });
  };
  
  const decreaseQuantity = (id) => {
    setCartItems(prevItems => {
      return prevItems.map(item => 
        item.id === id && item.quantity > 1 ? {...item, quantity: item.quantity - 1} : item
      );
    });
  };
  
  const removeItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    setScannedCodes(prevCodes => prevCodes.filter(code => code !== id));
  };

  return (
    <>
      <Publicidad/>
      <h2>Lista de Compras - {selectedStore}</h2>
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
          .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .cart-item-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cart-item-image {
            width: 50px;
            height: 50px;
            object-fit: contain;
          }
          .cart-item-details {
            flex: 1;
          }
          .cart-item-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .quantity-control {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .quantity-btn {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
          }
          .remove-btn {
            background: #ff5252;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
          }
          .cart-total {
            margin-top: 20px;
            text-align: right;
            font-size: 1.2rem;
            font-weight: bold;
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
      
      {/* Lista de compras */}
      <div style={{ marginTop: '20px', padding: '0 20px' }}>
        <h3>Tu lista de compras</h3>
        
        {cartItems.length === 0 ? (
          <p>No hay productos en tu lista. Escanea un código de barras para agregar productos.</p>
        ) : (
          <div>
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="cart-item-image"
                    />
                  )}
                  <div className="cart-item-details">
                    <div>{item.name}</div>
                    <div>Q{(item.price || 0).toFixed(2)}</div>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn" 
                      onClick={() => decreaseQuantity(item.id)}
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span>{item.quantity}</span>
                    <button 
                      className="quantity-btn" 
                      onClick={() => increaseQuantity(item.id)}
                    >+</button>
                  </div>
                  <div>Q{((item.price || 0) * item.quantity).toFixed(2)}</div>
                  <button 
                    className="remove-btn" 
                    onClick={() => removeItem(item.id)}
                  >×</button>
                </div>
              </div>
            ))}
            
            <div className="cart-total">
              Total: Q{(total || 0).toFixed(2)}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '20px' }}>
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

export default Compras;