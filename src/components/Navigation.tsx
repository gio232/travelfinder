import React from 'react';
import { Plane, Compass } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="border-b border-border py-4 px-6 md:px-12 flex justify-between items-center bg-surface relative z-10">
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-brand" />
        <span className="font-bold text-lg tracking-tight">VOYAGER BOT</span>
      </div>
      <div className="hidden md:flex gap-8 text-[14px] font-medium text-subtle">
        <a href="#" className="hover:text-brand font-bold text-brand transition-colors">Daily Selections</a>
        <a href="#custom" className="hover:text-brand transition-colors">Custom Search</a>
        <a href="#analytics" className="hover:text-brand transition-colors">Price Alerts</a>
      </div>
      <button className="text-[14px] font-semibold border border-border bg-surface rounded-xl px-4 py-2 hover:bg-brand hover:text-white transition-all text-subtle hover:border-transparent">
        Settings
      </button>
    </nav>
  );
}
