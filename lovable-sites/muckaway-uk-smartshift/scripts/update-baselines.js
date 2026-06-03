#!/usr/bin/env node

/**
 * Visual Test Baseline Management CLI
 * 
 * Interactive tool for managing visual regression test baselines
 * 
 * Usage:
 *   npm run visual:update      - Update all baselines
 *   npm run visual:update:interactive - Interactive mode
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SNAPSHOTS_DIR = path.join(process.cwd(), 'e2e', '__snapshots__');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function getSnapshotFiles() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return [];
  }

  const files = [];
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.png')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(SNAPSHOTS_DIR);
  return files;
}

async function runInteractiveUpdate() {
  console.log('\n📸 Visual Test Baseline Manager\n');
  console.log('This tool helps you manage visual regression test baselines.\n');

  const snapshots = await getSnapshotFiles();
  
  if (snapshots.length === 0) {
    console.log('No existing baselines found. Run tests first to create baselines.');
    console.log('\n  npx playwright test --update-snapshots\n');
    rl.close();
    return;
  }

  console.log(`Found ${snapshots.length} baseline screenshots.\n`);

  const action = await ask(
    'What would you like to do?\n' +
    '  1. Update all baselines\n' +
    '  2. Run tests and compare against current baselines\n' +
    '  3. Delete all baselines and regenerate\n' +
    '  4. View baseline statistics\n' +
    '  5. Exit\n\n' +
    'Enter choice (1-5): '
  );

  switch (action.trim()) {
    case '1':
      await updateAllBaselines();
      break;
    case '2':
      await runTests();
      break;
    case '3':
      await regenerateBaselines();
      break;
    case '4':
      await showStatistics(snapshots);
      break;
    case '5':
      console.log('Goodbye!');
      break;
    default:
      console.log('Invalid choice');
  }

  rl.close();
}

async function updateAllBaselines() {
  console.log('\n🔄 Updating all baselines...\n');
  
  try {
    execSync('npx playwright test --update-snapshots', { 
      stdio: 'inherit',
      env: { ...process.env, CI: '' },
    });
    console.log('\n✅ Baselines updated successfully!');
    console.log('\nDon\'t forget to commit the updated baselines:');
    console.log('  git add e2e/__snapshots__');
    console.log('  git commit -m "Update visual test baselines"');
  } catch (error) {
    console.error('\n❌ Failed to update baselines');
  }
}

async function runTests() {
  console.log('\n🧪 Running visual tests...\n');
  
  try {
    execSync('npx playwright test', { 
      stdio: 'inherit',
      env: { ...process.env, CI: '' },
    });
    console.log('\n✅ All visual tests passed!');
  } catch (error) {
    console.log('\n❌ Some visual tests failed. Review the report:');
    console.log('  npx playwright show-report');
  }
}

async function regenerateBaselines() {
  const confirm = await ask('\n⚠️  This will delete all existing baselines. Continue? (y/N): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }

  console.log('\n🗑️  Deleting existing baselines...');
  
  if (fs.existsSync(SNAPSHOTS_DIR)) {
    fs.rmSync(SNAPSHOTS_DIR, { recursive: true });
  }

  console.log('📸 Regenerating baselines...\n');
  
  await updateAllBaselines();
}

async function showStatistics(snapshots) {
  console.log('\n📊 Baseline Statistics\n');
  
  let totalSize = 0;
  const byProject = {};
  
  for (const file of snapshots) {
    const stat = fs.statSync(file);
    totalSize += stat.size;
    
    // Extract project name from path
    const relativePath = path.relative(SNAPSHOTS_DIR, file);
    const parts = relativePath.split(path.sep);
    const project = parts.length > 1 ? parts[0] : 'default';
    
    if (!byProject[project]) {
      byProject[project] = { count: 0, size: 0 };
    }
    byProject[project].count++;
    byProject[project].size += stat.size;
  }

  console.log(`Total baselines: ${snapshots.length}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  console.log('By project:');
  for (const [project, data] of Object.entries(byProject)) {
    console.log(`  ${project}: ${data.count} files (${(data.size / 1024).toFixed(1)} KB)`);
  }
}

// Check if running in interactive mode
const isInteractive = process.argv.includes('--interactive') || process.argv.includes('-i');

if (isInteractive) {
  runInteractiveUpdate().catch(console.error);
} else {
  // Default: just update baselines
  updateAllBaselines().then(() => {
    rl.close();
  });
}
