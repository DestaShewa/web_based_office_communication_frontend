import React, { useRef, useEffect } from 'react';

/**
 * WaveformVisualizer - A premium Canvas-based waveform component
 * @param {HTMLAudioElement | MediaStream} streamOrAudio - The source to visualize
 * @param {boolean} isRecording - Whether we are in recording mode (live)
 * @param {string} color - The primary color for the bars
 * @param {number} barWidth - Width of each bar
 * @param {number} gap - Gap between bars
 */
export default function WaveformVisualizer({ 
  streamOrAudio, 
  isRecording = false, 
  color = '#3b82f6', 
  barWidth = 3, 
  gap = 2 
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyzerRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    if (!streamOrAudio) return;

    // Initialize Audio Context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 256;
    
    let source;
    if (isRecording) {
      source = audioCtx.createMediaStreamSource(streamOrAudio);
    } else {
      source = audioCtx.createMediaElementSource(streamOrAudio);
    }

    source.connect(analyzer);
    if (!isRecording) {
      analyzer.connect(audioCtx.destination);
    }

    analyzerRef.current = analyzer;
    contextRef.current = audioCtx;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current || !analyzerRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const analyzer = analyzerRef.current;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Sync internal resolution with display size
      if (canvas.width !== canvas.clientWidth) {
        canvas.width = canvas.clientWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
      analyzer.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const count = Math.floor(canvas.width / (barWidth + gap));
      const step = Math.max(1, Math.floor(bufferLength / count));

      for (let i = 0; i < count; i++) {
        const value = dataArray[i * step];
        const percent = value / 255;
        const height = canvas.height * percent * 0.8;
        
        ctx.fillStyle = color;
        // Draw symmetrical bars from center
        const y = (canvas.height - height) / 2;
        
        // Rounded corners for bars
        ctx.beginPath();
        ctx.roundRect(i * (barWidth + gap), y, barWidth, height, barWidth / 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (source) source.disconnect();
      if (analyzer) analyzer.disconnect();
      if (audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [streamOrAudio, isRecording]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-8 md:h-12 rounded-lg opacity-80"
      height={48}
    />
  );
}
