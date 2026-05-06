import React from 'react';
import type { TourPackage } from '../lib/gemini';
import { Plane, Hotel, Car, CheckCircle2, Map } from 'lucide-react';
import { motion } from 'motion/react';

export function TourCard({ pkg, delay = 0 }: { pkg: TourPackage, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface rounded-2xl overflow-hidden flex flex-col h-full border border-border"
    >
      <div className="relative h-32 bg-brand flex items-center justify-center overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-brand"></div>
        <div className="relative z-10 text-center px-4 self-end pb-6 w-full text-left pl-6">
          <h2 className="font-bold text-2xl text-white tracking-tight mb-1">{pkg.destination.city}</h2>
          <p className="text-white/80 uppercase tracking-widest text-[10px] font-bold">{pkg.destination.country}</p>
        </div>
        
        {/* Badge */}
        <div className="absolute top-4 left-4 bg-success text-white px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold">
          {pkg.category}
        </div>
      </div>
      
      <div className="flex-1 p-5 flex flex-col">
        <p className="text-[13px] text-subtle leading-relaxed mb-6 flex-1">
          {pkg.destination.description}
        </p>
        
        <div className="space-y-4 mb-6 relative">
          <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border"></div>
          
          <div className="flex items-start gap-4 relative">
             <div className="w-6 h-6 rounded-full bg-paper flex items-center justify-center z-10 shrink-0 border border-border">
               <Plane className="w-3 h-3 text-subtle" />
             </div>
             <div>
               <p className="text-[10px] uppercase text-muted tracking-wider font-bold">Flights</p>
               <p className="text-[14px] font-medium text-ink">{pkg.flights.airline} • {pkg.flights.duration}</p>
               <p className="text-[12px] text-subtle mt-0.5">from {pkg.flights.origin} • €{pkg.flights.price}</p>
             </div>
          </div>

          <div className="flex items-start gap-4 relative">
             <div className="w-6 h-6 rounded-full bg-paper flex items-center justify-center z-10 shrink-0 border border-border">
               <Hotel className="w-3 h-3 text-subtle" />
             </div>
             <div>
               <p className="text-[10px] uppercase text-muted tracking-wider font-bold">Accommodation</p>
               <div className="flex items-center gap-1">
                 <p className="text-[14px] font-medium text-ink">{pkg.accommodation.name}</p>
                 <span className="text-[10px] text-brand font-bold tracking-widest uppercase">
                   {'★'.repeat(pkg.accommodation.stars)}
                 </span>
               </div>
               <p className="text-[12px] text-subtle mt-0.5">€{pkg.accommodation.pricePerNight} / night</p>
             </div>
          </div>
          
          <div className="flex items-start gap-4 relative">
             <div className="w-6 h-6 rounded-full bg-paper flex items-center justify-center z-10 shrink-0 border border-border">
               <Car className="w-3 h-3 text-subtle" />
             </div>
             <div>
               <p className="text-[10px] uppercase text-muted tracking-wider font-bold">Transfers</p>
               <p className="text-[14px] font-medium text-ink">{pkg.transfers.type}</p>
             </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex items-end justify-between mt-auto">
           <div>
             <p className="text-[10px] uppercase text-muted tracking-wider font-bold mb-1">Total Package</p>
             <p className="flex items-baseline gap-1 text-[20px] font-extrabold tracking-tight text-brand">
               <span className="text-[14px] font-medium text-subtle">€</span>
               {pkg.totalPrice}
             </p>
           </div>
           <button className="bg-brand text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-opacity">
             Request Info
           </button>
        </div>
      </div>
    </motion.div>
  );
}
