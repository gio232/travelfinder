import React, { useState } from 'react';
import { Search, Calendar, MapPin, Stars } from 'lucide-react';

interface SearchFormProps {
  onSearch: (origin: string, destination: string, dates: string, preferences: string) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [origin, setOrigin] = useState('Budapest');
  const [destination, setDestination] = useState('Kuala Lumpur');
  const [dates, setDates] = useState('Next Month');
  const [preferences, setPreferences] = useState('4-star hotel minimum, direct flight preferred if possible');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(origin, destination, dates, preferences);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-4 relative z-10">
      <div className="flex-1 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
        <label className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1 block">Origin City</label>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-subtle" />
          <input 
            type="text" 
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-transparent outline-none text-[14px] font-medium text-ink focus:text-brand transition-colors"
            placeholder="e.g. Paris"
          />
        </div>
      </div>
      
      <div className="flex-1 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 px-0 md:px-4">
        <label className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1 block">Destination</label>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-subtle" />
          <input 
            type="text" 
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-transparent outline-none text-[14px] font-medium text-ink focus:text-brand transition-colors"
            placeholder="e.g. Turkey, Egypt"
          />
        </div>
      </div>
      
      <div className="flex-1 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 px-0 md:px-4">
        <label className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1 block">Dates</label>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-subtle" />
          <input 
            type="text" 
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            className="w-full bg-transparent outline-none text-[14px] font-medium text-ink focus:text-brand transition-colors"
            placeholder="Dates or season"
          />
        </div>
      </div>

      <div className="flex-1 px-0 md:px-4 pb-4 md:pb-0 flex flex-col justify-center">
         <label className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1 block">Preferences</label>
         <div className="flex items-center gap-2">
           <Stars className="w-4 h-4 text-subtle" />
           <input 
             type="text" 
             value={preferences}
             onChange={(e) => setPreferences(e.target.value)}
             className="w-full bg-transparent outline-none text-[14px] font-medium text-ink focus:text-brand transition-colors"
             placeholder="Filters e.g. 4-stars"
           />
         </div>
      </div>
      
      <div className="flex items-center">
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full md:w-auto bg-brand text-white hover:opacity-90 transition-opacity rounded-xl px-6 py-3 flex items-center justify-center gap-2 font-semibold text-[14px]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
}
