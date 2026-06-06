#!/usr/bin/env node

/**
 * Post Visual Test Results to GitLab Merge Request
 * 
 * Creates or updates a comment on the MR with visual test results
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(process.cwd(), 'test-results', 'results.json');

async function postMRComment() {
  const gitlabToken = process.env.GITLAB_TOKEN;
  const projectId = process.env.CI_PROJECT_ID;
  const mrIid = process.env.CI_MERGE_REQUEST_IID;
  const pipelineUrl = process.env.CI_PIPELINE_URL;

  if (!gitlabToken) {
    console.log('GITLAB_TOKEN not set, skipping MR comment');
    return;
  }

  if (!projectId || !mrIid) {
    console.log('Not running in MR context, skipping comment');
    return;
  }

  // Parse results
  let summary = '## 📸 Visual Regression Test Results\n\n';
  
  if (fs.existsSync(RESULTS_FILE)) {
    const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const failedTestDetails = [];
    
    if (results.suites) {
      for (const suite of results.suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            totalTests++;
            if (spec.ok) {
              passedTests++;
            } else {
              failedTests++;
              failedTestDetails.push(spec.title);
            }
          }
        }
      }
    }

    if (failedTests > 0) {
      summary += `❌ **${failedTests} visual regression(s) detected**\n\n`;
      summary += '### Failed Tests\n\n';
      failedTestDetails.forEach(title => {
        summary += `- ❌ ${title}\n`;
      });
      summary += `\n[View full report](${pipelineUrl})\n\n`;
      summary += '> To update baselines, trigger the "update-baselines" manual job.';
    } else {
      summary += `✅ **All ${totalTests} visual tests passed**\n\n`;
      summary += 'No visual regressions detected.';
    }
  } else {
    summary += '⚠️ Test results not available. Check pipeline logs for details.';
  }

  // GitLab API base URL
  const gitlabUrl = process.env.CI_SERVER_URL || 'https://gitlab.com';
  const apiBase = `${gitlabUrl}/api/v4`;

  try {
    // Find existing bot comment
    const notesResponse = await fetch(
      `${apiBase}/projects/${projectId}/merge_requests/${mrIid}/notes`,
      {
        headers: { 'PRIVATE-TOKEN': gitlabToken },
      }
    );

    if (!notesResponse.ok) {
      throw new Error(`Failed to fetch notes: ${notesResponse.statusText}`);
    }

    const notes = await notesResponse.json();
    const botNote = notes.find(n => 
      n.body.includes('Visual Regression Test Results') && n.system === false
    );

    if (botNote) {
      // Update existing comment
      await fetch(
        `${apiBase}/projects/${projectId}/merge_requests/${mrIid}/notes/${botNote.id}`,
        {
          method: 'PUT',
          headers: {
            'PRIVATE-TOKEN': gitlabToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: summary }),
        }
      );
      console.log('Updated existing MR comment');
    } else {
      // Create new comment
      await fetch(
        `${apiBase}/projects/${projectId}/merge_requests/${mrIid}/notes`,
        {
          method: 'POST',
          headers: {
            'PRIVATE-TOKEN': gitlabToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: summary }),
        }
      );
      console.log('Created new MR comment');
    }
  } catch (error) {
    console.error('Error posting MR comment:', error.message);
  }
}

postMRComment().catch(console.error);
