// sovspace_globe.js — Cesium + 33-hive visualization for SovSpace Canvas
Cesium.Ion.defaultAccessToken = '';
const HIVES = [
  {n:'London Telehouse',     lat:51.5074, lng:-0.0275,   tier:'live',region:'UK'},
  {n:'Equinix Manchester',    lat:53.4794, lng:-2.2453,   tier:'live',region:'UK'},
  {n:'Heriot-Watt Edinburgh', lat:55.9232, lng:-3.1365,   tier:'live',region:'UK'},
  {n:'iOK Farm M4',           lat:51.4399, lng:-1.0134,   tier:'live',region:'UK'},
  {n:'Dounreay HSE-NUC',      lat:58.5790, lng:-3.7261,   tier:'live',region:'UK'},
  {n:'MoD Corsham NEC',       lat:51.4289, lng:-2.1837,   tier:'live',region:'UK'},
  {n:'GCP meok-backend',      lat:50.8503, lng:4.3517,    tier:'swim',region:'EU'},
];
const UK_CENTER = {lat:54.0, lng:-2.5, h:400000};
const HIVE_CENTER = {lat:50.8503, lng:4.3517, h:60000};

let viewer;
function initCesium() {
  viewer = new Cesium.Viewer('cesiumhost', {
    imageryProvider: new Cesium.OpenStreetMapImageryProvider({url:'https://tile.openstreetmap.org/'}),
    baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,
    navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,
    infoBox:false,selectionIndicator:false,
  });
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1a2f');
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#02060f');
  // Place UK hives
  HIVES.forEach((h, i) => {
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(h.lng, h.lat, 0),
      point: {
        pixelSize: h.tier==='live' ? 14 : 8,
        color: h.region==='UK' ? Cesium.Color.fromCssColorString('#ef4444') : Cesium.Color.fromCssColorString('#fbbf24'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
      },
      label: {text: h.n, font: '11px monospace', fillColor: Cesium.Color.WHITE, showBackground:true, backgroundColor: Cesium.Color.fromCssColorString('#02060f'), pixelOffset: new Cesium.Cartesian2(0, -22)}
    });
  });
  viewer.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(UK_CENTER.lng, UK_CENTER.lat, UK_CENTER.h), duration: 2.5});
}
function flyHome() {
  viewer.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(UK_CENTER.lng, UK_CENTER.lat, UK_CENTER.h), duration: 2});
}
function flyToHive(i) {
  const h = HIVES[i];
  if (!h) return;
  viewer.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(h.lng, h.lat, h.tier==='live' ? 30000 : 80000), duration: 2});
}
// Wait for DOM then init
if (document.readyState === 'complete') initCesium();
else window.addEventListener('load', initCesium);

// 24 companions + 6 stages
const STAGES = ["Hatching","Growing","Anchoring","Emerging","Witnessing","Sovereign"];
const COMPANIONS = ["River","Sable","Aria","Lyra","Orin","Mira","Sage","Finn","Juno","Onyx","Wren","Iris","Vela","Kade","Pax","Sage2","Tess","Oren","Quill","Nori","Vale","Kite","Wren2","Merle"];
let activeStage = 0;
function pickStage(i){activeStage=i;document.querySelectorAll('#stages button').forEach((b,idx)=>b.classList.toggle('active', idx===i));document.getElementById('companion-detail').innerHTML='';document.getElementById('api-result').textContent='Stage = '+STAGES[i];document.querySelectorAll('#companions button').forEach(b=>b.classList.remove('active'));}
document.querySelectorAll && document.querySelectorAll('#stages button').forEach((b,idx)=>b.addEventListener('click',()=>pickStage(idx)));
function renderCompanions(){const c=document.getElementById('companions');if (!c) return;c.innerHTML='';COMPANIONS.forEach(n=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>{document.querySelectorAll('#companions button').forEach(bb=>bb.classList.remove('active'));b.classList.add('active');window.SOVNAME=n;};c.appendChild(b);});}
renderCompanions();
window.SOVNAME = 'Aria';
window.SOVSTAGE = 0;
pickStage(0);

async function inspectCompanion(){
  const name = window.SOVNAME || 'Aria';
  const stage = activeStage;
  const url = `/api/sovspace?action=companion&name=${encodeURIComponent(name)}&stage=${stage}`;
  document.getElementById('api-result').textContent = '... calling '+url;
  try {
    const r = await fetch(url);
    const d = await r.json();
    document.getElementById('api-result').textContent = JSON.stringify(d, null, 2).slice(0, 2400);
    document.getElementById('companion-detail').innerHTML = `<div style="color:#10b981;background:#022c0a;padding:.5rem;border-radius:6px;margin-top:.3rem"><strong>${d.name}</strong> · ${d.archetype} · stage=${d.stage} · care_floor=${d.care_floor} · tags="${d.tags}"</div>`;
  } catch (e) {
    document.getElementById('api-result').textContent = '✗ '+e.message;
  }
}

async function callAPIs(){
  const out = [];
  for (const a of ['hatch','canon','concepts','globe','companion?name=Aria']) {
    try {
      const r = await fetch(`/api/sovspace?action=${a.replace('?','&')}`);
      const d = await r.json();
      out.push(`## /api/sovspace?action=${a}\n` + JSON.stringify(d).slice(0,300) + '\n---');
    } catch (e) { out.push(`✗ ${a}: ${e.message}`); }
  }
  document.getElementById('sovspace-result').textContent = out.join('\n').slice(0, 3800);
}
