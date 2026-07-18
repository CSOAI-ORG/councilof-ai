---
name: deploy
description: Deploy a project to Vercel and verify
---

Deploy the specified project to Vercel:

1. Check git status — commit if uncommitted changes exist (ask first)
2. Run `vercel deploy --prod --yes` from the project directory
3. Wait for deployment to complete
4. Verify with curl that the deployed URL returns 200
5. Report deployment URL and status

If no project specified, deploy meok/ui (the main site).

Usage: /deploy [project-path]
