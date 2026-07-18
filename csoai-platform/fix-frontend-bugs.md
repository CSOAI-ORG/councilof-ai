# CSOAI Frontend Bug Fixes

## Critical Layout Issues to Fix

### 1. Remove Debugging Artifacts
```css
/* Remove these from all components */
.debug-border {
  border: 1px solid red; /* REMOVE */
}

/* Find and remove all colored debugging borders */
```

### 2. Fix Container Widths
```css
/* Standardize container max-widths */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}
```

### 3. Fix Footer Issues
```css
/* Fix footer layout */
footer {
  background: #1a1a1a;
  color: #ffffff;
  padding: 40px 0;
  margin-top: auto;
}

footer a {
  color: #cccccc;
  text-decoration: none;
  transition: color 0.2s;
}

footer a:hover {
  color: #ffffff;
}

/* Remove colored borders from footer links */
footer .debug-border,
footer [style*="border"] {
  border: none !important;
}
```

### 4. Fix Responsive Design
```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .mobile-menu {
    display: block;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
```

### 5. Fix Button Styling
```css
/* Consistent button styles */
.btn {
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}
```

## Files to Update

1. **client/src/styles/globals.css** - Add consistent styles
2. **client/src/components/Layout/Header.tsx** - Fix navigation
3. **client/src/components/Layout/Footer.tsx** - Remove debug borders
4. **client/src/pages/*.tsx** - Fix page layouts
5. **client/tailwind.config.js** - Update responsive breakpoints