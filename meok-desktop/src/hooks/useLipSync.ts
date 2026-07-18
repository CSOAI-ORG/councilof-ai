/**
 * useLipSync — Audio amplitude analysis for character mouth animation
 *
 * Connects to the audio output from Kokoro TTS via an AudioContext analyser.
 * Returns a mouthOpenness value (0-1) that drives the character's mouth.
 *
 * For basic lip-sync without viseme data — just volume-based mouth movement.
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface LipSyncState {
  mouthOpenness: number;  // 0 = closed, 1 = fully open
  isSpeaking: boolean;
  volume: number;         // Raw RMS volume 0-1
}

export function useLipSync() {
  const [state, setState] = useState<LipSyncState>({
    mouthOpenness: 0,
    isSpeaking: false,
    volume: 0,
  });

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Start monitoring system audio output
  const startMonitoring = useCallback(async () => {
    try {
      // Get audio output stream (requires user gesture on some browsers)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      // Animation loop — analyse audio amplitude
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);

        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += (dataArray[i] / 255) ** 2;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Map to mouth openness (0-1, with smoothing)
        const openness = Math.min(1, rms * 3); // Amplify for visibility
        const isSpeaking = rms > 0.05;

        setState({
          mouthOpenness: openness,
          isSpeaking,
          volume: rms,
        });

        animFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch (e) {
      console.warn("Lip-sync: audio monitoring not available", e);
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    audioCtxRef.current?.close();
    setState({ mouthOpenness: 0, isSpeaking: false, volume: 0 });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
  };
}
