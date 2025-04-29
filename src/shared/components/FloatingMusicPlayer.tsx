import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown } from 'react-feather';
import pokemonCenterMusic from '../../assets/audio/Pokemon_BlueRed _Pokemon_Center.mp3'; // Adjust path if necessary

const FloatingMusicPlayer: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5); // Default volume 50%
    const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
    const audioRef = useRef<HTMLAudioElement>(null);

    // Effect to control play/pause
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(error => console.error("Audio play failed:", error));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Effect to control volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Effect to control mute
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);
    
    // Effect to handle audio ending (optional: stop state or loop)
    useEffect(() => {
        const audioElement = audioRef.current;
        const handleEnded = () => setIsPlaying(false); // Or set loop on audio element

        audioElement?.addEventListener('ended', handleEnded);
        return () => {
            audioElement?.removeEventListener('ended', handleEnded);
        };
    }, []);


    const togglePlayPause = () => {
        // If starting play from collapsed state, expand it
        if (!isPlaying && isCollapsed) {
            setIsCollapsed(false);
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        // Unmute if volume is adjusted while muted
        if (isMuted && newVolume > 0) {
            setIsMuted(false);
        }
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        // Adjust padding and width based on collapsed state
        <div className={`fixed bottom-4 right-4 z-50 bg-gray-800 text-white rounded-lg shadow-lg flex items-center transition-all duration-300 ease-in-out ${isCollapsed ? 'p-2 space-x-1' : 'p-3 space-x-3'} overflow-hidden`}>
            {/* Background Icon - Adjust size/position slightly? */}
            <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 pointer-events-none">
                {/* Inline SVG for Poké Ball Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" 
                     viewBox="0 0 24 24" 
                     fill="currentColor" 
                     className={`transition-opacity duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'} text-gray-500`}>
                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                    <path d="M12 10.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm0 1c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5z"/>
                    <path d="M12 4a1.5 1.5 0 0 0-1.5 1.5v5h3v-5A1.5 1.5 0 0 0 12 4zM4 12a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-1H4v1z"/>
                </svg>
            </div>

            {/* Audio Element - z-index not needed, just part of normal flow */}
            <audio ref={audioRef} src={pokemonCenterMusic} loop />

            {/* Controls */}
            {/* Play/Pause Button (Always visible) */}
            <button 
                onClick={togglePlayPause} 
                className="p-1.5 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 z-10"
                aria-label={isPlaying ? 'Pause music' : 'Play music'}
            >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Mute/Unmute Button (Hidden when collapsed) */}
            {!isCollapsed && (
                <button 
                    onClick={toggleMute} 
                    className="p-1.5 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 z-10 transition-opacity duration-300"
                    aria-label={isMuted ? 'Unmute music' : 'Mute music'}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            )}

            {/* Volume Slider (Hidden when collapsed) */}
            {!isCollapsed && (
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 z-10 transition-opacity duration-300"
                    aria-label="Volume control"
                />
            )}
            
            {/* Collapse/Expand Button (Always visible) */}
            <button 
                onClick={toggleCollapse} 
                className="p-1.5 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 z-10"
                aria-label={isCollapsed ? 'Expand player' : 'Collapse player'}
            >
                {isCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
        </div>
    );
};

export default FloatingMusicPlayer; 