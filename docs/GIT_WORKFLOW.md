# Git Workflow

## Local Layout

Use the `D:` workspaces:

- `D:\Projects\qwen-llm-git` -> dev repo on `personal/dev`
- `D:\Projects\qwen-llm-release-git` -> clean release repo on `main`

## Daily Flow

1. Work in `qwen-llm-git`
2. Commit on `personal/dev`
3. Promote reviewed commits into `qwen-llm-release-git`
4. Validate there
5. Push from `qwen-llm-release-git`

## Helper Scripts

```bash
scripts/windows/setup-worktrees.ps1
scripts/windows/promote-to-release.ps1 <commit-sha>
scripts/windows/check-release.ps1
scripts/windows/push-release.ps1
```

## Rules

- do not treat the dev repo as the release repo
- do not push `main` from the dev repo
- keep release clean
- only reviewed commits should move into release
