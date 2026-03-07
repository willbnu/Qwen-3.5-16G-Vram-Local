# Contributing to Qwen3.5 Local LLM

Thanks for your interest in contributing! This project aims to provide optimized configurations for running Qwen3.5 models on 16GB GPUs.

## Quick Links

- [Report a Bug](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/issues/new?template=bug_report.md)
- [Report GPU Compatibility](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/issues/new?template=gpu_report.md)
- [Join Discussions](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/discussions)

## Ways to Contribute

### 1. GPU Compatibility Reports

Help expand GPU compatibility data! Test on your 16GB card and report:

| Field | Example |
|-------|---------|
| GPU + VRAM | RTX 4080 16GB |
| llama.cpp version | b8500 |
| `CUDA_Host compute buffer` at cliff | 313.02 MB |
| Context size at cliff | 156,160 |
| Speed before / after | 85 t/s → 8 t/s |

Use the [GPU Report template](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/issues/new?template=gpu_report.md).

### 2. Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `pytest tests/`
5. Commit: Use conventional commit format (see below)
6. Push: `git push origin feat/my-feature`
7. Open a Pull Request

### 3. Documentation

- Fix typos or unclear sections
- Add troubleshooting tips
- Improve code examples
- Translate documentation

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (for dashboard)
- llama.cpp with CUDA support
- NVIDIA GPU with 16GB+ VRAM

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Qwen-3.5-16G-Vram-Local.git
cd Qwen-3.5-16G-Vram-Local

# Python dependencies
pip install -r requirements.txt

# Dashboard (optional)
cd dashboard && npm install
```

### Running Tests

```bash
# Python tests
pytest tests/ -v

# Specific test
pytest tests/test_config_loader.py -v

# Dashboard lint
cd dashboard && npm run lint
```

## Maintainer Workflow

Repository maintainers use a two-worktree setup locally:

- `qwen-llm` on `personal/dev` for normal development
- `qwen-llm-release` on `main` for clean review and pushes

Windows helper scripts:

```powershell
scripts/windows/setup-worktrees.ps1
scripts/windows/promote-to-release.ps1 <commit-sha>
scripts/windows/check-release.ps1
scripts/windows/push-release.ps1
```

Maintainer rules:

1. Do everyday work in `qwen-llm`
2. Never push from the dev workspace
3. Promote only reviewed commits into `qwen-llm-release`
4. Run release checks in `qwen-llm-release`
5. Push only from `qwen-llm-release`

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add 27B server config` |
| `fix` | Bug fix | `fix: correct mmproj path` |
| `docs` | Documentation | `docs: update README speed table` |
| `perf` | Performance | `perf: optimize KV cache settings` |
| `refactor` | Code cleanup | `refactor: simplify config loader` |
| `test` | Tests | `test: add benchmark edge cases` |
| `chore` | Maintenance | `chore: update dependencies` |

## Code Style

### Python

- Use `pathlib.Path` for file paths
- Type hints on public functions
- Docstrings on modules and public functions
- Follow PEP 8 formatting

### TypeScript (Dashboard)

- React 19 + TypeScript strict mode
- Zustand for state management
- Tailwind CSS for styling
- Run `npm run lint` before committing

## Pull Request Guidelines

1. **Small PRs**: One logical change per PR
2. **Tests**: Add tests for new functionality
3. **Documentation**: Update docs for user-facing changes
4. **Changelog**: Add entry to CHANGELOG.md for significant changes
5. **AGENTS.md**: Update if code patterns change

## Branch Protection

The `main` branch is protected:
- Requires passing CI tests
- Requires review for external contributors
- No force pushes

### For Repository Admins: Recommended Settings

Configure branch protection at **Settings → Branches → Add rule** for `main`:

| Setting | Recommendation | Reason |
| ------- | -------------- | ------ |
| Require a pull request before merging | ✅ Enabled | Prevents direct pushes |
| Required approvals | 1 | Ensures code review |
| Dismiss stale PR approvals | ✅ Enabled | Re-review after changes |
| Require status checks | ✅ Enabled | CI must pass |
| Status checks: `test` | ✅ Required | Python tests |
| Status checks: `dashboard` | ✅ Required | Dashboard build |
| Require branches to be up to date | ✅ Enabled | Catches merge conflicts |
| Require linear history | Optional | Clean git history |
| Allow force pushes | ❌ Disabled | Prevents history loss |
| Allow deletions | ❌ Disabled | Prevents accidental deletion |

**Screenshot reference:**
```
Settings → Branches → Branch protection rules
→ Add rule → Branch name pattern: main
→ Check: Require a pull request before merging
→ Check: Require status checks to pass before merging
→ Select: test (Python Tests), dashboard (Dashboard Build)
```

## Questions?

- Open a [Discussion](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/discussions)
- Check existing [Issues](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
