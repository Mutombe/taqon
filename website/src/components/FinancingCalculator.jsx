import React from 'react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, CurrencyDollar, Calendar, TrendUp } from '@phosphor-icons/react';
import { calculateMonthlyPayment, formatCurrency, formatCurrencyDetailed } from '../utils/solarCalculator';
import { FINANCING_PLANS } from '../data/calculatorData';

export default function FinancingCalculator() {
  const [systemCost, setSystemCost] = useState(3500);
  const [selectedPlan, setSelectedPlan] = useState(FINANCING_PLANS[0]);

  const result = useMemo(() => {
    return calculateMonthlyPayment(systemCost, selectedPlan.months, selectedPlan.interestRate);
  }, [systemCost, selectedPlan]);

  return (
    <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-8 lg:p-10 border border-gray-100 dark:border-white/10 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-taqon-orange/10 flex items-center justify-center">
          <Calculator size={24} className="text-taqon-orange" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">Payment Calculator</h3>
          <p className="text-sm text-taqon-muted dark:text-white/50">Estimate your monthly payments</p>
        </div>
      </div>

      {/* System Cost Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-taqon-charcoal dark:text-white/80 mb-2">
          System Cost (USD)
        </label>
        <div className="relative">
          <CurrencyDollar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-taqon-muted" />
          <input
            type="number"
            min="500"
            max="50000"
            step="100"
            value={systemCost}
            onChange={(e) => setSystemCost(Math.max(0, Number(e.target.value)))}
            className="w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all text-taqon-charcoal dark:text-white"
          />
        </div>
        <input
          type="range"
          min="500"
          max="25000"
          step="100"
          value={systemCost}
          onChange={(e) => setSystemCost(Number(e.target.value))}
          className="w-full mt-3 accent-taqon-orange"
        />
        <div className="flex justify-between text-xs text-taqon-muted mt-1">
          <span>$500</span>
          <span>$25,000</span>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-taqon-charcoal dark:text-white/80 mb-3">
          Payment Plan
        </label>
        <div className="grid grid-cols-3 gap-3">
          {FINANCING_PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                selectedPlan.id === plan.id
                  ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10'
                  : 'border-gray-200 dark:border-white/10 hover:border-taqon-orange/30'
              }`}
            >
              <span className={`text-lg font-bold font-syne block ${
                selectedPlan.id === plan.id ? 'text-taqon-orange' : 'text-taqon-charcoal dark:text-white'
              }`}>
                {plan.months}
              </span>
              <span className="text-xs text-taqon-muted dark:text-white/50 block">months</span>
              {plan.interestRate === 0 && (
                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 mt-1 block">0% interest</span>
              )}
              {plan.interestRate > 0 && (
                <span className="text-[10px] font-semibold text-taqon-muted dark:text-white/40 mt-1 block">
                  {plan.interestRate * 100}% interest
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <motion.div
        key={`${systemCost}-${selectedPlan.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-taqon-orange/5 to-taqon-amber/5 dark:from-taqon-orange/10 dark:to-taqon-amber/5 rounded-2xl p-6 border border-taqon-orange/10"
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-2">
              <Calendar size={18} className="text-taqon-orange" />
            </div>
            <p className="text-xs text-taqon-muted dark:text-white/50 mb-1">Monthly Payment</p>
            <p className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
              {formatCurrencyDetailed(result.monthlyPayment)}
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-2">
              <CurrencyDollar size={18} className="text-taqon-orange" />
            </div>
            <p className="text-xs text-taqon-muted dark:text-white/50 mb-1">Total Cost</p>
            <p className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
              {formatCurrency(result.totalCost)}
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-2">
              <TrendUp size={18} className="text-taqon-orange" />
            </div>
            <p className="text-xs text-taqon-muted dark:text-white/50 mb-1">Interest</p>
            <p className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
              {formatCurrency(result.interestAmount)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
