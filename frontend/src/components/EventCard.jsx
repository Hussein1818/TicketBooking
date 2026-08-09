export default function EventCard({ image, location, date, status, title, description, price }) {
  return (
    <article 
      className="group relative w-full h-[220px] sm:h-[380px] md:h-[400px] cursor-pointer overflow-hidden rounded-xl sm:rounded-[20px] bg-zinc-900 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
    >
      {/* Background Image */}
      <img 
        src={image} 
        alt={title} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-95" />

      {status && (
        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20">
          <span className={`rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold tracking-widest uppercase shadow-md ${
            status === 'LOCKED' ? 'bg-[#14B8A6]/20 text-teal-300 border border-teal-400/30 backdrop-blur-md' :
            status === 'LIMITED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md' :
            status === 'TRENDING' ? 'bg-gradient-to-r from-[#14B8A6]/80 to-[#0F766E]/80 text-white backdrop-blur-md' : 'bg-black/40 text-white border border-white/20 backdrop-blur-md'
          }`}>
            {status}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-3.5 sm:p-6 md:p-8">
        <p className="text-[8px] sm:text-[10px] md:text-[11px] font-bold tracking-widest text-[#90D3B6] uppercase mb-1 drop-shadow-sm">
          {location || 'EVENT'}
        </p>
        
        <h3 className="text-sm sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight drop-shadow-md line-clamp-2">
          {title}
        </h3>

        {/* Keeping event info subtle so it doesn't break the design */}
        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 mb-2 sm:mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
           <span className="text-[10px] sm:text-xs text-zinc-300 font-medium">{date}</span>
           <span className="w-1 h-1 rounded-full bg-zinc-500" />
           <span className="text-[10px] sm:text-xs font-bold text-white">{price}</span>
        </div>
        
        <div className="mt-1 text-[11px] sm:text-sm font-bold text-[#90D3B6] group-hover:text-teal-300 transition-colors flex items-center gap-1 drop-shadow-sm">
          Explore <span className="text-base sm:text-lg leading-none transition-transform group-hover:translate-x-1">&rsaquo;</span>
        </div>
      </div>
    </article>
  );
}
