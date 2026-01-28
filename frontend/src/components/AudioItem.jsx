import React, { useRef, useEffect, useState, useCallback } from 'react';

const AudioItem = ({ 
  item, 
  isSelected, 
  onSelect, 
  onUpdate, 
  sceneRef 
}) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const { id, audioUrl, x, y, vizType, scale } = item;

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioUrl) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audio.pause();
      audioContext.close();
    };
  }, [audioUrl]);

  // Draw visualization
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.fillStyle = 'rgba(223, 78, 59, 0.1)';
      ctx.fillRect(0, 0, width, height);

      if (vizType === 'waveform') {
        drawWaveform(ctx, dataArray, width, height, bufferLength);
      } else if (vizType === 'bars') {
        drawBars(ctx, dataArray, width, height, bufferLength);
      } else if (vizType === 'spectrum') {
        drawSpectrum(ctx, dataArray, width, height, bufferLength);
      }
    };

    draw();
  }, [isPlaying, vizType]);

  const drawWaveform = (ctx, dataArray, width, height, bufferLength) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const drawBars = (ctx, dataArray, width, height, bufferLength) => {
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;

      ctx.fillStyle = '#000000';
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
      if (x > width) break;
    }
  };

  const drawSpectrum = (ctx, dataArray, width, height, bufferLength) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 10;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * Math.PI * 2;
      const amplitude = dataArray[i] / 255;
      const radius = maxRadius * 0.3 + maxRadius * 0.7 * amplitude;

      const x1 = centerX + Math.cos(angle) * maxRadius * 0.3;
      const y1 = centerY + Math.sin(angle) * maxRadius * 0.3;
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
  };

  useEffect(() => {
    drawVisualization();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawVisualization]);

  const togglePlay = () => {
    const audio = audioRef.current;
    const audioContext = audioContextRef.current;
    
    if (!audio || !audioContext) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    onSelect(id);
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleTouchStart = (e) => {
    if (e.target.tagName === 'BUTTON') return;
    
    onSelect(id);
    setIsDragging(true);

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!sceneRef.current) return;

      const sceneRect = sceneRef.current.getBoundingClientRect();
      const itemWidth = 200 * (scale / 100);
      const itemHeight = 200 * (scale / 100);

      let newX = e.clientX - sceneRect.left - dragOffset.x;
      let newY = e.clientY - sceneRect.top - dragOffset.y;

      // Constrain to scene bounds
      newX = Math.max(0, Math.min(newX, sceneRect.width - itemWidth));
      newY = Math.max(0, Math.min(newY, sceneRect.height - itemHeight));

      onUpdate(id, { x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!sceneRef.current) return;

      const touch = e.touches[0];
      const sceneRect = sceneRef.current.getBoundingClientRect();
      const itemWidth = 200 * (scale / 100);
      const itemHeight = 200 * (scale / 100);

      let newX = touch.clientX - sceneRect.left - dragOffset.x;
      let newY = touch.clientY - sceneRect.top - dragOffset.y;

      newX = Math.max(0, Math.min(newX, sceneRect.width - itemWidth));
      newY = Math.max(0, Math.min(newY, sceneRect.height - itemHeight));

      onUpdate(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, id, onUpdate, scale, sceneRef]);

  const size = 200 * (scale / 100);

  return (
    <div
      className={`absolute cursor-grab no-select ${isDragging ? 'cursor-grabbing' : ''} ${isSelected ? 'selected-item' : ''}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      <div className="relative w-full h-full bg-noise-orange/20 border-2 border-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="w-full h-full"
        />
        
        {/* Play/Pause button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute bottom-2 right-2 w-10 h-10 bg-black border border-white text-white flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default AudioItem;
