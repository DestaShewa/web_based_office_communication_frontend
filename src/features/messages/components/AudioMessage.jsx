import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Clock, X } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';

import { getFullUrl } from '../utils/statusUtils';

export default function AudioMessage({ url, duration, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const fullUrl = getFullUrl(url);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMetadata = () => setIsLoaded(true);
    const onError = (e) => {
      console.error('Audio play error:', e);
      setError('Could not load audio');
      setIsPlaying(false);
    };

    const updateProgress = () => {
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onMetadata);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', onEnded);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Play failed:', err);
        setError('Playback failed');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (volume > 0) {
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      setVolume(1);
      if (audioRef.current) audioRef.current.volume = 1;
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleSeek = (e) => {
    const newPct = parseFloat(e.target.value);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newPct / 100) * audioRef.current.duration;
      setProgress(newPct);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isSending = !url || url.startsWith('blob:');

  const handleHoverIn = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowVolumeSlider(true);
  };

  const handleHoverOut = () => {
    timeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 400); // 400ms delay to prevent accidental closing
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-red-400 font-bold px-2 py-1 bg-red-50 rounded-lg border border-red-100 italic">
        <X size={14} /> {error}
      </div>
    );
  }

  return (
    <div className={`group/audio flex flex-col gap-2 w-full min-w-[240px] max-w-full p-1.5 ${isMe ? 'text-white' : 'text-primary'}`}>
      <audio ref={audioRef} src={fullUrl} preload="metadata" crossOrigin="anonymous" />
      
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={togglePlay}
          disabled={isSending && !isLoaded}
          className={`p-2.5 rounded-full transition-all shrink-0 active:scale-90 shadow-sm ${
            isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary/5 hover:bg-primary/10 text-primary'
          } ${isSending && !isLoaded ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-[1px]" />}
        </button>
        
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="relative h-6 flex items-center group/seek">
            <WaveformVisualizer 
              streamOrAudio={audioRef.current} 
              color={isMe ? '#ffffff' : '#3b82f6'} 
              isMe={isMe}
              progress={progress}
            />
            {!isSending && (
              <input 
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold opacity-70 tracking-tight">
            <div className="flex items-center gap-1.5 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span className="opacity-40">/</span>
              <span>{formatTime(duration || audioRef.current?.duration)}</span>
              {isSending && <span className="ml-1 text-[9px] font-medium italic opacity-60">(sending...)</span>}
            </div>

            <div 
              className="flex items-center gap-1 sm:gap-2 px-1 rounded-lg transition-all"
              onMouseEnter={handleHoverIn}
              onMouseLeave={handleHoverOut}
            >
               <div className={`overflow-hidden transition-all duration-300 ease-out flex items-center ${showVolumeSlider ? 'w-16 sm:w-20 opacity-100' : 'w-0 opacity-0'}`}>
                 <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 cursor-pointer accent-current"
                 />
               </div>
               
               <div className="flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shrink-0" onClick={toggleMute}>
                 {volume === 0 ? <VolumeX size={14} className="opacity-80" /> : <Volume2 size={14} className="opacity-80" />}
                 <span className="text-[9px] w-6 text-right tabular-nums">{Math.round(volume * 100)}%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
