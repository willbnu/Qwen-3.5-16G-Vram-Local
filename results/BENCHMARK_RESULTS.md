# Benchmark Results

This file is a concise index for the checked-in benchmark artifacts.

Use the JSON files in this folder as the source of truth when a narrative summary and a raw artifact disagree.

## Test Scope

- Main test machine: RTX 5080 16GB
- Main workflow: one server at a time
- Main 35B measurements: text prompts against a server with `mmproj` loaded
- Main 35B requirement: `--parallel 1`
- Native RTX 5080 runs should prefer the SM120 build in `llama.cpp/build-sm120/bin/Release`
- Best benchmark runs were taken after reboot from a clean baseline near `15977 MiB free / 0 MiB used`

## 35B Artifacts

| File | Context | Notes | Avg Gen t/s | Avg Prompt t/s |
| --- | --- | --- | --- | --- |
| [benchmark_35b_128k_vis_final_20260304.json](benchmark_35b_128k_vis_final_20260304.json) | 131072 | Text prompts, `mmproj` loaded | 119.7 | 523.9 |
| [benchmark_35b_152k_vis_final_20260304.json](benchmark_35b_152k_vis_final_20260304.json) | 155904 | Text prompts, `mmproj` loaded | 124.7 | 538.4 |
| [benchmark_35b_vs_best9b_20260307_195848.json](benchmark_35b_vs_best9b_20260307_195848.json) | 65536 | Direct 35B vs strongest-weight 9B comparison | 112.3 | see JSON |
| [benchmark_35b256k_vs_9b256k_20260307_200226.json](benchmark_35b256k_vs_9b256k_20260307_200226.json) | 262144 | Best 35B long-context comparison against strongest-weight 9B | 91.3 | see JSON |

Interpretation:

- These runs support the claim that text generation remains fast with the vision projector loaded.
- They do not, by themselves, prove that image requests have identical throughput.
- The repo now ships a 256K coding preset, but that should be treated as a max-context profile rather than the safest daily default.

## 9B Artifacts

Two 9B benchmark files are checked in from different tuning states:

| File | Avg Gen t/s | Avg Prompt t/s |
| --- | --- | --- |
| [benchmark_port8003_20260304_193218.json](benchmark_port8003_20260304_193218.json) | 94.0 | 818.0 |
| [benchmark_port8003_20260304_195811.json](benchmark_port8003_20260304_195811.json) | 109.7 | 884.6 |
| [benchmark_9b_power_20260307_195552.json](benchmark_9b_power_20260307_195552.json) | UD-Q4_K_XL vs Q6_K vs Q8_0 | see JSON |

Do not collapse these into a single headline number without citing the exact artifact you used.

Current 9B conclusions:

- Fastest practical 9B: `Qwen3.5-9B-UD-Q4_K_XL + q8_0 + 256K`
- Strongest-weight 9B tested: `Qwen_Qwen3.5-9B-Q8_0 + q8_0 + 256K`
- Best quality-up tradeoff above the practical baseline: `Q6_K + q8_0 + 256K`

## 27B Status

The repository currently ships a `quality_vision` preset at 96K context in [config/servers.yaml](../config/servers.yaml), but the most important newer experimental artifacts are:

| File | Config | Notes |
| --- | --- | --- |
| [best_models_27b32k_20260307_194413.json](best_models_27b32k_20260307_194413.json) | `IQ4_XS + iq4_nl + 32K` | current best 27B speed/quality point |
| [benchmark_iq4xs_vision_20260307_160309.json](benchmark_iq4xs_vision_20260307_160309.json) | `IQ4_XS + iq4_nl + 32K/64K` with `mmproj` | validated 27B IQ4_XS vision path |

Treat any 27B speed quoted elsewhere in the repo as approximate unless it is backed by a committed JSON file.

## Key Takeaways

- `--parallel 1` is required for the 35B preset on the tested machine.
- The 35B preset is a one-server-at-a-time setup on 16GB cards.
- `155904` tokens is still a useful measured reference point, even though the shipped coding preset is now `262144`.
- Historical docs in this repo may contain older summary numbers; prefer the artifact files.
- Strongest overall model on this machine remains `35B Q3_K_S`.
- Best 27B configuration is `IQ4_XS + iq4_nl`, especially at `32K`.
- Best practical 9B remains `UD-Q4_K_XL + q8_0`, even though `Q8_0` is the heaviest 9B quant tested.
- `35B @ 256K + iq4_nl` is validated, but it is an edge-fit profile rather than the safest default.

## VRAM Recording Rules

Every meaningful benchmark should record:

- `nvidia-smi` free/used VRAM before launch
- `llama.cpp` projected device memory use
- `llama.cpp` effective free device memory during fit
- KV buffer size
- recurrent-state buffer size where applicable

These numbers often explain speed regressions better than the headline `t/s`.

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
