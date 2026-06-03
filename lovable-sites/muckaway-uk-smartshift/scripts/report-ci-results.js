#!/usr/bin/env node

/**
 * Report CI Visual Test Results to Backend
 * 
 * Sends visual test results to the Supabase edge function for storage and notifications
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(process.cwd(), 'test-results', 'results.json');

async function reportResults() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Supabase credentials not configured, skipping CI result reporting');
    return;
  }

  if (!fs.existsSync(RESULTS_FILE)) {
    console.log('No results file found, skipping CI result reporting');
    return;
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  
  // Parse results
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failedRoutes = [];
  
  if (results.suites) {
    for (const suite of results.suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          totalTests++;
          if (spec.ok) {
            passedTests++;
          } else {
            failedTests++;
            
            // Extract route path from test title
            const match = spec.title.match(/\(([^)]+)\)/);
            const routePath = match ? match[1] : spec.title;
            
            failedRoutes.push({
              route_path: routePath,
              title: spec.title,
              diff_percentage: null, // Playwright doesn't provide this directly
              viewport: 'desktop-chrome', // From project name
            });
          }
        }
      }
    }
  }

  // Only report if there were failures
  if (failedTests === 0) {
    console.log('All tests passed, no failures to report');
    return;
  }

  // Prepare payload
  const payload = {
    test_run_id: process.env.GITHUB_RUN_ID || `ci-${Date.now()}`,
    total_tests: totalTests,
    passed_tests: passedTests,
    failed_tests: failedTests,
    failed_routes: failedRoutes,
    ci_info: {
      provider: process.env.GITLAB_CI ? 'gitlab' : 'github',
      run_id: process.env.GITHUB_RUN_ID || process.env.CI_PIPELINE_ID,
      pr_number: process.env.GITHUB_PR_NUMBER || process.env.CI_MERGE_REQUEST_IID,
      repository: process.env.GITHUB_REPOSITORY || process.env.CI_PROJECT_PATH,
      commit_sha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA,
      ref: process.env.GITHUB_REF || process.env.CI_COMMIT_REF_NAME,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ci-visual-test-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to report CI results:', error);
      return;
    }

    const result = await response.json();
    console.log('CI results reported successfully:', result);
  } catch (error) {
    console.error('Error reporting CI results:', error.message);
  }
}

reportResults().catch(console.error);
