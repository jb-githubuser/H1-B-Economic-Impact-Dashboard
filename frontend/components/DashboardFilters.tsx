'use client';

import React from 'react';

interface DashboardFiltersProps {
  selectedYear: number;
  selectedIndustry: string;
  selectedState: string;
  onYearChange: (year: number) => void;
  onIndustryChange: (industry: string) => void;
  onStateChange: (state: string) => void;
  industries: string[];
  states: string[];
}

export default function DashboardFilters({
  selectedYear,
  selectedIndustry,
  selectedState,
  onYearChange,
  onIndustryChange,
  onStateChange,
  industries,
  states,
}: DashboardFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Year Filter */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-2">
            Year
          </label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
            <option value={2021}>2021</option>
            <option value={2020}>2020</option>
          </select>
        </div>

        {/* Industry Filter */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
            Industry
          </label>
          <select
            id="industry"
            value={selectedIndustry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Industries</option>
            {industries
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((industry) => (
              <option key={industry.value} value={industry.value}>
                {industry.label}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-2">
            State
          </label>
          <select
            id="state"
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All States</option>
            {states.sort().map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
