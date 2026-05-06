/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { SearchForm } from './components/SearchForm';
import { TourCard } from './components/TourCard';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { generateDailySelections, generateCustomTour, type TourPackage } from './lib/gemini';
import { Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [dailyPicks, setDailyPicks] = useState<TourPackage[]>([]);
  const [customSearch, setCustomSearch] = useState<TourPackage | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDailyPicks() {
      try {
        const topCities = ['Berlin', 'Paris', 'London'];
        const picks = await generateDailySelections(topCities);
        setDailyPicks(picks);
      } catch (err) {
        console.error("Error fetching daily picks:", err);
      } finally {
        setIsLoadingDaily(false);
      }
    }
    
    fetchDailyPicks();
  }, []);

  const handleSearch = async (origin: string, destination: string, dates: string, preferences: string) => {
    setIsSearching(true);
    setCustomSearch(null); // Clear previous
    setError(null);
    try {
      const result = await generateCustomTour(origin, destination, dates, preferences);
      setCustomSearch(result);
      
      // Scroll to custom search result beautifully
      window.scrollTo({
        top: window.innerHeight * 0.8,
        behavior: "smooth"
      });
    } catch (err) {
      console.error(err);
      setError("Failed to generate custom tour. Our AI might be busy, please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 relative overflow-x-hidden pt-8">
      <div className="max-w-[1024px] mx-auto px-6 flex flex-col min-h-screen bg-paper">
      
        <Navigation />

        {/* Hero Section */}
        <main className="mt-16 md:mt-24 w-full mx-auto relative z-10 flex flex-col gap-12">
          
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface text-subtle rounded-full text-[12px] font-medium mb-6 border border-border shadow-sm">
              <Globe2 className="w-3 h-3 text-muted" />
              📍 Flights from: Budapest (BUD)
            </div>
            <h1 className="font-bold text-4xl md:text-5xl tracking-tight text-brand mb-4">
              Seasonal Picks
            </h1>
            <p className="text-subtle max-w-2xl mx-auto text-[14px]">
              Based on current European climate trends & pricing analytics.
            </p>
          </div>

          <SearchForm onSearch={handleSearch} isLoading={isSearching} />

          {error && (
            <div className="mt-4 bg-danger/10 text-danger p-4 rounded-xl text-center max-w-4xl mx-auto text-[14px] font-medium border border-danger/20">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {customSearch && (
              <motion.div 
                key="custom-search" 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-12 border-t border-border pt-16"
              >
                <div className="text-center mb-12">
                  <h2 className="font-bold text-3xl tracking-tight text-brand mb-2">Your Tailored Escape</h2>
                  <p className="text-muted text-[11px] uppercase tracking-widest font-bold">Custom AI Generated Itinerary</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4">
                    <TourCard pkg={customSearch} />
                  </div>
                  <div className="lg:col-span-8">
                    <AnalyticsPanel pkg={customSearch} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daily Selections */}
          {dailyPicks.length > 0 && !customSearch && (
            <div className="mt-12">
              <div className="flex items-end justify-between mb-8 pb-4">
                <div>
                  <h2 className="font-bold text-2xl tracking-tight text-brand mb-1">Today's Smart Picks</h2>
                  <p className="text-muted text-[11px] uppercase tracking-widest font-bold">Curated from major European hubs</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {dailyPicks.map((pkg, idx) => (
                  <TourCard key={pkg.id} pkg={pkg} delay={idx * 0.15} />
                ))}
              </div>
            </div>
          )}
          
          {/* Loading skeleton for daily picks */}
          {isLoadingDaily && (
            <div className="mt-12">
                <div className="h-8 bg-surface w-64 rounded-md mb-2 animate-pulse border border-border"></div>
                <div className="h-3 bg-surface w-48 rounded-md mb-10 animate-pulse border border-border pb-4"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-surface rounded-2xl h-80 border border-border animate-pulse">
                      <div className="h-32 bg-border rounded-t-2xl"></div>
                    </div>
                  ))}
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

