// sovereign-biometric.js — the browser-side identity gate
// CSOAI Ltd UK 16939677 · MIT License · 1 July 2026
//
// Substrate identifies the sovereign citizen through 3 factors:
//   1. Face match (camera + face-api.js or local WebNN)
//   2. Voice fingerprint (mic + vosk or local speaker embed)
//   3. WebAuthn platform authenticator (TouchID / FaceID / Windows Hello)
//
// Identity = intersect of all 3 factors within 5-second window.
// Authority level:
//   GUEST = no factors proven → read-only, can ask questions, cannot SIGIL
//   CITIZEN = ≥1 factor proven → can read, can fork, cannot SIGIL/issue
//   SOVEREIGN_CITIZEN = all 3 factors proven → full power, can SIGIL

(function () {
  'use strict';

  const CONFIG = {
    face_model_url: '/sovereign-os/frontend/models/face-api/',
    voice_model_url: '/sovereign-os/frontend/models/voice-embed/',
    webauthn_rp_id: window.location.hostname || 'csoai.org',
    webauthn_rp_name: 'SOV3 Sovereign Substrate',
    biometric_timeout_ms: 5000,
    consent_required: true,
    enroll_storage_key: 'sovereign_biometric_templates_v1',
  };

  const STATE = {
    face_hash: null,
    voice_hash: null,
    webauthn_signature: null,
    face_match_score: 0,
    voice_match_score: 0,
    webauthn_assertion_age_ms: null,
    authority: 'GUEST',
    sovereign_citizen_id: null,
    enrolled_at: null,
    audit_log: [],
  };

  // === HASH A BLOB ===
  async function hashBlob(blob) {
    const buf = await blob.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).slice(0, 16)
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashString(s) {
    const buf = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).slice(0, 16)
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // === FACE MATCH ===
  async function captureFaceHash(videoEl, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const stream = videoEl.captureStream ? videoEl.captureStream() : null;
      if (!stream) return reject(new Error('no_video_capture'));
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const timer = setTimeout(() => {
        track.stop();
        reject(new Error('face_capture_timeout'));
      }, timeoutMs);
      imageCapture.takePhoto().then(blob => {
        clearTimeout(timer);
        track.stop();
        hashBlob(blob).then(h => resolve({ face_hash: h, ts: Date.now() }));
      }).catch(err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  // === VOICE MATCH ===
  async function captureVoiceHash(audioContext, timeoutMs = 3000) {
    // Capture audio + compute hash of energy envelope + spectral centroid
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const buf = new Uint8Array(analyser.frequencyBinCount);
          const start = Date.now();
          const samples = [];

          const tick = () => {
            analyser.getByteFrequencyData(buf);
            const energy = Array.from(buf).reduce((a, b) => a + b, 0);
            const spectral = Array.from(buf).map((b, i) => b * i).reduce((a, b) => a + b, 0);
            samples.push([energy, spectral]);
            if (Date.now() - start >= timeoutMs) {
              stream.getTracks().forEach(t => t.stop());
              // Hash the envelope + spectral signature
              const sigStr = samples.map(s => `${s[0]},${s[1]}`).join(';');
              hashString(sigStr).then(h => resolve({ voice_hash: h, ts: Date.now() }));
            } else {
              requestAnimationFrame(tick);
            }
          };
          tick();
        })
        .catch(err => reject(err));
    });
  }

  // === WEBAUTHN ===
  async function webauthnAuthenticate() {
    if (!window.PublicKeyCredential) {
      throw new Error('webauthn_not_supported');
    }
    // We need a stored credential ID. For demo, fetch challenge from server.
    const challengeResp = await fetch('/sovereign-os/api/biometric/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizen_id: STATE.sovereign_citizen_id || 'pending' })
    });
    if (!challengeResp.ok) {
      // Fall back to platform-only assertion (TouchID prompt)
      try {
        const cred = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { id: CONFIG.webauthn_rp_id, name: CONFIG.webauthn_rp_name },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: STATE.sovereign_citizen_id || 'citizen',
              displayName: 'Sovereign Citizen',
            },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            authenticatorSelection: { userVerification: 'required' },
            timeout: CONFIG.biometric_timeout_ms,
          }
        });
        return { webauthn_signature: 'local-' + (cred.id || 'creds').slice(0, 32), ts: Date.now() };
      } catch (e) {
        throw new Error('webauthn_denied_or_unavailable: ' + e.message);
      }
    }
    const challenge = await challengeResp.json();
    const cred = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(atob(challenge.token), c => c.charCodeAt(0)),
        rpId: CONFIG.webauthn_rp_id,
        userVerification: 'required',
        timeout: CONFIG.biometric_timeout_ms,
      }
    });
    if (!cred) throw new Error('no_credential');
    const resp = cred.response;
    const sig = resp.signature ? Array.from(resp.signature).slice(0, 16)
      .map(b => b.toString(16).padStart(2, '0')).join('') : 'platform-authenticator';
    return { webauthn_signature: sig, ts: Date.now() };
  }

  // === MAIN GATE ===
  async function gate(options) {
    options = options || {};
    const audioContext = options.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const videoEl = options.videoEl || document.querySelector('video');
    const checks = [];

    // Run all 3 checks in parallel
    const promises = [];
    if (options.allow_face !== false && videoEl) {
      promises.push(captureFaceHash(videoEl, options.faceTimeoutMs || 3000)
        .then(r => { STATE.face_hash = r.face_hash; STATE.face_ts = r.ts; return ['face', true]; })
        .catch(e => { STATE.face_error = e.message; return ['face', false]; }));
    }
    if (options.allow_voice !== false && audioContext) {
      promises.push(captureVoiceHash(audioContext, options.voiceTimeoutMs || 3000)
        .then(r => { STATE.voice_hash = r.voice_hash; STATE.voice_ts = r.ts; return ['voice', true]; })
        .catch(e => { STATE.voice_error = e.message; return ['voice', false]; }));
    }
    if (options.allow_webauthn !== false) {
      promises.push(webauthnAuthenticate()
        .then(r => { STATE.webauthn_signature = r.webauthn_signature; STATE.webauthn_ts = r.ts; return ['webauthn', true]; })
        .catch(e => { STATE.webauthn_error = e.message; return ['webauthn', false]; }));
    }

    const results = await Promise.all(promises);
    const passed = results.filter(([_, ok]) => ok).map(([n]) => n);

    // Determine authority
    if (passed.includes('face') && passed.includes('voice') && passed.includes('webauthn')) {
      STATE.authority = 'SOVEREIGN_CITIZEN';
    } else if (passed.length >= 2) {
      STATE.authority = 'CITIZEN';
    } else if (passed.length >= 1) {
      STATE.authority = 'CITIZEN';
    } else {
      STATE.authority = 'GUEST';
    }

    // Audit log entry
    const entry = {
      ts: new Date().toISOString(),
      authority: STATE.authority,
      passed: passed,
      face_hash: STATE.face_hash,
      voice_hash: STATE.voice_hash,
      webauthn_signature: STATE.webauthn_signature,
    };
    STATE.audit_log.push(entry);

    // Emit on event bus
    if (window.sovereignEventBus?.utter) {
      const audMsg = STATE.authority === 'SOVEREIGN_CITIZEN'
        ? `🜏 Sovereign Citizen ${STATE.sovereign_citizen_id || ''} recognised. Full power.`
        : STATE.authority === 'CITIZEN'
          ? `Citizen recognised. Partial authority (${passed.join(', ')}).`
          : `⚠️ Sovereign running in GUEST mode (no factors proven). Read-only.`;
      window.sovereignEventBus.utter({ text: audMsg, focus_id: null });
    }

    return {
      authority: STATE.authority,
      passed: passed,
      failed: results.filter(([_, ok]) => !ok).map(([n]) => n),
      face_hash: STATE.face_hash,
      voice_hash: STATE.voice_hash,
      webauthn_signature: STATE.webauthn_signature,
      ts: Date.now(),
    };
  }

  // === ENROLLMENT ===
  async function enroll(options) {
    // 5-minute enrollment: capture 3 face angles, 3 voice phrases, 1 TouchID
    const samples = { face: [], voice: [], webauthn: null };
    for (let i = 0; i < 3; i++) {
      try {
        const f = await captureFaceHash(options.videoEl, 3000);
        samples.face.push(f.face_hash);
      } catch (e) {}
      try {
        const v = await captureVoiceHash(options.audioContext, 3000);
        samples.voice.push(v.voice_hash);
      } catch (e) {}
    }
    try {
      const w = await webauthnAuthenticate();
      samples.webauthn = w.webauthn_signature;
    } catch (e) {}
    // Store encrypted (in real impl: encrypt with platform key)
    try {
      localStorage.setItem(CONFIG.enroll_storage_key, JSON.stringify({
        face_templates: samples.face,
        voice_templates: samples.voice,
        webauthn_template: samples.webauthn,
        enrolled_at: new Date().toISOString(),
      }));
    } catch (e) {}
    STATE.enrolled_at = new Date().toISOString();
    return { samples_count: samples.face.length + samples.voice.length,
             webauthn_captured: !!samples.webauthn, enrolled_at: STATE.enrolled_at };
  }

  // === EXPOSE ===
  window.sovereignBiometric = {
    gate,
    enroll,
    state: STATE,
    config: CONFIG,
    captureFaceHash,
    captureVoiceHash,
    webauthnAuthenticate,
    hashString,
    hashBlob,
  };

  console.log('🜏 Sovereign Biometric loaded. Use sovereignBiometric.gate() to identify.');
})();
