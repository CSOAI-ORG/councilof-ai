#!/usr/bin/env python3
"""
Portfolio Analysis Script
Analyzes production readiness and 80/20 potential of all companies
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
import numpy as np

# Read the Excel file
df = pd.read_excel('/home/ubuntu/upload/Portfolio_Companies.xlsx', sheet_name='Portfolio Companies')

# Clean the data
df = df[df['Company'].notna()]  # Remove empty rows
df = df[~df['Company'].str.contains('TOTAL|Subtotal', na=False)]  # Remove subtotal rows

# Parse readiness percentage
df['Readiness_Numeric'] = df['Readiness'].str.rstrip('%').astype(float)

# Parse valuation (take midpoint)
def parse_valuation(val_str):
    if pd.isna(val_str) or val_str == '':
        return 0
    # Remove £ and K/M suffixes, split range
    val_str = str(val_str).replace('£', '').replace(',', '')
    if '-' in val_str:
        low, high = val_str.split('-')
        low_val = float(low.rstrip('KM'))
        high_val = float(high.rstrip('KM'))
        if 'M' in high:
            low_val *= 1000 if 'K' in low else 1
            high_val *= 1000
        elif 'K' in high:
            low_val *= 1 if 'K' in low else 0.001
            high_val *= 1
        return (low_val + high_val) / 2
    return 0

df['Valuation_K'] = df['Valuation'].apply(parse_valuation)

# Categorize by status
def get_status(row):
    url = str(row['Live URL (Manus)'])
    if '🔴' in url or 'Down' in url:
        return 'Down'
    elif '⏸️' in url or 'Pending' in url:
        return 'Pending'
    elif 'http' in url:
        return 'Live'
    else:
        return 'Unknown'

df['Status'] = df.apply(get_status, axis=1)

# Calculate production readiness score (0-100)
# Factors: Readiness %, Status, Stage
def calc_production_score(row):
    score = row['Readiness_Numeric']
    
    # Status penalty
    if row['Status'] == 'Down':
        score *= 0.3
    elif row['Status'] == 'Pending':
        score *= 0.6
    
    # Stage bonus
    if row['Stage'] == 'Production':
        score *= 1.2
    elif row['Stage'] == 'Beta':
        score *= 1.0
    elif row['Stage'] == 'Alpha':
        score *= 0.8
    
    return min(score, 100)

df['Production_Score'] = df.apply(calc_production_score, axis=1)

# Calculate 80/20 potential score
# Factors: Valuation, Production Score, Category
def calc_potential_score(row):
    # Normalize valuation (0-100)
    val_score = min((row['Valuation_K'] / df['Valuation_K'].max()) * 100, 100)
    
    # Weight: 60% valuation, 40% production readiness
    potential = (val_score * 0.6) + (row['Production_Score'] * 0.4)
    
    # AI Safety companies get 1.3x multiplier (strategic importance)
    if row['Category'] == 'AI Safety':
        potential *= 1.3
    
    return min(potential, 100)

df['Potential_Score'] = df.apply(calc_potential_score, axis=1)

# Sort by potential
df_sorted = df.sort_values('Potential_Score', ascending=False)

# Identify top 20% (80/20 rule)
top_20_count = max(int(len(df) * 0.2), 3)
df_sorted['Top_20'] = False
df_sorted.iloc[:top_20_count, df_sorted.columns.get_loc('Top_20')] = True

# Save analysis
output = df_sorted[['Company', 'Category', 'Status', 'Stage', 'Readiness_Numeric', 
                     'Production_Score', 'Valuation_K', 'Potential_Score', 'Top_20', 'Immediate Action']]
output.to_csv('/home/ubuntu/portfolio_analysis.csv', index=False)

# Generate visualizations
matplotlib.rcParams['font.family'] = 'DejaVu Sans'
fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle('Portfolio Analysis: Production Readiness & Potential', fontsize=16, fontweight='bold')

# 1. Production Readiness by Company
ax1 = axes[0, 0]
companies = df_sorted['Company'].head(10)
scores = df_sorted['Production_Score'].head(10)
colors = ['#2ecc71' if s >= 80 else '#f39c12' if s >= 60 else '#e74c3c' for s in scores]
ax1.barh(companies, scores, color=colors)
ax1.set_xlabel('Production Readiness Score', fontweight='bold')
ax1.set_title('Top 10 Companies by Production Readiness', fontweight='bold')
ax1.set_xlim(0, 100)
for i, v in enumerate(scores):
    ax1.text(v + 2, i, f'{v:.0f}', va='center')

# 2. 80/20 Potential Analysis
ax2 = axes[0, 1]
top_companies = df_sorted[df_sorted['Top_20']]['Company']
top_potential = df_sorted[df_sorted['Top_20']]['Potential_Score']
colors_top = ['#9b59b6' if cat == 'AI Safety' else '#3498db' 
              for cat in df_sorted[df_sorted['Top_20']]['Category']]
ax2.barh(top_companies, top_potential, color=colors_top)
ax2.set_xlabel('Potential Score (Valuation + Readiness)', fontweight='bold')
ax2.set_title('Top 20% Companies (80/20 Rule)', fontweight='bold')
ax2.set_xlim(0, 100)
for i, v in enumerate(top_potential):
    ax2.text(v + 2, i, f'{v:.0f}', va='center')

# 3. Category Breakdown
ax3 = axes[1, 0]
category_counts = df['Category'].value_counts()
category_readiness = df.groupby('Category')['Production_Score'].mean()
x = np.arange(len(category_counts))
width = 0.35
ax3.bar(x - width/2, category_counts.values, width, label='Count', color='#3498db')
ax3_twin = ax3.twinx()
ax3_twin.bar(x + width/2, category_readiness.values, width, label='Avg Readiness', color='#2ecc71')
ax3.set_xlabel('Category', fontweight='bold')
ax3.set_ylabel('Company Count', fontweight='bold')
ax3_twin.set_ylabel('Avg Production Score', fontweight='bold')
ax3.set_title('Portfolio by Category', fontweight='bold')
ax3.set_xticks(x)
ax3.set_xticks(x)
ax3.set_xticklabels(category_counts.index)
ax3.legend(loc='upper left')
ax3_twin.legend(loc='upper right')

# 4. Status Distribution
ax4 = axes[1, 1]
status_counts = df['Status'].value_counts()
colors_status = {'Live': '#2ecc71', 'Pending': '#f39c12', 'Down': '#e74c3c', 'Unknown': '#95a5a6'}
pie_colors = [colors_status.get(status, '#95a5a6') for status in status_counts.index]
ax4.pie(status_counts.values, labels=status_counts.index, autopct='%1.1f%%', 
        colors=pie_colors, startangle=90)
ax4.set_title('Platform Status Distribution', fontweight='bold')

plt.tight_layout()
plt.savefig('/home/ubuntu/portfolio_analysis.png', dpi=300, bbox_inches='tight')
print("✅ Analysis complete! Saved to portfolio_analysis.csv and portfolio_analysis.png")

# Print summary stats
print("\n" + "="*70)
print("PORTFOLIO SUMMARY STATISTICS")
print("="*70)
print(f"Total Companies: {len(df)}")
print(f"Average Production Readiness: {df['Production_Score'].mean():.1f}%")
print(f"Average Potential Score: {df['Potential_Score'].mean():.1f}%")
print(f"Total Portfolio Valuation: £{df['Valuation_K'].sum():.0f}K")
print(f"\nStatus Breakdown:")
for status, count in status_counts.items():
    print(f"  {status}: {count} companies ({count/len(df)*100:.1f}%)")

print(f"\n" + "="*70)
print("TOP 20% COMPANIES (80/20 RULE)")
print("="*70)
for idx, row in df_sorted[df_sorted['Top_20']].iterrows():
    print(f"{row['Company']:25s} | Potential: {row['Potential_Score']:5.1f} | Readiness: {row['Production_Score']:5.1f}% | {row['Category']}")
