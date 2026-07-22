import React from 'react';

const AuthCard = ({ children, className = '' }) => {
  return (
    <div
      className={`w-full max-w-md p-8 rounded-3xl ${className}`}
      style={{
        background: 'rgba(24, 24, 27, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  );
};

export default AuthCard;
