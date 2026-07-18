# Visual Regression Testing with Chromatic

This project uses **Chromatic** for automated visual regression testing to catch unintended UI changes and branding inconsistencies.

## Setup

### 1. Create Chromatic Account

1. Visit [chromatic.com](https://www.chromatic.com/)
2. Sign up with your GitHub account
3. Create a new project and link it to your repository
4. Copy your project token

### 2. Configure Project Token

Add your Chromatic project token to the environment:

```bash
# Add to .env file
CHROMATIC_PROJECT_TOKEN=your_project_token_here
```

Or set it in your CI/CD pipeline as a secret environment variable.

### 3. Update Configuration

Edit `chromatic.config.json` and replace `PROJECT_TOKEN_PLACEHOLDER` with your actual project ID.

## Usage

### Run Visual Tests Locally

```bash
# Build and run Chromatic tests
pnpm chromatic

# Run with specific branch
pnpm chromatic --branch-name=feature/new-design

# Auto-accept changes on main branch
pnpm chromatic --auto-accept-changes=main
```

### Add to Package Scripts

The following scripts have been added to `package.json`:

```json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes",
    "chromatic:ci": "chromatic --exit-once-uploaded"
  }
}
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/chromatic.yml`:

```yaml
name: Visual Regression Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true
```

## What Gets Tested

Chromatic automatically captures visual snapshots of:

- **All pages** in the application
- **Component states** (hover, focus, error, loading)
- **Responsive breakpoints** (mobile, tablet, desktop)
- **Theme variations** (light/dark mode)

## Key Pages to Monitor

The following pages are critical for branding consistency:

1. **Public Pages**
   - Home (`/`)
   - About (`/about`)
   - Enterprise (`/enterprise`)
   - Watchdog (`/watchdog`)
   - Training (`/training`)
   - Certification (`/certification`)

2. **Members UI**
   - Dashboard (`/dashboard`)
   - Training Modules (`/training`)
   - Courses (`/courses`)
   - Workbench (`/workbench`)
   - Settings (`/settings`)

3. **Components**
   - Header with mega menu
   - Footer
   - Cards and badges
   - Buttons (all variants)
   - Forms and inputs

## Reviewing Changes

1. **Chromatic Dashboard**: Visit your project dashboard at chromatic.com
2. **Review Snapshots**: Compare before/after screenshots
3. **Accept or Reject**: Approve intentional changes, reject bugs
4. **Baseline Updates**: Accepted changes become the new baseline

## Best Practices

### When to Run Tests

- **Before every commit**: Catch issues early
- **On pull requests**: Prevent regressions from merging
- **After dependency updates**: Ensure UI consistency

### Handling Changes

- **Intentional changes**: Accept in Chromatic dashboard
- **Unintended changes**: Fix the code and re-run tests
- **Baseline drift**: Regularly review and update baselines

### Performance Tips

- Use `--exit-zero-on-changes` for non-blocking CI
- Run on specific branches to save build minutes
- Use `--only-changed` to test only modified components

## Troubleshooting

### Build Failures

```bash
# Clear build cache
rm -rf dist/ .vite/

# Rebuild and test
pnpm build && pnpm chromatic
```

### Snapshot Differences

- Check for dynamic content (dates, random IDs)
- Verify font loading is complete
- Ensure images are fully loaded
- Check for animation timing issues

### CI/CD Issues

- Verify `CHROMATIC_PROJECT_TOKEN` is set
- Check GitHub Actions logs for errors
- Ensure `fetch-depth: 0` for full git history

## Resources

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Visual Testing Guide](https://www.chromatic.com/docs/test)
- [CI/CD Integration](https://www.chromatic.com/docs/ci)
- [Troubleshooting](https://www.chromatic.com/docs/troubleshooting)

## Branding Consistency Checklist

Use Chromatic to verify:

- ✅ All buttons use emerald/green colors (not blue)
- ✅ Progress bars are green
- ✅ Badges use consistent green theme
- ✅ Icons match the color scheme
- ✅ Hover states are emerald/green
- ✅ Loading skeletons match design
- ✅ Error states are red (not blue)
- ✅ Success states are green
- ✅ Typography is consistent
- ✅ Spacing follows design system

## Maintenance

- **Weekly**: Review pending snapshots
- **Monthly**: Update baselines for intentional changes
- **Quarterly**: Audit all snapshots for consistency
