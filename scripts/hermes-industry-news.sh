#!/bin/bash
# Hermes daily industry news scanner — across all MEOK verticals
# Cron: 30 6 * * * (6:30 AM UTC, after EUR-Lex sync)
# Scans regulatory authority news feeds across all industries we cover

set -e
LOG=~/.hermes/logs/industry-news.log
mkdir -p ~/.hermes/logs

echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) — Industry News Scan =====" >> "$LOG"

# Industry → news feed mapping
declare -A FEEDS
FEEDS=(
  ["EU_AI_Office"]="https://digital-strategy.ec.europa.eu/en/rss/all/news"
  ["EBA"]="https://www.eba.europa.eu/news-press/rss"
  ["ICO_UK"]="https://ico.org.uk/about-the-ico/news-and-events/news-and-blogs/rss/"
  ["FCA_UK"]="https://www.fca.org.uk/news/rss.xml"
  ["FDA_US"]="https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml"
  ["NIST_CSF"]="https://www.nist.gov/cyberframework/rss.xml"
  ["MHRA_UK"]="https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency.atom"
  ["FSA_UK"]="https://www.food.gov.uk/news-alerts/rss/news"
)

for source in "${!FEEDS[@]}"; do
  url="${FEEDS[$source]}"
  echo "" >> "$LOG"
  echo "--- $source ($url) ---" >> "$LOG"
  curl -s "$url" -A "MEOK-Hermes/1.0" --max-time 10 2>/dev/null \
    | python3 -c "
import sys, re
text = sys.stdin.read()
# Try Atom first, then RSS
titles = re.findall(r'<title[^>]*>([^<]+)</title>', text)
# Skip feed-level title (first one)
for t in titles[1:4]:
    if len(t.strip()) > 10:
        print(f'  • {t.strip()[:150]}')
" >> "$LOG" 2>&1 || echo "  (feed unreachable)" >> "$LOG"
done

echo "" >> "$LOG"
