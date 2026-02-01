import React from 'react';
import './ReciterModal.css';

const ReciterModal = ({ isOpen, onClose, reciters, selectedReciter, onSelectReciter }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Reciter</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="reciters-list">
          {reciters.map((reciter) => (
            <div
              key={reciter.id}
              className={`reciter-item ${selectedReciter === reciter.id ? 'selected' : ''}`}
              onClick={() => {
                onSelectReciter(reciter.id);
                onClose();
              }}
            >
              <div className="reciter-name">{reciter.name}</div>
              {selectedReciter === reciter.id && (
                <div className="reciter-check">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReciterModal;





