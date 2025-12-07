"""
Feature 1: Industry Concentration & Economic Impact Analysis
Identifies where critical H-1B expertise is concentrated and analyzes
economic impact of removing H-1B workforce by industry and state.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Set up plotting style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 8)

class H1BIndustryAnalyzer:
    def __init__(self, data_dir='../data/avery', output_dir='./outputs'):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        # Load NAICS lookup table
        self.naics_lookup = pd.read_csv('naics_lookup.csv')

        # Load all cleaned data
        print("Loading H-1B data from all years...")
        self.df = self._load_all_data()
        print(f"Total records loaded: {len(self.df):,}")

    def _load_all_data(self):
        """Load and combine all cleaned CSV files"""
        csv_files = [f for f in self.data_dir.glob('cleaned_*.csv') if f.name != 'combined.csv']

        # Load individual files (combined.csv has parsing issues)
        print(f"Loading {len(csv_files)} individual CSV files...")
        dfs = []
        for file in sorted(csv_files):
            try:
                print(f"  Loading {file.name}...", end='')
                temp_df = pd.read_csv(file, low_memory=False)
                dfs.append(temp_df)
                print(f" ✓ ({len(temp_df):,} rows)")
            except Exception as e:
                print(f" ✗ Error: {e}")
                continue

        print(f"\nCombining {len(dfs)} datasets...")
        df = pd.concat(dfs, ignore_index=True)

        # Clean and standardize data
        df = self._clean_data(df)
        return df

    def _clean_data(self, df):
        """Clean and standardize the data"""
        # Convert wage to numeric
        if 'wage_offer' in df.columns:
            df['wage_offer'] = pd.to_numeric(df['wage_offer'], errors='coerce')

        # Standardize all wages to annual
        if 'wage_unit' in df.columns and 'wage_offer' in df.columns:
            wage_multipliers = {
                'Hour': 2080,      # 40 hours/week * 52 weeks
                'Week': 52,
                'Bi-Weekly': 26,
                'Month': 12,
                'Year': 1
            }
            df['annual_wage'] = df.apply(
                lambda row: row['wage_offer'] * wage_multipliers.get(row['wage_unit'], 1)
                if pd.notna(row['wage_offer']) else np.nan,
                axis=1
            )
        else:
            df['annual_wage'] = df['wage_offer']

        # Merge with NAICS lookup for industry names
        df['industry'] = df['industry'].astype(str)
        df = df.merge(
            self.naics_lookup[['naics_code', 'industry_name', 'industry_category']],
            left_on='industry',
            right_on='naics_code',
            how='left'
        )

        # Fill missing industry names with NAICS code
        df['industry_name'] = df['industry_name'].fillna('Other (NAICS: ' + df['industry'] + ')')
        df['industry_category'] = df['industry_category'].fillna('Other')

        return df

    def calculate_industry_metrics(self):
        """Calculate the three key economic impact metrics by industry"""
        print("\n=== CALCULATING INDUSTRY METRICS ===")

        metrics = self.df.groupby('industry_category').agg({
            'app_id': 'count',                    # Number of positions
            'annual_wage': ['sum', 'mean', 'median'],  # Wage statistics
            'emp_name': 'nunique'                 # Number of unique employers
        }).round(2)

        metrics.columns = ['total_positions', 'total_wages', 'avg_wage', 'median_wage', 'unique_employers']
        metrics = metrics.sort_values('total_positions', ascending=False)

        # Calculate percentage of total H-1B workforce
        metrics['pct_of_workforce'] = (metrics['total_positions'] / metrics['total_positions'].sum() * 100).round(2)

        # Format wages in billions
        metrics['total_wages_billions'] = (metrics['total_wages'] / 1_000_000_000).round(2)

        print(metrics[['total_positions', 'total_wages_billions', 'pct_of_workforce', 'unique_employers']])

        # Save to CSV
        output_file = self.output_dir / 'industry_economic_impact.csv'
        metrics.to_csv(output_file)
        print(f"\nSaved to: {output_file}")

        return metrics

    def calculate_state_metrics(self):
        """Calculate economic impact by state"""
        print("\n=== CALCULATING STATE-LEVEL METRICS ===")

        state_metrics = self.df.groupby('worksite_state').agg({
            'app_id': 'count',
            'annual_wage': ['sum', 'mean'],
            'emp_name': 'nunique'
        }).round(2)

        state_metrics.columns = ['total_positions', 'total_wages', 'avg_wage', 'unique_employers']
        state_metrics = state_metrics.sort_values('total_positions', ascending=False)

        # Calculate percentage
        state_metrics['pct_of_workforce'] = (state_metrics['total_positions'] / state_metrics['total_positions'].sum() * 100).round(2)
        state_metrics['total_wages_billions'] = (state_metrics['total_wages'] / 1_000_000_000).round(2)

        print(state_metrics.head(20)[['total_positions', 'total_wages_billions', 'pct_of_workforce']])

        # Save to CSV
        output_file = self.output_dir / 'state_economic_impact.csv'
        state_metrics.to_csv(output_file)
        print(f"\nSaved to: {output_file}")

        return state_metrics

    def analyze_growth_trends(self):
        """Analyze industry growth trends over time"""
        print("\n=== ANALYZING GROWTH TRENDS (2009-2024) ===")

        growth_data = self.df.groupby(['fiscal_year', 'industry_category']).agg({
            'app_id': 'count',
            'annual_wage': 'sum'
        }).reset_index()

        growth_data.columns = ['fiscal_year', 'industry_category', 'positions', 'total_wages']

        # Calculate year-over-year growth for top industries
        top_industries = self.df['industry_category'].value_counts().head(10).index

        for industry in top_industries:
            industry_data = growth_data[growth_data['industry_category'] == industry].sort_values('fiscal_year')
            if len(industry_data) > 1:
                start = industry_data.iloc[0]
                end = industry_data.iloc[-1]
                growth_rate = ((end['positions'] - start['positions']) / start['positions'] * 100).round(2)
                print(f"{industry}: {start['positions']:,} ({int(start['fiscal_year'])}) → {end['positions']:,} ({int(end['fiscal_year'])}) | Growth: {growth_rate}%")

        # Save detailed growth data
        output_file = self.output_dir / 'industry_growth_trends.csv'
        growth_data.to_csv(output_file, index=False)
        print(f"\nSaved to: {output_file}")

        return growth_data

    def generate_visualizations(self):
        """Generate key visualizations"""
        print("\n=== GENERATING VISUALIZATIONS ===")

        # 1. Top 15 Industries by H-1B Count
        plt.figure(figsize=(14, 8))
        top_industries = self.df['industry_category'].value_counts().head(15)
        sns.barplot(x=top_industries.values, y=top_industries.index, palette='viridis')
        plt.xlabel('Number of H-1B Positions', fontsize=12)
        plt.ylabel('Industry Category', fontsize=12)
        plt.title('Top 15 Industries by H-1B Concentration (All Years)', fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'top_industries_by_count.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: top_industries_by_count.png")

        # 2. Top 15 States by H-1B Count
        plt.figure(figsize=(14, 8))
        top_states = self.df['worksite_state'].value_counts().head(15)
        sns.barplot(x=top_states.values, y=top_states.index, palette='rocket')
        plt.xlabel('Number of H-1B Positions', fontsize=12)
        plt.ylabel('State', fontsize=12)
        plt.title('Top 15 States by H-1B Concentration', fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'top_states_by_count.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: top_states_by_count.png")

        # 3. Industry Growth Over Time (Top 5 Industries)
        plt.figure(figsize=(14, 8))
        growth_data = self.df.groupby(['fiscal_year', 'industry_category'])['app_id'].count().reset_index()
        top_5_industries = self.df['industry_category'].value_counts().head(5).index

        for industry in top_5_industries:
            data = growth_data[growth_data['industry_category'] == industry]
            plt.plot(data['fiscal_year'], data['app_id'], marker='o', label=industry, linewidth=2)

        plt.xlabel('Fiscal Year', fontsize=12)
        plt.ylabel('Number of H-1B Positions', fontsize=12)
        plt.title('H-1B Growth Trends by Industry (2009-2024)', fontsize=14, fontweight='bold')
        plt.legend(loc='best', fontsize=10)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(self.output_dir / 'industry_growth_trends.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: industry_growth_trends.png")

        # 4. Economic Impact by Industry (Total Wages)
        plt.figure(figsize=(14, 8))
        wage_impact = self.df.groupby('industry_category')['annual_wage'].sum().sort_values(ascending=False).head(15)
        wage_impact_billions = wage_impact / 1_000_000_000

        sns.barplot(x=wage_impact_billions.values, y=wage_impact_billions.index, palette='mako')
        plt.xlabel('Total Annual Wages (Billions USD)', fontsize=12)
        plt.ylabel('Industry Category', fontsize=12)
        plt.title('Economic Impact: Total H-1B Wages by Industry', fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'economic_impact_by_industry.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: economic_impact_by_industry.png")

    def generate_summary_report(self):
        """Generate a comprehensive summary report"""
        print("\n" + "="*70)
        print("FEATURE 1: INDUSTRY CONCENTRATION & ECONOMIC IMPACT ANALYSIS")
        print("="*70)

        total_positions = len(self.df)
        total_wages = self.df['annual_wage'].sum()
        unique_employers = self.df['emp_name'].nunique()
        unique_states = self.df['worksite_state'].nunique()
        date_range = f"{int(self.df['fiscal_year'].min())}-{int(self.df['fiscal_year'].max())}"

        print(f"\nDataset Overview:")
        print(f"  • Time Period: {date_range}")
        print(f"  • Total H-1B Positions: {total_positions:,}")
        print(f"  • Total Annual Wages: ${total_wages/1_000_000_000:.2f}B")
        print(f"  • Unique Employers: {unique_employers:,}")
        print(f"  • States/Territories: {unique_states}")

        print(f"\nTop 5 Industries by H-1B Concentration:")
        top_5 = self.df['industry_category'].value_counts().head(5)
        for i, (industry, count) in enumerate(top_5.items(), 1):
            pct = (count / total_positions * 100)
            print(f"  {i}. {industry}: {count:,} positions ({pct:.1f}%)")

        print(f"\nTop 5 States by H-1B Concentration:")
        top_5_states = self.df['worksite_state'].value_counts().head(5)
        for i, (state, count) in enumerate(top_5_states.items(), 1):
            pct = (count / total_positions * 100)
            print(f"  {i}. {state}: {count:,} positions ({pct:.1f}%)")

        print(f"\nEconomic Impact Metrics:")
        print(f"  • Average H-1B Salary: ${self.df['annual_wage'].mean():,.0f}")
        print(f"  • Median H-1B Salary: ${self.df['annual_wage'].median():,.0f}")

        print("\n" + "="*70)
        print(f"Analysis complete! Results saved to: {self.output_dir.absolute()}")
        print("="*70)


def main():
    """Run the complete Feature 1 analysis"""
    # Initialize analyzer
    analyzer = H1BIndustryAnalyzer(
        data_dir='../data/avery',
        output_dir='./outputs'
    )

    # Run analyses
    industry_metrics = analyzer.calculate_industry_metrics()
    state_metrics = analyzer.calculate_state_metrics()
    growth_trends = analyzer.analyze_growth_trends()

    # Generate visualizations
    analyzer.generate_visualizations()

    # Print summary report
    analyzer.generate_summary_report()

    print("\n✅ Feature 1 Analysis Complete!")
    print(f"\nOutputs saved to: {analyzer.output_dir.absolute()}")
    print("\nGenerated files:")
    print("  • industry_economic_impact.csv")
    print("  • state_economic_impact.csv")
    print("  • industry_growth_trends.csv")
    print("  • top_industries_by_count.png")
    print("  • top_states_by_count.png")
    print("  • industry_growth_trends.png")
    print("  • economic_impact_by_industry.png")


if __name__ == "__main__":
    main()
