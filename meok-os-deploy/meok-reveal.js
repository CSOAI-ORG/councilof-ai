/* ════════════════════════════════════════════════════════════════════════════
   meok-reveal.js — ONE shared visual-polish include for every MEOK page.
   Drops in with <script defer src="/meok-reveal.js"></script>. Self-mounting:
     • injects the iridescent-glass design tokens + a scroll-reveal system
     • fades sections/cards/headings up as they scroll into view (the scroll-world feel)
     • SAFE: a failsafe reveals everything after 1.5s and it no-ops on reduced-motion,
       missing IntersectionObserver, or the 3D app pages — content can never get stuck hidden.
   ════════════════════════════════════════════════════════════════════════════ */
(function(){
  try{
    // never touch the live 3D apps / the scroll-world (they own their own motion)
    var skip=/\b(index|character|sovspace3d|world|earth3d)\b/i;
    var path=(location.pathname||'').toLowerCase();
    if(skip.test(path) || document.documentElement.hasAttribute('data-no-reveal')) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1) shared polish tokens + glass + reveal CSS (namespaced, additive — won't fight page CSS)
    var css = document.createElement('style'); css.id='meok-reveal-css';
    css.textContent =
      ':root{--mk-gold:#c9a84c;--mk-mint:#8fd0c0;--mk-lilac:#c7a8e0;}'
    + '.mk-rv{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);will-change:opacity,transform}'
    + '.mk-rv.mk-in{opacity:1;transform:none}'
    + '.mk-rv:nth-child(2){transition-delay:.06s}.mk-rv:nth-child(3){transition-delay:.12s}.mk-rv:nth-child(4){transition-delay:.18s}.mk-rv:nth-child(5){transition-delay:.24s}'
    // a reusable iridescent top-edge any card can opt into with class mk-irid
    + '.mk-irid{position:relative}.mk-irid::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;border-radius:inherit;background:linear-gradient(90deg,transparent,var(--mk-gold),var(--mk-mint),var(--mk-lilac),transparent);opacity:.55;pointer-events:none}';
    document.head.appendChild(css);
    if(reduce) return;  // tokens applied, but no motion

    function run(){
      // 2) pick sensible reveal targets — direct children of main content, cards, headings, sections
      var sel = 'section, article, .card, .win, .panel, .tile, .metric, .arch, .kv, h1, h2, h3, .cta, .row, .chip-row, figure, .block, .feature';
      var seen = new Set(); var els = [];
      document.querySelectorAll(sel).forEach(function(el){
        if(seen.has(el)) return;
        // skip fixed/sticky chrome, tiny inline bits, and anything already animating
        var cs = getComputedStyle(el);
        if(cs.position==='fixed' || cs.position==='sticky') return;
        if(el.closest('#cards,.sovdock,#sovbottombar,nav,header')) return;
        if(el.offsetHeight < 8) return;
        seen.add(el); els.push(el);
      });
      els = els.slice(0, 120);   // bound the work
      els.forEach(function(el){ el.classList.add('mk-rv'); });

      // 3) reveal on scroll-into-view
      var revealAll = function(){ els.forEach(function(el){ el.classList.add('mk-in'); }); };
      if(!('IntersectionObserver' in window)){ revealAll(); return; }
      var io = new IntersectionObserver(function(ents){
        ents.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('mk-in'); io.unobserve(e.target); } });
      }, { rootMargin:'0px 0px -8% 0px', threshold:0.06 });
      els.forEach(function(el){ io.observe(el); });
      // anything already in the viewport on load → reveal immediately (no flash)
      requestAnimationFrame(function(){ els.forEach(function(el){ var r=el.getBoundingClientRect(); if(r.top < innerHeight*0.92) el.classList.add('mk-in'); }); });
      // FAILSAFE: whatever the observer misses, show it after 1.5s — content never sticks hidden
      setTimeout(revealAll, 1500);
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run); else run();
  }catch(e){ /* on any error, do nothing → page renders normally */ }
})();
