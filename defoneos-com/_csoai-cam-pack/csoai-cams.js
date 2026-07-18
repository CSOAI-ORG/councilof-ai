/* ============================================================================
 * SovCams — portable live-camera + space-cam widget for CSOAI
 * Live public cameras (traffic/webcam) + orbital/satellite views for a 3D globe
 * or any AI space-governance UI. Vanilla JS, zero dependencies, framework-agnostic.
 *
 * Data (all real, mostly keyless):
 *   • Public cameras  → GET {API}/api/cameras?area=<place>|region=london|ontario|alberta
 *                       (TfL JamCams + Ontario/Alberta 511 keyless; Windy Webcams global if WINDY_KEY set)
 *   • Space / orbit   → DSCOVR/EPIC whole-Earth (NASA, keyless), GOES-East/West GeoColor
 *                       (NOAA STAR, keyless), live ISS view (YouTube), ISS ground track (wheretheiss.at)
 *
 * USE (two options):
 *  A) Point at the deployed DEFONEOS API (CORS-open, nothing to host):
 *       SovCams.config({ api: 'https://defoneos.vercel.app' });
 *  B) Copy /api/cameras.js + /api/space.js into your own Vercel app and:
 *       SovCams.config({ api: '' });   // same-origin
 *
 *  SovCams.cameras('tokyo');            // fly-less: plots + returns cams; opens the first
 *  SovCams.openCamera(cam);            // cam = {name,lat,lon,image,video?,city?}
 *  SovCams.openSpaceCam();             // whole-Earth EPIC + GOES + live ISS switcher
 *  SovCams.onCameras = function(list){ /* plot list[i].lat/lon on your globe */ };
 * ========================================================================== */
(function (root) {
  var CFG = { api: 'https://defoneos.vercel.app', z: 900, accent: '#5ff4ff' };
  function api(p) { return (CFG.api || '') + p; }
  function el(tag, css, html) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (html != null) d.innerHTML = html; return d; }
  function bust(u) { return u + (u.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(); }

  // ---- draggable window (leak-free: doc listeners only while dragging) ----
  function makeWin(id, title, w) {
    var old = document.getElementById(id); if (old) old.remove();
    var win = el('div', 'position:fixed;z-index:' + CFG.z + ';width:' + (w || 380) + 'px;max-width:94vw;left:calc(50% - ' + ((w || 380) / 2) + 'px);top:74px;background:#0a0f1a;border:1px solid rgba(120,150,200,.22);border-radius:14px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.55);font:13px/1.5 -apple-system,Inter,system-ui,sans-serif;color:#dfe7f5');
    win.id = id;
    var bar = el('div', 'display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(20,30,50,.7);cursor:move;font-weight:700;border-bottom:1px solid rgba(120,150,200,.16)',
      '<span>' + title + '</span><span style="flex:1"></span><span style="cursor:pointer;opacity:.7;font-size:16px">✕</span>');
    bar.lastChild.onclick = function () { win.remove(); };
    win.appendChild(bar);
    // drag
    var sx, sy, ox, oy; function mv(e) { win.style.left = (ox + e.clientX - sx) + 'px'; win.style.top = Math.max(40, oy + e.clientY - sy) + 'px'; }
    function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
    bar.addEventListener('mousedown', function (e) { if (e.target === bar.lastChild) return; sx = e.clientX; sy = e.clientY; var r = win.getBoundingClientRect(); ox = r.left; oy = r.top; e.preventDefault(); document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); });
    document.body.appendChild(win); return win;
  }

  // ---- public camera window (live img/video, auto-refresh, honest offline state) ----
  function openCamera(cam) {
    if (!cam) return;
    var win = makeWin('sovCamWin', '📷 ' + (cam.name || 'camera'), 360);
    var body = el('div', 'padding:10px');
    body.innerHTML =
      '<div style="position:relative;min-height:120px;background:#05080f;border-radius:9px;overflow:hidden">' +
      (cam.video ? '<video id="sovCamVid" src="' + cam.video + '" autoplay loop muted playsinline style="width:100%;display:block" onerror="this.style.display=\'none\'"></video>' : '') +
      '<img id="sovCamImg" src="' + bust(cam.image) + '" style="width:100%;display:' + (cam.video ? 'none' : 'block') + '" ' +
        'onerror="this.style.display=\'none\';var o=document.getElementById(\'sovCamOff\');if(o)o.style.display=\'flex\'">' +
      '<div id="sovCamOff" style="display:none;align-items:center;justify-content:center;height:120px;color:#8a97b4;font-size:12px;text-align:center;padding:0 14px">this camera is offline right now — reopen or use the snapshot link</div>' +
      '</div>' +
      '<div style="font-size:11px;color:#8a97b4;margin-top:7px">' + (cam.city ? cam.city + ' · ' : '') + (cam.video ? '<b style="color:' + CFG.accent + '">live motion</b> · ' : 'live · auto-refresh · ') + '<b style="color:' + CFG.accent + '">public feed only</b></div>' +
      '<div style="margin-top:7px"><a href="' + cam.image + '" target="_blank" rel="noopener" style="color:' + CFG.accent + ';font-size:11px">↗ snapshot</a></div>';
    win.appendChild(body);
    var im = body.querySelector('#sovCamImg'), vid = body.querySelector('#sovCamVid');
    var t = setInterval(function () { if (!win.parentNode || document.hidden) { if (!win.parentNode) clearInterval(t); return; } if (vid && vid.style.display !== 'none') return; if (im) im.src = bust(cam.image); }, 3500);
    return win;
  }

  // ---- fetch public cameras for an area; plot via onCameras; open the first ----
  function cameras(area, opts) {
    opts = opts || {};
    var qs = area ? ('?area=' + encodeURIComponent(area)) : '';
    return fetch(api('/api/cameras' + qs)).then(function (r) { return r.json(); }).then(function (d) {
      var list = (d && d.cameras) || [];
      if (typeof SovCams.onCameras === 'function') try { SovCams.onCameras(list, d); } catch (e) {}
      if (!opts.noOpen && list[0]) openCamera(list[0]);
      return d;
    }).catch(function () { return { ok: false, cameras: [] }; });
  }

  // ---- space / orbital cam: whole-Earth (EPIC), GOES weather disks, live ISS ----
  function openSpaceCam(opts) {
    opts = opts || {};
    var win = makeWin('sovSpaceWin', '🛰 SPACE CAM · ' + (opts.name || 'live from orbit'), 440);
    var body = el('div', 'padding:10px');
    body.innerHTML =
      '<div id="sovSpaceMedia" style="position:relative;border-radius:9px;overflow:hidden;background:#000;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#7fd9ff;font-size:12px">acquiring the view from space…</div>' +
      '<div id="sovSpaceCap" style="font-size:11px;color:#8a97b4;margin-top:7px"></div>' +
      '<div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">' +
        chip('🌍 Whole Earth (EPIC)', "SovCams.spaceMode('epic')") +
        chip('🌀 GOES-East', "SovCams.spaceMode('goes19')") +
        chip('🌀 GOES-West', "SovCams.spaceMode('goes18')") +
        chip('📹 Live ISS', "SovCams.spaceMode('iss')") +
      '</div>';
    win.appendChild(body);
    // live ISS ground-track caption
    fetch('https://api.wheretheiss.at/v1/satellites/25544').then(function (r) { return r.json(); }).then(function (j) {
      var c = document.getElementById('sovSpaceCap'); if (c && j && j.latitude != null) c.innerHTML = 'ISS now over <b>' + j.latitude.toFixed(1) + '°, ' + j.longitude.toFixed(1) + '°</b> at <b>' + Math.round(j.altitude) + ' km</b> · <b style="color:' + CFG.accent + '">real orbital telemetry</b>';
    }).catch(function () {});
    setTimeout(function () { spaceMode(opts.mode || 'epic'); }, 60);
    return win;
  }
  function chip(label, onclick) { return '<span style="cursor:pointer;font-size:11px;border:1px solid rgba(120,150,200,.3);border-radius:999px;padding:4px 9px;color:#cfe" onclick="' + onclick.replace(/"/g, '&quot;') + '">' + label + '</span>'; }
  function spaceMode(m) {
    var media = document.getElementById('sovSpaceMedia'), cap = document.getElementById('sovSpaceCap'); if (!media) return;
    if (m === 'iss') { media.innerHTML = '<iframe src="https://www.youtube.com/embed/vytmBNhc9ig?autoplay=1&mute=1&playsinline=1&rel=0" style="width:100%;height:100%;border:0" allow="autoplay; encrypted-media" allowfullscreen></iframe>'; if (cap) cap.innerHTML = 'Live Earth view from the <b>ISS</b> · if dark, station is night-side — try Whole Earth.'; return; }
    if (m === 'goes19' || m === 'goes18') { var sat = m === 'goes19' ? 'GOES19' : 'GOES18', nm = m === 'goes19' ? 'GOES-East' : 'GOES-West';
      media.innerHTML = '<img src="https://cdn.star.nesdis.noaa.gov/' + sat + '/ABI/FD/GEOCOLOR/1808x1808.jpg?t=' + Date.now() + '" style="width:100%;display:block" onerror="this.parentNode.innerHTML=\'weather disk unavailable — try Whole Earth\'">'; if (cap) cap.innerHTML = 'Live GeoColor weather disk · <b>' + nm + '</b> · <b style="color:' + CFG.accent + '">real GOES-R satellite</b>'; return; }
    if (cap) cap.textContent = 'Fetching the latest whole-Earth image from DSCOVR/EPIC…';
    fetch('https://epic.gsfc.nasa.gov/api/natural').then(function (r) { return r.json(); }).then(function (a) {
      if (a && a[0]) { var im = a[0], d = im.date.split(' ')[0].split('-'); media.innerHTML = '<img src="https://epic.gsfc.nasa.gov/archive/natural/' + d[0] + '/' + d[1] + '/' + d[2] + '/png/' + im.image + '.png" style="width:100%;display:block" alt="Whole Earth from DSCOVR/EPIC">'; if (cap) cap.innerHTML = 'Whole Earth from <b>DSCOVR/EPIC</b> at L1 · ' + im.date + ' UTC · <b style="color:' + CFG.accent + '">real satellite image</b>'; }
      else if (cap) cap.textContent = 'EPIC unavailable right now — try live ISS.';
    }).catch(function () { if (cap) cap.textContent = 'EPIC unavailable right now — try live ISS.'; });
  }

  var SovCams = { config: function (o) { for (var k in o) CFG[k] = o[k]; return SovCams; }, cameras: cameras, openCamera: openCamera, openSpaceCam: openSpaceCam, spaceMode: spaceMode, onCameras: null };
  root.SovCams = SovCams;
  if (typeof module !== 'undefined' && module.exports) module.exports = SovCams;
})(typeof window !== 'undefined' ? window : this);
