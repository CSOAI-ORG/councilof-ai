/* Sticky phone CTA for mobile — drives calls */
(function(){
  if(window.innerWidth > 768) return;
  var bar = document.createElement('div');
  bar.id = 'sticky-cta';
  bar.innerHTML = '<a href="tel:+441268777729" style="text-decoration:none;color:inherit;display:flex;align-items:center;justify-content:center;gap:.5rem;width:100%">📞 Call Now — 01268 777729</a>';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#c4a23a;color:#0f0f1a;padding:.85rem;text-align:center;font-weight:700;font-size:1.1rem;z-index:9999;box-shadow:0 -4px 12px rgba(0,0,0,.15);animation:slideUp .3s ease';
  document.head.insertAdjacentHTML('beforeend','<style>@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}body{padding-bottom:70px!important}</style>');
  document.body.appendChild(bar);
})();
