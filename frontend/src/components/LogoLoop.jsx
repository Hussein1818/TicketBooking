import { useRef } from 'react';

/**
 * LogoLoop - Infinite auto-scrolling logo strip with fade edges.
 * Props:
 *   logos     – array of { name, icon: ReactComponent, color? }
 *   speed     – CSS animation duration in seconds (default 30)
 *   direction – 'left' | 'right' (default 'left')
 *   gap       – gap between items in px (default 48)
 */
export default function LogoLoop({ logos = [], speed = 30, direction = 'left', gap = 48 }) {
  const trackRef = useRef(null);
  // Duplicate logos so the strip loops seamlessly
  const doubled = [...logos, ...logos];

  const animClass = direction === 'right' ? 'animate-logo-scroll-right' : 'animate-logo-scroll-left';

  return (
    <div className="relative w-full overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 z-10 bg-gradient-to-r from-[#111214] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 z-10 bg-gradient-to-l from-[#111214] to-transparent" />

      <div
        ref={trackRef}
        className={`flex items-center ${animClass} hover:[animation-play-state:paused]`}
        style={{
          gap: `${gap}px`,
          animationDuration: `${speed}s`,
          width: 'max-content',
        }}
      >
        {doubled.map((logo, i) => {
          const Icon = logo.icon;
          return (
            <div
              key={i}
              className="flex items-center justify-center shrink-0 h-10 sm:h-40 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 hover:scale-150 transition-all duration-300 cursor-pointer"
              style={{ color: logo.color || '#ffffff' }}
            >
              <Icon style={{ height: 'auto', width: '120px', fill: 'currentColor' }} className="w-16 sm:w-[90px]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
