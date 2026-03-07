# Context Size Guidance

This repo defaults the 35B coding preset to `122880` tokens (120K).

That choice is about reliability on a Windows desktop, not about squeezing out the absolute last token of context.

## What Was Measured

On the checked-in RTX 5080 16GB test machine:

- The 35B `Q3_K_S` preset can run at full speed with `mmproj` loaded and `--parallel 1`.
- A saved reference artifact at `155904` tokens exists in [results/benchmark_35b_152k_vis_final_20260304.json](../results/benchmark_35b_152k_vis_final_20260304.json).
- That artifact is a text-prompt benchmark against a server that had the vision projector loaded.

Relevant 35B artifacts:

| File | Context | Avg Gen t/s | Avg Prompt t/s |
| --- | --- | --- | --- |
| [benchmark_35b_128k_vis_final_20260304.json](../results/benchmark_35b_128k_vis_final_20260304.json) | 131072 | 119.7 | 523.9 |
| [benchmark_35b_152k_vis_final_20260304.json](../results/benchmark_35b_152k_vis_final_20260304.json) | 155904 | 124.7 | 538.4 |

## Why 120K Is The Repo Default

- It leaves more VRAM headroom for Windows, the desktop compositor, and normal background apps.
- It reduces the chance that a machine with an attached display runs too close to the limit.
- It keeps the shipped launcher, config, and docs centered on the safer daily-driver setting.

In practice:

| Setting | Use |
| --- | --- |
| 120K | Default Windows preset in this repo |
| 155,904 | Measured ceiling case on the original RTX 5080 test machine |

## What This Doc Does Not Claim

- It does not claim that every 16GB NVIDIA GPU will hit the exact same ceiling.
- It does not claim that image requests have the same throughput as text-only requests.
- It does not claim that the current root-cause explanation is fully proven inside `llama.cpp`.

For the fuller hypothesis and historical notes, see [DISCOVERY.md](../DISCOVERY.md).

## Reproducing The 35B Preset

Start the default 35B server:

```bash
python server_manager.py start --server coding
```

Or on Windows:

```bat
start_servers_speed.bat coding
```

Then run:

```bash
python tests/simple_benchmark.py 8002
```

If you publish new context claims, commit the raw JSON file along with the summary.
