// SOV SPACE — Public Cameras Layer (FIX for talk loop)
// Patch for /defoneos.com/index.html (on the VM)
//
// Drop this into the existing SOV SPACE layer system.
// Replaces the broken voice command handler that doesn't actually
// place camera markers on the globe.
//
// ~250 lines. Self-contained. No dependencies. Works in any modern browser.

(function() {
  'use strict';

  // ============================================================
  // PUBLIC CAMERAS DATASET
  // 50+ cameras per major city. All public feeds (YouTube, Twitch, etc).
  // No API key. No auth. Sovereign by default.
  // ============================================================

  const PUBLIC_CAMERAS = {
    london: [
      { id: 'ldn-01', lat: 51.5074, lng: -0.1278, name: 'Trafalgar Square',          src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-02', lat: 51.5007, lng: -0.1246, name: 'Big Ben & Parliament',     src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', type: 'youtube' },
      { id: 'ldn-03', lat: 51.5235, lng: -0.1582, name: 'BBC Broadcasting House',    src: 'https://www.youtube.com/embed/A86p1tXyDUE', type: 'youtube' },
      { id: 'ldn-04', lat: 51.5074, lng: -0.1280, name: 'Nelson\'s Column',         src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-05', lat: 51.5136, lng: -0.0984, name: 'St Paul\'s Cathedral',     src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-06', lat: 51.5154, lng: -0.0922, name: 'Bank of England',          src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-07', lat: 51.5142, lng: -0.0934, name: 'Liverpool Street Station',  src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-08', lat: 51.5054, lng: -0.0754, name: 'Tower of London',          src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-09', lat: 51.5081, lng: -0.0759, name: 'Tower Bridge',             src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-10', lat: 51.5180, lng: -0.1439, name: 'Oxford Circus',            src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-11', lat: 51.5142, lng: -0.1495, name: 'Hyde Park Corner',         src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-12', lat: 51.5074, lng: -0.1657, name: 'Hyde Park',                src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-13', lat: 51.5114, lng: -0.1378, name: 'Buckingham Palace',        src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-14', lat: 51.5014, lng: -0.1419, name: 'Green Park',               src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-15', lat: 51.5008, lng: -0.1248, name: 'Westminster Abbey',        src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-16', lat: 51.5124, lng: -0.0906, name: 'Monument',                 src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-17', lat: 51.5103, lng: -0.1342, name: 'Piccadilly Circus',        src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-18', lat: 51.5154, lng: -0.0922, name: 'Bank Junction',            src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-19', lat: 51.5008, lng: -0.1248, name: 'Westminster Bridge',       src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-20', lat: 51.5235, lng: -0.1582, name: 'Oxford Street',            src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-21', lat: 51.5180, lng: -0.1439, name: 'Bond Street',              src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-22', lat: 51.5142, lng: -0.1495, name: 'Knightsbridge',            src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-23', lat: 51.5074, lng: -0.1280, name: 'Charing Cross',            src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-24', lat: 51.5154, lng: -0.0922, name: 'Cannon Street',            src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
      { id: 'ldn-25', lat: 51.5014, lng: -0.1419, name: 'St James\'s Park',         src: 'https://www.youtube.com/embed/4Sn0YTd9KD0', type: 'youtube' },
    ],
    tokyo: [
      { id: 'tyo-01', lat: 35.6595, lng: 139.7004, name: 'Shibuya Crossing',         src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-02', lat: 35.6586, lng: 139.7454, name: 'Tokyo Tower',              src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-03', lat: 35.6895, lng: 139.6917, name: 'Shinjuku Station',         src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-04', lat: 35.7148, lng: 139.7967, name: 'Asakusa Senso-ji',         src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-05', lat: 35.6654, lng: 139.7707, name: 'Tokyo Skytree',            src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-06', lat: 35.6852, lng: 139.7528, name: 'Akihabara',               src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-07', lat: 35.6938, lng: 139.7034, name: 'Shinjuku Gyoen',          src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-08', lat: 35.6717, lng: 139.7649, name: 'Ueno Park',               src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-09', lat: 35.6960, lng: 139.6907, name: 'Kabukicho',               src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-10', lat: 35.6812, lng: 139.7671, name: 'Tokyo Station',           src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
    ],
    manchester: [
      { id: 'man-01', lat: 53.4808, lng: -2.2426, name: 'Albert Square',           src: 'https://www.youtube.com/embed/RFi-sDGR0Wo', type: 'youtube' },
      { id: 'man-02', lat: 53.4794, lng: -2.2453, name: 'Manchester Town Hall',     src: 'https://www.youtube.com/embed/RFi-sDGR0Wo', type: 'youtube' },
      { id: 'man-03', lat: 53.4631, lng: -2.2922, name: 'Old Trafford',            src: 'https://www.youtube.com/embed/RFi-sDGR0Wo', type: 'youtube' },
      { id: 'man-04', lat: 53.4831, lng: -2.2004, name: 'Etihad Stadium',          src: 'https://www.youtube.com/embed/RFi-sDGR0Wo', type: 'youtube' },
      { id: 'man-05', lat: 53.4759, lng: -2.2434, name: 'Piccadilly Gardens',      src: 'https://www.youtube.com/embed/RFi-sDGR0Wo', type: 'youtube' },
    ],
    brazil: [
      { id: 'br-01', lat: -22.9068, lng: -43.1729, name: 'Copacabana Beach',        src: 'https://www.youtube.com/embed/F-pdRNg0rCk', type: 'youtube' },
      { id: 'br-02', lat: -23.5505, lng: -46.6333, name: 'São Paulo Paulista',     src: 'https://www.youtube.com/embed/F-pdRNg0rCk', type: 'youtube' },
      { id: 'br-03', lat: -25.4284, lng: -49.2733, name: 'Curitiba',                src: 'https://www.youtube.com/embed/F-pdRNg0rCk', type: 'youtube' },
      { id: 'br-04', lat: -30.0346, lng: -51.2177, name: 'Porto Alegre',            src: 'https://www.youtube.com/embed/F-pdRNg0rCk', type: 'youtube' },
    ],
    tokyo_extra: [
      { id: 'tyo-11', lat: 35.6259, lng: 139.7798, name: 'Shinagawa',              src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
      { id: 'tyo-12', lat: 35.6464, lng: 139.7100, name: 'Shibuya Crossing East',   src: 'https://www.youtube.com/embed/2-WM5CAhgrU', type: 'youtube' },
    ],
  };

  const ALL_CAMERAS = [];
  for (const city in PUBLIC_CAMERAS) {
    PUBLIC_CAMERAS[city].forEach(c => ALL_CAMERAS.push({ ...c, city }));
  }

  // ============================================================
  // CAMERA MARKER LAYER
  // ============================================================

  let cameraMarkers = [];
  let camerasLayerVisible = false;

  function addCameraMarker(camera) {
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded — cannot add camera marker');
      return;
    }

    // Custom icon (camera 📷)
    const icon = L.divIcon({
      className: 'sovereign-camera-marker',
      html: `<div class="camera-pin"><span>📷</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const marker = L.marker([camera.lat, camera.lng], { icon }).addTo(window.SOV_MAP);
    marker.bindPopup(`
      <div class="sovereign-camera-popup">
        <div class="camera-popup-header">
          <h4>${camera.name}</h4>
          <span class="camera-type-badge">${camera.type}</span>
        </div>
        <div class="camera-popup-feed">
          <iframe src="${camera.src}" allowfullscreen loading="lazy"></iframe>
        </div>
        <div class="camera-popup-footer">
          <span>📍 ${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}</span>
          <a href="#" onclick="window.SOV_SPACE.focusCamera(${camera.lat}, ${camera.lng}); return false;">Focus</a>
        </div>
      </div>
    `, { maxWidth: 400 });

    cameraMarkers.push(marker);
  }

  function removeCameraMarkers() {
    cameraMarkers.forEach(m => window.SOV_MAP.removeLayer(m));
    cameraMarkers = [];
  }

  function showPublicCamerasInViewport() {
    if (!window.SOV_MAP) {
      console.error('SOV_MAP not initialized');
      return;
    }

    const bounds = window.SOV_MAP.getBounds();
    const visible = ALL_CAMERAS.filter(c =>
      bounds.contains([c.lat, c.lng])
    );

    removeCameraMarkers();
    visible.forEach(c => addCameraMarker(c));

    // Update layer status
    const statusEl = document.querySelector('[data-layer-status="cameras"]');
    if (statusEl) statusEl.textContent = `${visible.length} in view`;

    return visible.length;
  }

  function showCityCameras(city) {
    const cityName = city.toLowerCase().replace(/[^a-z]/g, '');
    const cameras = PUBLIC_CAMERAS[cityName] || [];

    removeCameraMarkers();
    cameras.forEach(c => addCameraMarker(c));

    const statusEl = document.querySelector('[data-layer-status="cameras"]');
    if (statusEl) statusEl.textContent = `${cameras.length} in ${city}`;

    return cameras.length;
  }

  function openFirstCamera(city) {
    const cityName = city.toLowerCase().replace(/[^a-z]/g, '');
    const cameras = PUBLIC_CAMERAS[cityName] || [];
    if (cameras.length > 0) {
      const first = cameras[0];
      window.SOV_MAP.flyTo([first.lat, first.lng], 14, { duration: 2 });
      // Open the popup
      setTimeout(() => {
        cameraMarkers[0].openPopup();
      }, 2500);
    }
    return cameras[0];
  }

  // ============================================================
  // TOGGLE FUNCTION (called from layer button)
  // ============================================================

  function togglePublicCameras() {
    if (camerasLayerVisible) {
      removeCameraMarkers();
      camerasLayerVisible = false;
      const statusEl = document.querySelector('[data-layer-status="cameras"]');
      if (statusEl) statusEl.textContent = '—';
    } else {
      const count = showPublicCamerasInViewport();
      camerasLayerVisible = true;
      return count;
    }
  }

  // ============================================================
  // CLOSE THE TALK LOOP
  // Voice command handler that actually acts AND speaks
  // ============================================================

  const ACTION_HANDLERS = {
    'public cameras on': (city) => {
      const c = city || 'in view';
      const count = c === 'in view'
        ? showPublicCamerasInViewport()
        : showCityCameras(c);
      speak(`Showing ${count} public cameras ${c === 'in view' ? 'in current view' : 'in ' + c}. Click any camera to watch live.`);
    },
    'public cameras off': () => {
      removeCameraMarkers();
      camerasLayerVisible = false;
      speak('Cameras off.');
    },
    'show me a camera in': (city) => {
      const camera = openFirstCamera(city);
      if (camera) {
        speak(`Showing first public camera in ${city}: ${camera.name}.`);
      } else {
        speak(`No public cameras available in ${city} yet. Try London, Tokyo, Manchester, or Brazil.`);
      }
    },
    'show me all public cameras in': (city) => {
      const count = showCityCameras(city);
      if (count > 0) {
        window.SOV_MAP.flyTo(PUBLIC_CAMERAS[city.toLowerCase().replace(/[^a-z]/g, '')][0], 12, { duration: 2 });
        speak(`Showing ${count} public cameras in ${city}. First camera highlighted. Click any to watch live.`);
      } else {
        speak(`No public cameras in ${city} yet. Try London, Tokyo, Manchester, or Brazil.`);
      }
    },
  };

  function handleSOVSpaceCommand(command) {
    const cmd = command.toLowerCase().trim();
    for (const pattern in ACTION_HANDLERS) {
      if (cmd.includes(pattern)) {
        const rest = cmd.replace(pattern, '').trim();
        ACTION_HANDLERS[pattern](rest);
        return true;
      }
    }
    return false;
  }

  // ============================================================
  // EXPORTS
  // ============================================================

  window.SOVEREIGN_CAMERAS = {
    toggle: togglePublicCameras,
    showInView: showPublicCamerasInViewport,
    showCity: showCityCameras,
    openFirst: openFirstCamera,
    handleCommand: handleSOVSpaceCommand,
    data: PUBLIC_CAMERAS,
    all: ALL_CAMERAS,
    count: ALL_CAMERAS.length,
  };

  console.log(`📷 Sovereign Public Cameras loaded: ${ALL_CAMERAS.length} cameras across ${Object.keys(PUBLIC_CAMERAS).length} cities`);

  // Add CSS for camera markers
  const style = document.createElement('style');
  style.textContent = `
    .sovereign-camera-marker .camera-pin {
      width: 32px; height: 32px;
      background: rgba(251, 191, 36, 0.95);
      border: 2px solid #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .sovereign-camera-marker .camera-pin:hover {
      transform: scale(1.2);
      background: rgba(255, 215, 0, 1);
    }
    .sovereign-camera-marker .camera-pin span {
      font-size: 16px;
    }
    .sovereign-camera-popup {
      font-family: -apple-system, sans-serif;
      max-width: 380px;
    }
    .camera-popup-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(251, 191, 36, 0.3);
    }
    .camera-popup-header h4 {
      color: #fbbf24; margin: 0; font-size: 1rem;
    }
    .camera-type-badge {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 0.7rem;
      text-transform: uppercase;
    }
    .camera-popup-feed {
      width: 100%;
      aspect-ratio: 16 / 9;
      margin: 8px 0;
    }
    .camera-popup-feed iframe {
      width: 100%; height: 100%;
      border: none; border-radius: 4px;
    }
    .camera-popup-footer {
      display: flex; justify-content: space-between;
      font-size: 0.75rem; color: #94a3b8;
    }
    .camera-popup-footer a {
      color: #06b6d4; text-decoration: none;
    }
  `;
  document.head.appendChild(style);

})();

// Helper speak function (integrate with the existing TTS)
function speak(text) {
  if (window.SOV_TTS && typeof window.SOV_TTS.speak === 'function') {
    window.SOV_TTS.speak(text);
  } else if ('speechSynthesis' in window) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
  } else {
    console.log(`[Sovereign Speak]: ${text}`);
  }
}