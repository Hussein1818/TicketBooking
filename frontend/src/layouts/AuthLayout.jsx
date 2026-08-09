import { ArrowLeft } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#09090b] text-white font-sans overflow-hidden">
      {/* Radiating Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, transparent, #09090b 80%),
            conic-gradient(from 180deg at 50% 0%, 
              rgba(45, 212, 191, 0.4) 0deg, 
              transparent 2deg, 
              transparent 15deg, 
              rgba(45, 212, 191, 0.2) 20deg, 
              transparent 25deg, 
              transparent 45deg, 
              rgba(45, 212, 191, 0.1) 60deg, 
              transparent 65deg, 
              transparent 115deg, 
              rgba(45, 212, 191, 0.1) 120deg, 
              transparent 135deg, 
              transparent 155deg, 
              rgba(45, 212, 191, 0.2) 160deg, 
              transparent 165deg, 
              transparent 345deg, 
              rgba(45, 212, 191, 0.4) 360deg
            )
          `
        }}
      ></div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-5xl px-4 md:px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full flex flex-col items-center"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
