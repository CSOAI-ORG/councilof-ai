#!/usr/bin/env python3
"""
Comprehensive link tester for FishKeeper.ai and KoiKeeper.ai
Crawls all pages and identifies 404 errors and broken links
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from collections import defaultdict

class LinkTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.domain = urlparse(base_url).netloc
        self.visited = set()
        self.to_visit = {base_url}
        self.results = {
            '200_ok': [],
            '404_not_found': [],
            '500_errors': [],
            'other_errors': [],
            'timeouts': []
        }
        
    def is_same_domain(self, url):
        """Check if URL belongs to the same domain"""
        return urlparse(url).netloc == self.domain
    
    def normalize_url(self, url):
        """Remove fragments and normalize URL"""
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    
    def test_url(self, url):
        """Test a single URL and return status"""
        try:
            response = requests.get(url, timeout=10, allow_redirects=True)
            return response.status_code, response.url
        except requests.Timeout:
            return 'timeout', url
        except Exception as e:
            return f'error: {str(e)}', url
    
    def extract_links(self, url, html):
        """Extract all links from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        
        # Find all <a> tags
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            full_url = urljoin(url, href)
            normalized = self.normalize_url(full_url)
            
            # Only add same-domain links
            if self.is_same_domain(normalized):
                links.add(normalized)
        
        return links
    
    def crawl(self, max_pages=100):
        """Crawl the site and test all links"""
        pages_tested = 0
        
        print(f"\n🔍 Starting crawl of {self.base_url}")
        print(f"{'='*60}\n")
        
        while self.to_visit and pages_tested < max_pages:
            url = self.to_visit.pop()
            
            if url in self.visited:
                continue
            
            self.visited.add(url)
            pages_tested += 1
            
            print(f"[{pages_tested}/{max_pages}] Testing: {url}")
            
            # Test the URL
            status, final_url = self.test_url(url)
            
            # Categorize result
            if status == 200:
                self.results['200_ok'].append(url)
                print(f"  ✅ OK (200)")
                
                # Get HTML and extract more links
                try:
                    response = requests.get(url, timeout=10)
                    new_links = self.extract_links(url, response.text)
                    self.to_visit.update(new_links - self.visited)
                except:
                    pass
                    
            elif status == 404:
                self.results['404_not_found'].append(url)
                print(f"  ❌ NOT FOUND (404)")
                
            elif status == 'timeout':
                self.results['timeouts'].append(url)
                print(f"  ⏱️  TIMEOUT")
                
            elif isinstance(status, int) and 500 <= status < 600:
                self.results['500_errors'].append(url)
                print(f"  🔥 SERVER ERROR ({status})")
                
            else:
                self.results['other_errors'].append((url, status))
                print(f"  ⚠️  ERROR: {status}")
            
            # Be nice to the server
            time.sleep(0.5)
        
        print(f"\n{'='*60}")
        print(f"✅ Crawl complete! Tested {pages_tested} pages\n")
    
    def generate_report(self):
        """Generate a summary report"""
        total = len(self.visited)
        
        report = f"""
{'='*60}
LINK TEST REPORT: {self.base_url}
{'='*60}

📊 SUMMARY:
  Total URLs Tested: {total}
  ✅ Working (200): {len(self.results['200_ok'])}
  ❌ Not Found (404): {len(self.results['404_not_found'])}
  🔥 Server Errors (5xx): {len(self.results['500_errors'])}
  ⏱️  Timeouts: {len(self.results['timeouts'])}
  ⚠️  Other Errors: {len(self.results['other_errors'])}

"""
        
        if self.results['404_not_found']:
            report += f"\n🔴 404 NOT FOUND ERRORS ({len(self.results['404_not_found'])}):\n"
            report += "-" * 60 + "\n"
            for url in sorted(self.results['404_not_found']):
                report += f"  • {url}\n"
        
        if self.results['500_errors']:
            report += f"\n🔥 SERVER ERRORS ({len(self.results['500_errors'])}):\n"
            report += "-" * 60 + "\n"
            for url in sorted(self.results['500_errors']):
                report += f"  • {url}\n"
        
        if self.results['timeouts']:
            report += f"\n⏱️  TIMEOUTS ({len(self.results['timeouts'])}):\n"
            report += "-" * 60 + "\n"
            for url in sorted(self.results['timeouts']):
                report += f"  • {url}\n"
        
        if self.results['other_errors']:
            report += f"\n⚠️  OTHER ERRORS ({len(self.results['other_errors'])}):\n"
            report += "-" * 60 + "\n"
            for url, error in sorted(self.results['other_errors']):
                report += f"  • {url}\n    Error: {error}\n"
        
        report += "\n" + "=" * 60 + "\n"
        
        return report

def main():
    """Test both FishKeeper.ai and KoiKeeper.ai"""
    
    sites = [
        'https://fishkeeper.ai',
        'https://koikeeper.ai'
    ]
    
    all_reports = []
    
    for site in sites:
        tester = LinkTester(site)
        tester.crawl(max_pages=50)  # Test up to 50 pages per site
        report = tester.generate_report()
        all_reports.append(report)
        print(report)
    
    # Save combined report
    with open('/home/ubuntu/link_test_report.txt', 'w') as f:
        f.write("\n\n".join(all_reports))
    
    print("\n📄 Full report saved to: /home/ubuntu/link_test_report.txt")

if __name__ == "__main__":
    main()
