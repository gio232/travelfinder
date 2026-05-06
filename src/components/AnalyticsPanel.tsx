import React from 'react';
import type { TourPackage } from '../lib/gemini';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

export function AnalyticsPanel({ pkg }: { pkg: TourPackage }) {
  const isRising = pkg.analytics.demandTrend === 'Rising';
  const isDecreasing = pkg.analytics.demandTrend === 'Decreasing';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl p-6 border border-border mt-8 flex flex-col gap-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-brand" />
        <h3 className="font-bold text-xl tracking-tight text-brand">Market Analytics</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="space-y-1 block border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
          <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Profitability Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold text-brand">{pkg.analytics.profitabilityScore}</span>
            <span className="text-[12px] text-subtle">/ 100</span>
          </div>
          <div className="w-full bg-paper rounded-sm h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-brand h-full rounded-sm" 
              style={{ width: `${pkg.analytics.profitabilityScore}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="space-y-1 block border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 md:pl-6">
          <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Price Increase Probability</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[24px] font-bold text-brand">{pkg.analytics.priceIncreaseProbability}%</span>
            {pkg.analytics.priceIncreaseProbability > 60 && (
              <span className="text-danger text-[12px] font-semibold">High Risk</span>
            )}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="space-y-1 block pb-4 md:pb-0 md:pl-6">
          <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Demand Trend</p>
          <div className="flex items-center gap-2 mt-2">
            {isRising && <span className="text-success text-[12px] font-semibold tracking-wide flex items-center gap-1"><TrendingUp className="w-4 h-4"/> RISING</span>}
            {isDecreasing && <span className="text-danger text-[12px] font-semibold tracking-wide flex items-center gap-1"><TrendingDown className="w-4 h-4"/> DECREASING</span>}
            {!isRising && !isDecreasing && <span className="text-warning text-[#F59E0B] text-[12px] font-semibold tracking-wide flex items-center gap-1"><Minus className="w-4 h-4"/> STABLE</span>}
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-paper rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-muted">Seasonality</span>
          </div>
          <p className="text-[13px] text-ink leading-relaxed">
            {pkg.analytics.seasonality}
          </p>
        </div>
        <div className="p-4 bg-paper rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-muted">AI Verdict</span>
          </div>
          <p className="text-[13px] text-ink leading-relaxed">
            {pkg.analytics.analysisSummary}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
