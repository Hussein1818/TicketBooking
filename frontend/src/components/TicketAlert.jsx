import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X, MessageSquareText } from 'lucide-react';
import useAlertStore from '../store/useAlertStore';

export default function TicketAlert() {
  const { 
    isOpen, title, message, type, isPrompt, promptValue, 
    setPromptValue, submitPrompt, hideAlert 
  } = useAlertStore();

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (isPrompt && inputRef.current) {
        // Focus the input when the prompt opens
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (!isPrompt && (type === 'success' || type === 'info')) {
        // Auto close alerts (but not prompts) after 5 seconds
        const timer = setTimeout(() => {
          hideAlert();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, type, isPrompt, hideAlert]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isPrompt) {
      submitPrompt();
    } else if (e.key === 'Escape') {
      hideAlert();
    }
  };

  const getIcon = () => {
    if (isPrompt) return <MessageSquareText className="w-10 h-10 text-[#00D5BE]" />;
    switch (type) {
      case 'success': return <CheckCircle className="w-10 h-10 text-[#00D5BE]" />;
      case 'error': return <XCircle className="w-10 h-10 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-10 h-10 text-amber-500" />;
      default: return <Info className="w-10 h-10 text-blue-400" />;
    }
  };

  const getTypeText = () => {
    if (isPrompt) return 'INPUT';
    switch (type) {
      case 'success': return 'SUCCESS';
      case 'error': return 'ERROR';
      case 'warning': return 'WARNING';
      default: return 'NOTICE';
    }
  };

  const getTextColor = () => {
    if (isPrompt) return 'text-[#00D5BE]';
    switch (type) {
      case 'success': return 'text-[#00D5BE]';
      case 'error': return 'text-rose-500';
      case 'warning': return 'text-amber-500';
      default: return 'text-blue-400';
    }
  };

  const getGlowColor = () => {
    if (isPrompt) return 'rgba(0, 213, 190, 0.2)';
    switch (type) {
      case 'success': return 'rgba(0, 213, 190, 0.2)';
      case 'error': return 'rgba(244, 63, 94, 0.2)';
      case 'warning': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(96, 165, 250, 0.2)';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hideAlert}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
            className="relative w-full max-w-lg flex"
            style={{
              filter: `drop-shadow(0 0 20px ${getGlowColor()})`
            }}
          >
            {/* Dashed Line */}
            <div className="absolute top-2 bottom-2 right-28 w-[2px] border-l-[2px] border-dashed border-zinc-800/80 z-20 pointer-events-none" />

            {/* Left side (Main content) */}
            <div 
              className="flex-1 p-6 relative flex flex-col justify-center min-h-[160px] bg-[#16171a] rounded-l-2xl border border-r-0 border-white/10"
              style={{
                maskImage: "radial-gradient(circle at right, transparent 14px, black 15px)",
                maskPosition: "right",
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
                WebkitMaskImage: "radial-gradient(circle at right, transparent 14px, black 15px)",
              }}
            >
              <button 
                onClick={hideAlert}
                className="absolute top-4 right-6 text-zinc-500 hover:text-white transition-colors z-30"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1 drop-shadow-md">
                  {getIcon()}
                </div>
                <div className="flex-1 pr-6 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-white mb-2 leading-tight tracking-tight">
                    {title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    {message}
                  </p>
                  
                  {isPrompt && (
                    <div className="w-full relative mt-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type here..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D5BE]/50 focus:ring-1 focus:ring-[#00D5BE]/50 transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side (Stub) */}
            <div 
              className="w-28 p-4 relative flex flex-col items-center justify-between bg-[#16171a] rounded-r-2xl border border-l-0 border-white/10"
              style={{
                maskImage: "radial-gradient(circle at left, transparent 14px, black 15px)",
                maskPosition: "left",
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
                WebkitMaskImage: "radial-gradient(circle at left, transparent 14px, black 15px)",
              }}
            >
              <div className={`mt-4 -rotate-90 tracking-[0.2em] font-black text-lg opacity-30 uppercase whitespace-nowrap ${getTextColor()}`}>
                {getTypeText()}
              </div>
              
              <div className="flex flex-col gap-2 mt-12 mb-2 w-full px-2">
                {isPrompt && (
                  <button 
                    onClick={hideAlert}
                    className="w-full h-10 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                  >
                    <span className="text-xs font-bold">CANCEL</span>
                  </button>
                )}
                <button 
                  onClick={isPrompt ? submitPrompt : hideAlert}
                  className={`w-full h-10 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 border border-white/10 ${getTextColor()}`}
                >
                  <span className="text-xs font-bold">OK</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
