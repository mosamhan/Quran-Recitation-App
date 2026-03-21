import React, { useRef, useEffect } from 'react';
import './AudioWaveform.css';

/**
 * Real-time audio waveform visualizer using Web Audio API AnalyserNode.
 * Pass an active MediaStream to start visualizing.
 */
const AudioWaveform = ({ stream, isActive }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!stream || !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barWidth = rect.width / bufferLength;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, rect.width, rect.height);

      const centerY = rect.height / 2;

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255;
        const barHeight = val * centerY * 0.9;

        // Gradient from primary to accent color
        const hue = 230 + (val * 60); // blue → purple
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.85)`;

        // Mirror bars: top and bottom from center
        const x = i * barWidth;
        ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);
        ctx.fillRect(x, centerY, barWidth - 1, barHeight);
      }
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stream, isActive]);

  return (
    <div className="audio-waveform-container">
      <canvas ref={canvasRef} className="audio-waveform-canvas" />
    </div>
  );
};

export default AudioWaveform;
