import { motion } from 'framer-motion';

export default function EventCard({ image, location, date, status, title, description, price }) {
  return (
    <motion.article 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-[#16171a] border border-white/5 transition-all hover:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-t from-[#16171a] via-transparent to-transparent z-10" />
        <img 
          src={image} 
          alt={title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-[#5c6870] uppercase">
            {location} / {date}
          </p>
          {status && (
            <span className={`rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
              status === 'LOCKED' ? 'bg-zinc-800 text-teal-500' :
              status === 'LIMITED' ? 'bg-amber-500/10 text-amber-500' :
              status === 'TRENDING' ? 'bg-teal-500/10 text-teal-400' : 'bg-white/10 text-white'
            }`}>
              {status}
            </span>
          )}
        </div>
        
        <h3 className="mb-2 text-lg font-medium text-white">{title}</h3>
        <p className="mb-6 line-clamp-2 text-xs text-zinc-400">
          {description}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-sm font-bold text-white">{price}</p>
          <button className="text-xs font-bold text-teal-400 transition-colors hover:text-teal-300">
            Book Now
          </button>
        </div>
      </div>
    </motion.article>
  );
}
