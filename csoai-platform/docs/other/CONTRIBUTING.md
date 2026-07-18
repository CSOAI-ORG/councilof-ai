# Contributing to COAI

First off, thank you for considering contributing to COAI! It's people like you who make AI safety a reality for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming, inclusive environment. We expect all contributors to:

- **Be respectful** of differing viewpoints and experiences
- **Accept constructive criticism** gracefully
- **Focus on what is best** for the community and AI safety
- **Show empathy** towards other community members

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

### 💡 Suggesting Features

Feature suggestions are welcome! Please include:

- **Clear description** of the feature
- **Use case** explaining why it's needed
- **Potential implementation** approach (optional)
- **Mockups or examples** if applicable

### 📝 Improving Documentation

Documentation improvements are always welcome:

- Fix typos and grammar
- Add examples and tutorials
- Improve API documentation
- Translate content to other languages

### 🔧 Submitting Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL 8+ or TiDB
- Git

### Local Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/coai-dashboard.git
cd coai-dashboard

# Add upstream remote
git remote add upstream https://github.com/coai-safety/coai-dashboard.git

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Set up database
pnpm db:push

# Seed test data
node scripts/seed-training.mjs

# Start development server
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test server/routers.test.ts
```

---

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** before submitting
4. **Follow the style guidelines** below
5. **Write a clear PR description** explaining your changes
6. **Link related issues** using keywords (Fixes #123)

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated (if applicable)
- [ ] Commit messages are clear
- [ ] PR description explains the changes

---

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for public APIs

```typescript
/**
 * Calculates the compliance score for an AI system.
 * @param systemId - The ID of the AI system
 * @param frameworkId - The compliance framework to check against
 * @returns The compliance score as a percentage (0-100)
 */
async function calculateComplianceScore(
  systemId: number,
  frameworkId: number
): Promise<number> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Use TypeScript interfaces for props
- Follow the existing component structure

```tsx
interface ComplianceCardProps {
  framework: string;
  score: number;
  status: 'compliant' | 'non-compliant' | 'pending';
}

export function ComplianceCard({ framework, score, status }: ComplianceCardProps) {
  return (
    <div className="p-4 rounded-lg border">
      <h3 className="font-semibold">{framework}</h3>
      <p className="text-2xl">{score}%</p>
      <Badge variant={status}>{status}</Badge>
    </div>
  );
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow the existing design system
- Keep custom CSS minimal
- Use CSS variables for theming

### Git Commits

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove)
- Reference issues when applicable

```
Add certification test scoring logic

- Implement score calculation based on correct answers
- Add passing threshold check (70%)
- Issue certificate on successful completion

Fixes #42
```

---

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Discord**: [Join our community](https://discord.gg/coai) (coming soon)

### Recognition

Contributors are recognized in:
- The README contributors section
- Release notes
- Our website's contributors page

---

## Questions?

Feel free to open an issue with the "question" label or reach out to the maintainers.

Thank you for contributing to AI safety! 🙏
