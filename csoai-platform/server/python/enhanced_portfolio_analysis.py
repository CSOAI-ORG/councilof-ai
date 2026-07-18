#!/usr/bin/env python3
"""
Enhanced Portfolio Analysis with Detailed Scoring
Integrates technical, marketing, and content scores
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
import numpy as np

# Read both datasets
df_main = pd.read_excel('/home/ubuntu/upload/Portfolio_Companies.xlsx', sheet_name='Portfolio Companies')
df_detailed = pd.read_csv('/home/ubuntu/detailed_scores.csv')

# Clean main dataset
df_main = df_main[df_main['Company'].notna()]
df_main = df_main[~df_main['Company'].str.contains('TOTAL|Subtotal', na=False)]

# Normalize company names for matching
df_main['Company_Normalized'] = df_main['Company'].str.lower().str.replace('.ai', '').str.replace('of', '').str.strip()
df_detailed['Company_Normalized'] = df_detailed['Company Name'].str.lower().str.replace('.ai', '').str.replace('of', '').str.strip()

# Merge datasets
df_merged = df_main.merge(df_detailed[['Company_Normalized', 'Technical Score', 'Marketing Score', 'Content Score', 
                                        'Key Strengths', 'Critical Gaps']], 
                          on='Company_Normalized', how='left')

# For companies without detailed scores, estimate based on readiness
df_merged['Technical Score'] = df_merged['Technical Score'].fillna(df_merged['Readiness'].str.rstrip('%').astype(float) * 0.4)
df_merged['Marketing Score'] = df_merged['Marketing Score'].fillna(df_merged['Readiness'].str.rstrip('%').astype(float) * 0.3)
df_merged['Content Score'] = df_merged['Content Score'].fillna(df_merged['Readiness'].str.rstrip('%').astype(float) * 0.3)

# Calculate comprehensive readiness score
df_merged['Readiness_Numeric'] = df_merged['Readiness'].str.rstrip('%').astype(float)
df_merged['Comprehensive_Score'] = (
    df_merged['Technical Score'] * 0.5 +  # Technical is most important
    df_merged['Marketing Score'] * 0.25 +
    df_merged['Content Score'] * 0.25
)

# Status categorization
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

df_merged['Status'] = df_merged.apply(get_status, axis=1)

# Parse valuation
def parse_valuation(val_str):
    if pd.isna(val_str) or val_str == '':
        return 0
    val_str = str(val_str).replace('£', '').replace(',', '')
    if '-' in val_str:
        low, high = val_str.split('-')
        low_val = float(low.rstrip('KMkm'))
        high_val = float(high.rstrip('KMkm'))
        if 'M' in high or 'm' in high:
            low_val *= 1000 if 'K' in low or 'k' in low else 1
            high_val *= 1000
        elif 'K' in high or 'k' in high:
            low_val *= 1 if 'K' in low or 'k' in low else 0.001
            high_val *= 1
        return (low_val + high_val) / 2
    return 0

df_merged['Valuation_K'] = df_merged['Valuation'].apply(parse_valuation)

# Calculate production readiness with new factors
def calc_production_score_v2(row):
    # Base score from comprehensive score
    score = row['Comprehensive_Score']
    
    # Status penalty
    if row['Status'] == 'Down':
        score *= 0.2
    elif row['Status'] == 'Pending':
        score *= 0.5
    
    # Stage adjustment
    if row['Stage'] == 'Production':
        score *= 1.3
    elif row['Stage'] == 'Beta':
        score *= 1.0
    elif row['Stage'] == 'Alpha':
        score *= 0.7
    
    return min(score, 100)

df_merged['Production_Score_V2'] = df_merged.apply(calc_production_score_v2, axis=1)

# Calculate launch readiness (can we launch this week?)
def calc_launch_readiness(row):
    # Must have: Technical > 20, Status = Live, Stage = Beta/Production
    if row['Status'] != 'Live':
        return 'Not Ready'
    if row['Technical Score'] < 20:
        return 'Not Ready'
    if row['Stage'] == 'Alpha':
        return 'Needs Work'
    if row['Technical Score'] >= 30 and row['Marketing Score'] >= 15 and row['Content Score'] >= 15:
        return 'Launch Ready'
    return 'Almost Ready'

df_merged['Launch_Status'] = df_merged.apply(calc_launch_readiness, axis=1)

# Sort by production score
df_sorted = df_merged.sort_values('Production_Score_V2', ascending=False)

# Identify critical gaps by category
def categorize_gap(row):
    if pd.isna(row['Critical Gaps']):
        return 'Unknown'
    gaps = str(row['Critical Gaps']).lower()
    if 'functionality' in gaps or 'product' in gaps or 'core' in gaps:
        return 'Product'
    elif 'content' in gaps or 'documentation' in gaps:
        return 'Content'
    elif 'marketing' in gaps or 'seo' in gaps:
        return 'Marketing'
    else:
        return 'Other'

df_sorted['Gap_Category'] = df_sorted.apply(categorize_gap, axis=1)

# Save enhanced analysis
output = df_sorted[['Company', 'Category', 'Status', 'Stage', 'Technical Score', 'Marketing Score', 
                     'Content Score', 'Comprehensive_Score', 'Production_Score_V2', 'Launch_Status',
                     'Valuation_K', 'Gap_Category', 'Immediate Action']]
output.to_csv('/home/ubuntu/enhanced_portfolio_analysis.csv', index=False)

# Generate enhanced visualizations
matplotlib.rcParams['font.family'] = 'DejaVu Sans'
fig = plt.figure(figsize=(20, 12))
gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)

fig.suptitle('Enhanced Portfolio Analysis: Christmas Eve 2025', fontsize=18, fontweight='bold')

# 1. Top 10 by Production Readiness with Score Breakdown
ax1 = fig.add_subplot(gs[0, :2])
top10 = df_sorted.head(10)
x = np.arange(len(top10))
width = 0.25

ax1.barh(x - width, top10['Technical Score'], width, label='Technical', color='#3498db')
ax1.barh(x, top10['Marketing Score'], width, label='Marketing', color='#e74c3c')
ax1.barh(x + width, top10['Content Score'], width, label='Content', color='#2ecc71')

ax1.set_yticks(x)
ax1.set_yticklabels(top10['Company'])
ax1.set_xlabel('Score', fontweight='bold')
ax1.set_title('Top 10 Companies: Score Breakdown', fontweight='bold')
ax1.legend()
ax1.set_xlim(0, 40)

# 2. Launch Readiness Status
ax2 = fig.add_subplot(gs[0, 2])
launch_counts = df_sorted['Launch_Status'].value_counts()
colors_launch = {'Launch Ready': '#2ecc71', 'Almost Ready': '#f39c12', 
                 'Needs Work': '#e67e22', 'Not Ready': '#e74c3c'}
pie_colors = [colors_launch.get(status, '#95a5a6') for status in launch_counts.index]
ax2.pie(launch_counts.values, labels=launch_counts.index, autopct='%1.0f%%',
        colors=pie_colors, startangle=90)
ax2.set_title('Launch Readiness', fontweight='bold')

# 3. Critical Gaps by Category
ax3 = fig.add_subplot(gs[1, 0])
gap_counts = df_sorted['Gap_Category'].value_counts()
colors_gaps = {'Product': '#e74c3c', 'Content': '#f39c12', 'Marketing': '#3498db', 
               'Other': '#95a5a6', 'Unknown': '#bdc3c7'}
bars = ax3.bar(gap_counts.index, gap_counts.values, 
               color=[colors_gaps.get(g, '#95a5a6') for g in gap_counts.index])
ax3.set_ylabel('Number of Companies', fontweight='bold')
ax3.set_title('Critical Gaps Distribution', fontweight='bold')
ax3.set_xticklabels(gap_counts.index, rotation=45, ha='right')

# 4. Technical vs Marketing Maturity
ax4 = fig.add_subplot(gs[1, 1])
scatter = ax4.scatter(df_sorted['Technical Score'], df_sorted['Marketing Score'],
                     s=df_sorted['Valuation_K']/10, alpha=0.6,
                     c=df_sorted['Production_Score_V2'], cmap='RdYlGn')
ax4.set_xlabel('Technical Score', fontweight='bold')
ax4.set_ylabel('Marketing Score', fontweight='bold')
ax4.set_title('Technical vs Marketing Maturity\n(Size = Valuation)', fontweight='bold')
ax4.axhline(y=15, color='r', linestyle='--', alpha=0.3, label='Min Marketing')
ax4.axvline(x=20, color='r', linestyle='--', alpha=0.3, label='Min Technical')
ax4.legend()
plt.colorbar(scatter, ax=ax4, label='Production Score')

# 5. Content Readiness
ax5 = fig.add_subplot(gs[1, 2])
content_ready = df_sorted[df_sorted['Content Score'] >= 15]
content_not = df_sorted[df_sorted['Content Score'] < 15]
categories = ['Ready (≥15)', 'Not Ready (<15)']
values = [len(content_ready), len(content_not)]
colors_content = ['#2ecc71', '#e74c3c']
ax5.bar(categories, values, color=colors_content)
ax5.set_ylabel('Number of Companies', fontweight='bold')
ax5.set_title('Content Readiness', fontweight='bold')
for i, v in enumerate(values):
    ax5.text(i, v + 0.5, str(v), ha='center', fontweight='bold')

# 6. Production Score Distribution
ax6 = fig.add_subplot(gs[2, :])
companies = df_sorted['Company']
scores = df_sorted['Production_Score_V2']
colors_bar = ['#2ecc71' if s >= 70 else '#f39c12' if s >= 40 else '#e74c3c' for s in scores]
bars = ax6.barh(companies, scores, color=colors_bar)
ax6.set_xlabel('Production Readiness Score', fontweight='bold')
ax6.set_title('All Companies: Production Readiness (Christmas Eve 2025)', fontweight='bold')
ax6.set_xlim(0, 100)
ax6.axvline(x=70, color='g', linestyle='--', alpha=0.3, label='Launch Ready (70+)')
ax6.axvline(x=40, color='orange', linestyle='--', alpha=0.3, label='Almost Ready (40+)')
ax6.legend()

# Add value annotations
for i, (score, val) in enumerate(zip(scores, df_sorted['Valuation_K'])):
    if val > 500:  # Only show high-value companies
        ax6.text(score + 2, i, f'£{val:.0f}K', va='center', fontsize=8)

plt.savefig('/home/ubuntu/enhanced_portfolio_analysis.png', dpi=300, bbox_inches='tight')
print("✅ Enhanced analysis complete!")

# Print detailed summary
print("\n" + "="*80)
print("ENHANCED PORTFOLIO SUMMARY - CHRISTMAS EVE 2025")
print("="*80)
print(f"Total Companies: {len(df_sorted)}")
print(f"Average Technical Score: {df_sorted['Technical Score'].mean():.1f}/40")
print(f"Average Marketing Score: {df_sorted['Marketing Score'].mean():.1f}/30")
print(f"Average Content Score: {df_sorted['Content Score'].mean():.1f}/30")
print(f"Average Production Score: {df_sorted['Production_Score_V2'].mean():.1f}%")

print(f"\n📊 LAUNCH READINESS BREAKDOWN:")
for status, count in launch_counts.items():
    print(f"  {status}: {count} companies")

print(f"\n🚨 CRITICAL GAPS:")
for gap, count in gap_counts.items():
    print(f"  {gap}: {count} companies")

print(f"\n🚀 LAUNCH READY COMPANIES (Can launch this week):")
launch_ready = df_sorted[df_sorted['Launch_Status'] == 'Launch Ready']
for idx, row in launch_ready.iterrows():
    print(f"  ✅ {row['Company']:25s} | Tech: {row['Technical Score']:.0f} | Marketing: {row['Marketing Score']:.0f} | Content: {row['Content Score']:.0f}")

print(f"\n⚠️  ALMOST READY (Need minor fixes):")
almost_ready = df_sorted[df_sorted['Launch_Status'] == 'Almost Ready']
for idx, row in almost_ready.iterrows():
    print(f"  🟡 {row['Company']:25s} | Gap: {row['Gap_Category']} | Action: {row['Immediate Action']}")

print(f"\n🔴 NOT READY (Major work needed):")
not_ready = df_sorted[df_sorted['Launch_Status'] == 'Not Ready']
for idx, row in not_ready.head(5).iterrows():
    print(f"  ❌ {row['Company']:25s} | Status: {row['Status']} | Gap: {row['Gap_Category']}")
