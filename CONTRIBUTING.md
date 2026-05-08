# Contributing

Thanks for your interest in `ai-portfolio-agent`. The workflow is intentionally light.

## Workflow

1. **Branch off `main`.** Use a kebab-case prefix that matches the change type: `feat/<slice>`, `fix/<bug>`, `chore/<task>`, `docs/<area>`.
2. **One slice per branch.** Each PR should land a single coherent change — easier to review, easier to roll back.
3. **Keep commits descriptive.** First line is imperative ("feat(storyteller): ..."), body explains *why*.
4. **Open a pull request against `main`.** The PR description should include a Summary and a Test plan. CI / Vercel preview deploys must be green.
5. **Squash on merge.** Keeps `main` linear and readable.

## Local checks before pushing

```bash
# api
cd api && .venv/bin/python -c "from app.main import app"   # imports clean
# web
cd web && npx tsc --noEmit && npx next build              # types + build clean
```

## Slice ideas

The roadmap in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) lists the planned slices. A few good first issues:

- Vercel connector (read deployments, match to repos)
- LinkedIn connector
- Instagram connector
- Per-user OAuth so write-side actions don't share a server token
- Diagram generation for the README Update Agent
- Background sync workers when connectors get heavy

## License

By contributing, you agree that your contributions are licensed under the project's [PolyForm Noncommercial 1.0.0 license](LICENSE).
