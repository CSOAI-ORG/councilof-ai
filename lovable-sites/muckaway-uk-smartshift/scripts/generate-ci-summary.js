#!/usr/bin/env node

/**
 * Generate CI Summary for Visual Regression Tests
 * 
 * Parses Playwright test results and generates a GitHub Actions summary
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(process.cwd(), 'test-results', 'results.json');
const SUMMARY_FILE = process.env.GITHUB_STEP_SUMMARY || path.join(process.cwd(), 'test-results', 'summary.md');

function generateSummary() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.log('No results file found at:', RESULTS_FILE);
    return;
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  
  let summary = '# 📸 Visual Regression Test Report\n\n';
  
  // Calculate statistics
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  const failedTestDetails = [];
  
  if (results.suites) {
    for (const suite of results.suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          totalTests++;
          if (spec.ok) {
            passedTests++;
          } else if (spec.tests?.some(t => t.status === 'skipped')) {
            skippedTests++;
          } else {
            failedTests++;
            failedTestDetails.push({
              title: spec.title,
              file: spec.file,
              line: spec.line,
            });
          }
        }
      }
    }
  }

  // Summary statistics
  summary += '## Summary\n\n';
  summary += `| Metric | Count |\n`;
  summary += `|--------|-------|\n`;
  summary += `| ✅ Passed | ${passedTests} |\n`;
  summary += `| ❌ Failed | ${failedTests} |\n`;
  summary += `| ⏭️ Skipped | ${skippedTests} |\n`;
  summary += `| 📊 Total | ${totalTests} |\n\n`;

  // Status badge
  if (failedTests > 0) {
    summary += '> ❌ **Visual regressions detected!** Please review the differences below.\n\n';
  } else {
    summary += '> ✅ **All visual tests passed!** No regressions detected.\n\n';
  }

  // Failed tests details
  if (failedTestDetails.length > 0) {
    summary += '## ❌ Failed Tests\n\n';
    summary += '| Test | File | Line |\n';
    summary += '|------|------|------|\n';
    
    for (const test of failedTestDetails) {
      summary += `| ${test.title} | ${test.file} | ${test.line} |\n`;
    }
    summary += '\n';
    
    summary += '### How to Fix\n\n';
    summary += '1. **Review the differences** in the Playwright HTML report\n';
    summary += '2. **If intentional**: Update baselines by running `npm run test:visual:update`\n';
    summary += '3. **If unintentional**: Fix the visual regression in your code\n\n';
  }

  // Duration info
  if (results.stats) {
    const duration = results.stats.duration ? (results.stats.duration / 1000).toFixed(2) : 'N/A';
    summary += `---\n\n`;
    summary += `⏱️ Duration: ${duration}s | `;
    summary += `📅 ${new Date().toISOString()}\n`;
  }

  // Write summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(SUMMARY_FILE, summary);
    console.log('Summary written to GITHUB_STEP_SUMMARY');
  } else {
    fs.writeFileSync(SUMMARY_FILE, summary);
    console.log('Summary written to:', SUMMARY_FILE);
  }

  // Also output to console
  console.log('\n' + summary);

  // Exit with error if there were failures
  if (failedTests > 0) {
    process.exit(1);
  }
}

try {
  generateSummary();
} catch (error) {
  console.error('Error generating summary:', error);
  process.exit(1);
}
