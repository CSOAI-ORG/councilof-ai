import React from 'react';

// Add global styles for better mobile UX
const MobileEnhancements: React.FC = () => {
  React.useEffect(() => {
    // Add smooth scrolling globally
    const style = document.createElement('style');
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      
      /* Better mobile touch targets */
      @media (max-width: 768px) {
        button, a[role="button"] {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Better form inputs on mobile */
        input, textarea, select {
          font-size: 16px; /* Prevents zoom on iOS */
        }
        
        /* Better mobile card spacing */
        .container {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        
        /* Improved mobile typography */
        h1 { font-size: 2.25rem; line-height: 1.2; }
        h2 { font-size: 1.875rem; line-height: 1.3; }
        h3 { font-size: 1.5rem; line-height: 1.4; }
        
        /* Better mobile navigation */
        .mobile-menu {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      }
      
      /* Improved focus states for accessibility */
      button:focus-visible, 
      a:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 2px solid hsl(var(--gts-yellow));
        outline-offset: 2px;
        border-radius: 6px;
        transition: all 0.2s ease-out;
      }
      
      /* Enhanced button interactions */
      button, a[role="button"] {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* Card hover enhancements */
      .card-interactive {
        transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
      }
      
      .card-interactive:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      
      /* Loading animations */
      .loading-pulse {
        animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      /* Better hover states on non-touch devices */
      @media (hover: hover) and (pointer: fine) {
        .hover-lift:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease-out;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default MobileEnhancements;