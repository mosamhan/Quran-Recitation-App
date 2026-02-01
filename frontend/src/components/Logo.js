import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium', showTagline = true, showText = false }) => {
  // Use the logo_for_site.png from public/pictures folder
  const logoPath = '/pictures/logo_for_site.png';

  return (
    <div className={`logo-container logo-${size}`}>
      <img 
        src={logoPath}
        alt="Iqra - Quran Recitation" 
        className="logo-image"
      />
      {showText && (
        <div className="logo-text">IQRA</div>
      )}
    </div>
  );
};

export default Logo;

