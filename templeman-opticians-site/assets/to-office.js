/* Templeman Opticians — AI Office widget (NetworkNick product, king-first install #2).
   Self-contained: injects its own styles. Never breaks the host page. */
(function () {
  'use strict';
  var TEL = '+441268777729', TEL_DISPLAY = '01268 777729';
  var WA = 'https://wa.me/447377799306';

  var services = [
    { k: '👁 Book a home eye test', a: '<b>We come to you</b> — NHS-funded if you qualify (over 60 with mobility issues, or housebound), otherwise private from a fixed price. Most visits booked within days, across Essex &amp; Suffolk.', link: '/book-home-test', linkText: 'Book online in 2 minutes' },
    { k: '💷 Am I eligible for a free NHS test?', a: 'If you (or the person you care for) are <b>unable to leave home unaccompanied</b> due to physical or mental health, the NHS covers the sight test at home. We check eligibility for you — no forms, just tell us the situation.', link: '/nhs-eligibility', linkText: 'Check NHS eligibility' },
    { k: '🏠 Care home visits', a: 'We look after <b>whole care homes</b>: scheduled visit days, records kept for CQC, spectacles labelled and fitted, and free repairs between visits. Managers: one message sets it up.', link: '/care-homes', linkText: 'Care home service' },
    { k: '🔧 Glasses repairs & adjustments', a: 'Broken arm, lost screw, bent frame? <b>Bring them in or ask on WhatsApp</b> — small repairs are usually free while you wait, and we can often repair during home visits too.' },
    { k: '🕐 Opening hours & contact', a: '<b>Mon–Fri 9:00–17:00.</b> Phone ' + TEL_DISPLAY + ' — you reach the family, not a call centre. Home visits across Essex &amp; Suffolk.' }
  ];

  var css = '' +
    '#to-chat-btn{position:fixed;right:20px;bottom:20px;z-index:9990;display:flex;align-items:center;gap:8px;' +
    'background:#0F172A;color:#fff;border:none;border-radius:99px;padding:14px 20px;' +
    'font:700 .9rem/1 Inter,-apple-system,Arial,sans-serif;cursor:pointer;box-shadow:0 12px 30px rgba(15,23,42,.35);transition:transform .15s}' +
    '#to-chat-btn:hover{transform:translateY(-2px)}' +
    '#to-chat-btn .to-dot{width:8px;height:8px;border-radius:50%;background:#c4a23a}' +
    '#to-chat{position:fixed;right:20px;bottom:80px;z-index:9991;width:min(360px,calc(100vw - 40px));' +
    'background:#fff;border:1px solid #E2E8F0;border-radius:18px;overflow:hidden;display:none;' +
    'box-shadow:0 30px 70px rgba(15,23,42,.28);font-family:Inter,-apple-system,Arial,sans-serif}' +
    '#to-chat.to-open{display:block}' +
    '#to-chat .to-head{background:#0F172A;color:#fff;padding:16px 18px;display:flex;justify-content:space-between;align-items:center}' +
    '#to-chat .to-head b{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.1rem}' +
    '#to-chat .to-head small{display:block;font-size:.72rem;color:#d8c98e;font-weight:600}' +
    '#to-chat .to-close{background:rgba(255,255,255,.12);border:none;color:#cbd5e1;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1}' +
    '#to-chat .to-body{padding:16px 18px 18px}' +
    '#to-chat .to-q{font-size:.9rem;font-weight:600;color:#0F172A;margin:0 0 11px}' +
    '#to-chat .to-opt{display:block;width:100%;text-align:left;background:#F8FAFC;color:#0F172A;border:1px solid #E2E8F0;' +
    'border-radius:11px;padding:12px 14px;margin-bottom:8px;font:600 .87rem/1.35 Inter,Arial,sans-serif;cursor:pointer;transition:border-color .15s,transform .15s}' +
    '#to-chat .to-opt:hover{border-color:#c4a23a;transform:translateX(3px)}' +
    '#to-chat .to-ans{background:#FBF7EA;border-left:3px solid #c4a23a;border-radius:9px;padding:12px 14px;' +
    'font:400 .87rem/1.6 Inter,Arial,sans-serif;color:#334155;margin:0 0 12px}' +
    '#to-chat .to-ans b{color:#0F172A}' +
    '#to-chat .to-row{display:flex;gap:8px;flex-wrap:wrap}' +
    '#to-chat .to-cta{flex:1;text-align:center;font:700 .82rem/1 Inter,Arial,sans-serif;padding:12px 10px;border-radius:9px;text-decoration:none}' +
    '#to-chat .to-cta.wa{background:#25D366;color:#fff}' +
    '#to-chat .to-cta.tel{background:#0F172A;color:#fff}' +
    '#to-chat .to-cta.link{background:#fff;color:#0F172A;border:1.5px solid #E2E8F0}' +
    '#to-chat .to-back{background:none;border:none;color:#64748B;font:600 .78rem/1 Inter,Arial,sans-serif;cursor:pointer;margin-top:10px}';

  function boot() {
    try {
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      var btn = document.createElement('button');
      btn.id = 'to-chat-btn'; btn.type = 'button';
      btn.innerHTML = '<span class="to-dot"></span>👁 Book a home visit';
      var panel = document.createElement('div');
      panel.id = 'to-chat'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Booking assistant');
      document.body.appendChild(btn); document.body.appendChild(panel);

      function home() {
        panel.innerHTML =
          '<div class="to-head"><div><b>Templeman Opticians</b><small>Family opticians · answers in seconds</small></div><button class="to-close" aria-label="Close">×</button></div>' +
          '<div class="to-body"><p class="to-q">What can we help with?</p>' +
          services.map(function (s, i) { return '<button class="to-opt" data-i="' + i + '">' + s.k + '</button>'; }).join('') +
          '</div>';
      }
      function answer(i) {
        var s = services[i];
        var msg = encodeURIComponent('Hi Templeman Opticians — ' + s.k.replace(/^[^\s]+\s/, '') + '. ');
        panel.innerHTML =
          '<div class="to-head"><div><b>' + s.k.replace(/^[^\s]+\s/, '') + '</b><small>Templeman Opticians</small></div><button class="to-close" aria-label="Close">×</button></div>' +
          '<div class="to-body"><div class="to-ans">' + s.a + '</div>' +
          '<div class="to-row">' +
          (s.link ? '<a class="to-cta link" href="' + s.link + '">' + s.linkText + '</a>' : '') +
          '<a class="to-cta wa" href="' + WA + '?text=' + msg + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="to-cta tel" href="tel:' + TEL + '">Call us</a>' +
          '</div><button class="to-back">← other questions</button></div>';
      }
      btn.addEventListener('click', function () { panel.classList.toggle('to-open'); if (panel.classList.contains('to-open')) home(); });
      panel.addEventListener('click', function (e) {
        var t = e.target;
        if (t.classList.contains('to-close')) panel.classList.remove('to-open');
        else if (t.classList.contains('to-opt')) answer(+t.getAttribute('data-i'));
        else if (t.classList.contains('to-back')) home();
      });
    } catch (e) { /* never break the host page */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
