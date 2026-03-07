# Benchmark Results

This file is a concise index for the checked-in benchmark artifacts.

Use the JSON files in this folder as the source of truth when a narrative summary and a raw artifact disagree.

## Test Scope

- Main test machine: RTX 5080 16GB
- Main workflow: one server at a time
- Main 35B measurements: text prompts against a server with `mmproj` loaded
- Main 35B requirement: `--parallel 1`

## 35B Artifacts

| File | Context | Notes | Avg Gen t/s | Avg Prompt t/s |
| --- | --- | --- | --- | --- |
| [benchmark_35b_128k_vis_final_20260304.json](benchmark_35b_128k_vis_final_20260304.json) | 131072 | Text prompts, `mmproj` loaded | 119.7 | 523.9 |
| [benchmark_35b_152k_vis_final_20260304.json](benchmark_35b_152k_vis_final_20260304.json) | 155904 | Text prompts, `mmproj` loaded | 124.7 | 538.4 |

Interpretation:

- These runs support the claim that text generation remains fast with the vision projector loaded.
- They do not, by themselves, prove that image requests have identical throughput.
- The repo default is still 120K on Windows because it leaves more headroom than the 155,904-token reference case.

## 9B Artifacts

Two 9B benchmark files are checked in from different tuning states:

| File | Avg Gen t/s | Avg Prompt t/s |
| --- | --- | --- |
| [benchmark_port8003_20260304_193218.json](benchmark_port8003_20260304_193218.json) | 94.0 | 818.0 |
| [benchmark_port8003_20260304_195811.json](benchmark_port8003_20260304_195811.json) | 109.7 | 884.6 |

Do not collapse these into a single headline number without citing the exact artifact you used.

## 27B Status

The repository currently ships a `quality_vision` preset at 96K context in [config/servers.yaml](../config/servers.yaml), but a raw JSON artifact for the latest 96K 27B run is not checked in here yet.

Treat any 27B speed quoted elsewhere in the repo as approximate unless it is backed by a committed JSON file.

## Key Takeaways

- `--parallel 1` is required for the 35B preset on the tested machine.
- The 35B preset is a one-server-at-a-time setup on 16GB cards.
- `155904` tokens is a useful measured reference point, but the shipped default is `122880`.
- Historical docs in this repo may contain older summary numbers; prefer the artifact files.

## Reproduce

Start the server you want:

```bash
python server_manager.py start --server coding
python server_manager.py start --server fast_vision
python server_manager.py start --server quality_vision
```

Then benchmark:

```bash
python tests/simple_benchmark.py 8002
python tests/simple_benchmark.py 8003
python tests/simple_benchmark.py 8004
```

For image-input checks, use:

```bash
python tests/vision_test.py path/to/image.png
```
