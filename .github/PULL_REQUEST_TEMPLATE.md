## Summary

<!-- 1-3 bullets describing what this PR changes and why -->

## Test plan

<!-- Bulleted checklist of what was verified locally and what should be checked in production -->

- [ ] `cd api && .venv/bin/python -c "from app.main import app"` imports clean
- [ ] `cd web && npx tsc --noEmit && npx next build` is clean
- [ ] Manually exercised the new behavior on the Vercel preview URL
