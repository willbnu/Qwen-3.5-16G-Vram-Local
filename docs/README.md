# Documentation Index

This folder contains supporting notes for the repo's 16GB single-server presets.

Current baseline:

- Tested machine: RTX 5080 16GB
- Main 35B preset: `Qwen3.5-35B-A3B-Q3_K_S.gguf`
- Default 35B context in the repo: 120K
- Operating model: one server at a time

## Presets

| Preset | Port | Model | Default Context | Typical Use |
| --- | --- | --- | --- | --- |
| Coding | 8002 | 35B-A3B Q3_K_S | 120K | Primary coding and reasoning |
| Vision | 8003 | 9B UD-Q4_K_XL | 256K | Faster image input and light chat |
| Quality | 8004 | 27B Q3_K_S | 96K | Higher quality output |

## Important Caveats

- The repo is tuned for one server at a time on 16GB cards.
- The 35B benchmark artifacts are text-generation runs against a server with `mmproj` loaded unless a file explicitly says otherwise.
- Exact behavior on other GPUs may differ.

## Documents

| File | Purpose |
| --- | --- |
| [RTX5080-NATIVE-BUILD.md](RTX5080-NATIVE-BUILD.md) | Native SM120 build instructions |
| [CONTEXT_SIZE_ANALYSIS.md](CONTEXT_SIZE_ANALYSIS.md) | Why the repo defaults to 120K on Windows |
| [PERFORMANCE_MATRIX.md](PERFORMANCE_MATRIX.md) | Comparative notes across presets |
| [KV_CACHE_ANALYSIS.md](KV_CACHE_ANALYSIS.md) | KV cache tradeoffs |
| [27B_OPTIMIZATION_ANALYSIS.md](27B_OPTIMIZATION_ANALYSIS.md) | 27B tuning notes |
| [RESEARCH_FINDINGS.md](RESEARCH_FINDINGS.md) | Research log and references |
| [HERETIC_COMPARISON.md](HERETIC_COMPARISON.md) | Uncensored model notes |
