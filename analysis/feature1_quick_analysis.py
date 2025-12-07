"""
Feature 1: Industry Concentration & Economic Impact Analysis (QUICK VERSION)
Uses only recent data (2022-2024) for faster analysis
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

class H1BQuickAnalyzer:
    def __init__(self, data_dir='../data/avery', output_dir='./outputs'):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        # Load NAICS lookup table
        self.naics_lookup = pd.read_csv('naics_lookup.csv')

        # Load only recent data (2022-2024)
        print("Loading recent H-1B data (2022-2024)...")
        self.df = self._load_recent_data()
        print(f"Total records loaded: {len(self.df):,}")

    def _load_recent_data(self):
        """Load only 2022-2024 data for faster processing"""
        # Get only recent quarterly files
        recent_files = [
            'cleaned_data_h1b22q1.csv', 'cleaned_data_h1b22q2.csv',
            'cleaned_data_h1b22q3.csv', 'cleaned_data_h1b22q4.csv',
            'cleaned_data_h1b23q1.csv', 'cleaned_data_h1b23q2.csv',
            'cleaned_data_h1b23q3.csv', 'cleaned_data_h1b23q4.csv',
            'cleaned_data_h1b24q1.csv', 'cleaned_data_h1b24q2.csv',
            'cleaned_data_h1b24q3.csv', 'cleaned_h1b_2024q4.csv'
        ]

        dfs = []
        for filename in recent_files:
            file_path = self.data_dir / filename
            if file_path.exists():
                print(f"  Loading {filename}...", end='')
                temp_df = pd.read_csv(file_path, low_memory=False)
                dfs.append(temp_df)
                print(f" ✓ ({len(temp_df):,} rows)")

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
                'Hour': 2080,
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
        # Also convert naics_code in lookup to string
        self.naics_lookup['naics_code'] = self.naics_lookup['naics_code'].astype(str)

        df = df.merge(
            self.naics_lookup[['naics_code', 'industry_name', 'industry_category']],
            left_on='industry',
            right_on='naics_code',
            how='left'
        )

        # Fill missing industry names
        df['industry_name'] = df['industry_name'].fillna('Other (NAICS: ' + df['industry'] + ')')
        df['industry_category'] = df['industry_category'].fillna('Other')

        return df

    def calculate_industry_metrics(self):
        """Calculate the three key economic impact metrics by industry"""
        print("\n=== INDUSTRY ECONOMIC IMPACT (2022-2024) ===\n")

        metrics = self.df.groupby('industry_category').agg({
            'app_id': 'count',
            'annual_wage': ['sum', 'mean', 'median'],
            'emp_name': 'nunique'
        }).round(2)

        metrics.columns = ['total_positions', 'total_wages', 'avg_wage', 'median_wage', 'unique_employers']
        metrics = metrics.sort_values('total_positions', ascending=False)

        # Calculate percentage of total H-1B workforce
        metrics['pct_of_workforce'] = (metrics['total_positions'] / metrics['total_positions'].sum() * 100).round(2)
        metrics['total_wages_billions'] = (metrics['total_wages'] / 1_000_000_000).round(2)

        print(metrics[['total_positions', 'total_wages_billions', 'pct_of_workforce', 'unique_employers']].head(15))

        # Save to CSV
        output_file = self.output_dir / 'industry_economic_impact_2022-2024.csv'
        metrics.to_csv(output_file)
        print(f"\nSaved: {output_file.name}")

        return metrics

    def calculate_state_metrics(self):
        """Calculate economic impact by state"""
        print("\n=== STATE-LEVEL ECONOMIC IMPACT (2022-2024) ===\n")

        state_metrics = self.df.groupby('worksite_state').agg({
            'app_id': 'count',
            'annual_wage': ['sum', 'mean'],
            'emp_name': 'nunique'
        }).round(2)

        state_metrics.columns = ['total_positions', 'total_wages', 'avg_wage', 'unique_employers']
        state_metrics = state_metrics.sort_values('total_positions', ascending=False)

        state_metrics['pct_of_workforce'] = (state_metrics['total_positions'] / state_metrics['total_positions'].sum() * 100).round(2)
        state_metrics['total_wages_billions'] = (state_metrics['total_wages'] / 1_000_000_000).round(2)

        print(state_metrics[['total_positions', 'total_wages_billions', 'pct_of_workforce']].head(15))

        # Save to CSV
        output_file = self.output_dir / 'state_economic_impact_2022-2024.csv'
        state_metrics.to_csv(output_file)
        print(f"\nSaved: {output_file.name}")

        return state_metrics

    def analyze_trends(self):
        """Analyze trends across 2022-2024"""
        print("\n=== YEARLY TRENDS (2022-2024) ===\n")

        yearly = self.df.groupby('fiscal_year').agg({
            'app_id': 'count',
            'annual_wage': 'mean'
        }).round(2)

        yearly.columns = ['total_applications', 'avg_wage']
        print(yearly)

        # By industry
        print("\nTop 5 Industries - Year-over-Year:")
        top_industries = self.df['industry_category'].value_counts().head(5).index

        for industry in top_industries:
            industry_yearly = self.df[self.df['industry_category'] == industry].groupby('fiscal_year')['app_id'].count()
            print(f"\n{industry}:")
            print(industry_yearly)

        return yearly

    def generate_visualizations(self):
        """Generate key visualizations"""
        print("\n=== GENERATING VISUALIZATIONS ===")

        # 1. Top Industries
        plt.figure(figsize=(14, 8))
        top_industries = self.df['industry_category'].value_counts().head(15)
        sns.barplot(x=top_industries.values, y=top_industries.index, palette='viridis')
        plt.xlabel('Number of H-1B Positions', fontsize=12)
        plt.ylabel('Industry Category', fontsize=12)
        plt.title('Top 15 Industries by H-1B Concentration (2022-2024)', fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'top_industries_2022-2024.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: top_industries_2022-2024.png")
        plt.close()

        # 2. Top States
        plt.figure(figsize=(14, 8))
        top_states = self.df['worksite_state'].value_counts().head(15)
        sns.barplot(x=top_states.values, y=top_states.index, palette='rocket')
        plt.xlabel('Number of H-1B Positions', fontsize=12)
        plt.ylabel('State', fontsize=12)
        plt.title('Top 15 States by H-1B Concentration (2022-2024)', fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'top_states_2022-2024.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: top_states_2022-2024.png")
        plt.close()

        # 3. Economic Impact by Industry
        plt.figure(figsize=(14, 8))
        wage_impact = self.df.groupby('industry_category')['annual_wage'].sum().sort_values(ascending=False).head(15)
        wage_impact_billions = wage_impact / 1_000_000_000

        sns.barplot(x=wage_impact_billions.values, y=wage_impact_billions.index, palette='mako')
        plt.xlabel('Total Annual Wages (Billions USD)', fontsize=12)
        plt.ylabel('Industry Category', fontsize=12)
        plt.title('Economic Impact: Total H-1B Wages by Industry (2022-2024)', fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'economic_impact_2022-2024.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: economic_impact_2022-2024.png")
        plt.close()

        # 4. Yearly Trend
        plt.figure(figsize=(14, 8))
        yearly_counts = self.df.groupby('fiscal_year')['app_id'].count()
        plt.plot(yearly_counts.index, yearly_counts.values, marker='o', linewidth=3, markersize=10, color='#2E86AB')
        plt.xlabel('Fiscal Year', fontsize=12)
        plt.ylabel('Number of H-1B Applications', fontsize=12)
        plt.title('H-1B Application Volume (2022-2024)', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(self.output_dir / 'yearly_trend_2022-2024.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: yearly_trend_2022-2024.png")
        plt.close()

    def generate_summary_report(self):
        """Generate summary report"""
        print("\n" + "="*70)
        print("FEATURE 1: INDUSTRY CONCENTRATION ANALYSIS (2022-2024)")
        print("="*70)

        total_positions = len(self.df)
        total_wages = self.df['annual_wage'].sum()
        unique_employers = self.df['emp_name'].nunique()
        unique_states = self.df['worksite_state'].nunique()

        print(f"\nDataset Overview:")
        print(f"  • Time Period: 2022-2024")
        print(f"  • Total H-1B Positions: {total_positions:,}")
        print(f"  • Total Annual Wages: ${total_wages/1_000_000_000:.2f}B")
        print(f"  • Average Salary: ${self.df['annual_wage'].mean():,.0f}")
        print(f"  • Median Salary: ${self.df['annual_wage'].median():,.0f}")
        print(f"  • Unique Employers: {unique_employers:,}")
        print(f"  • States/Territories: {unique_states}")

        print(f"\nTop 5 Industries:")
        top_5 = self.df['industry_category'].value_counts().head(5)
        for i, (industry, count) in enumerate(top_5.items(), 1):
            pct = (count / total_positions * 100)
            avg_wage = self.df[self.df['industry_category'] == industry]['annual_wage'].mean()
            print(f"  {i}. {industry}")
            print(f"     • Positions: {count:,} ({pct:.1f}%)")
            print(f"     • Avg Wage: ${avg_wage:,.0f}")

        print(f"\nTop 5 States:")
        top_5_states = self.df['worksite_state'].value_counts().head(5)
        for i, (state, count) in enumerate(top_5_states.items(), 1):
            pct = (count / total_positions * 100)
            total_state_wages = self.df[self.df['worksite_state'] == state]['annual_wage'].sum() / 1_000_000_000
            print(f"  {i}. {state}: {count:,} ({pct:.1f}%) - ${total_state_wages:.2f}B in wages")

        print("\n" + "="*70)


def main():
    """Run quick analysis on recent data"""
    analyzer = H1BQuickAnalyzer(
        data_dir='../data/avery',
        output_dir='./outputs'
    )

    # Run analyses
    industry_metrics = analyzer.calculate_industry_metrics()
    state_metrics = analyzer.calculate_state_metrics()
    trends = analyzer.analyze_trends()

    # Generate visualizations
    analyzer.generate_visualizations()

    # Summary report
    analyzer.generate_summary_report()

    print("\n✅ Quick Analysis Complete!")
    print(f"\nOutputs saved to: {analyzer.output_dir.absolute()}")


if __name__ == "__main__":
    main()
