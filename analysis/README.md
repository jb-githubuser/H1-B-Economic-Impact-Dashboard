# Feature 1: Industry Concentration Analysis

## Quick Start

### Prerequisites
```bash
pip install pandas numpy matplotlib seaborn
```

### Run the Analysis
```bash
cd analysis
python feature1_industry_analysis.py
```

## What This Does

The script analyzes your 7.5M H-1B records and calculates:

1. **Industry Metrics** (`industry_economic_impact.csv`)
   - Total H-1B positions per industry
   - Total wages (economic impact if workforce removed)
   - Percentage of total H-1B workforce
   - Number of unique employers

2. **State Metrics** (`state_economic_impact.csv`)
   - H-1B concentration by state
   - Economic impact by state
   - Regional analysis

3. **Growth Trends** (`industry_growth_trends.csv`)
   - Year-over-year growth by industry (2009-2024)
   - Identifies fastest-growing sectors

4. **Visualizations**
   - Top industries by H-1B count
   - Top states by H-1B count
   - Industry growth trends over time
   - Economic impact by industry (total wages)

## Outputs

All results saved to `analysis/outputs/`:
- 3 CSV files with detailed metrics
- 4 PNG charts/visualizations
- Console summary report

## Files Created

- `naics_lookup.csv` - Industry code to name mapping
- `feature1_industry_analysis.py` - Main analysis script
- `outputs/` - Results directory (auto-created)

## Next Steps

After running this analysis:
1. Review the CSV outputs for detailed metrics
2. Use visualizations for presentations
3. Identify which industries/states to focus on for Feature 1
4. These insights will inform the dashboard design
