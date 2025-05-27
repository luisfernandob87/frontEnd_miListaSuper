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

export default ConfirmationModal;