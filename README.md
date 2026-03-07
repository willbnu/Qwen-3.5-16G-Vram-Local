# qwen-llm

Tested configs, launchers, and benchmark helpers for running Qwen3.5 GGUF models on a single 16GB NVIDIA GPU with `llama.cpp`.

This repo is aimed at people who want a fast local Qwen setup without reverse-engineering a pile of Discord messages, Reddit comments, and half-working launch flags.

It stays strict about evidence, but it should still feel useful at a glance: what works, what was measured, what ships in the repo, and what still needs more data.

| What you get | Current repo stance |
| --- | --- |
| 35B coding preset that fits a 16GB card | Verified on the checked-in RTX 5080 test machine |
| Vision-capable local setup | Implemented and usable, but image throughput claims are kept narrower than text benchmarks |
| One-command launchers and API helper | Shipped in this repo |
| Benchmark numbers | Backed by checked-in JSON artifacts |
| Cross-GPU claims | Treated as estimates until reproduced elsewhere |

## Why This Repo Exists 🚀

- The 35B preset is the main attraction: a practical local coding model that still feels fast on a single 16GB GPU.
- The repo keeps the launchers, config, helper scripts, and benchmark artifacts in one place so people can reproduce the setup instead of copy-pasting random command lines.
- The goal is not to sound maximalist. The goal is to help someone get from zero to a working, measured setup quickly.

## Scope 📌

- Primary test machine: RTX 5080 16GB, Windows 11, `llama.cpp` b8196+.
- Primary workflow: one server at a time.
- Primary 35B preset: `Qwen3.5-35B-A3B-Q3_K_S.gguf` with `mmproj` loaded and `--parallel 1`.
- Default 35B context in this repo: `122880` tokens (120K), chosen for better Windows headroom.

## What Is Verified Here ✅

- The 35B `Q3_K_S` preset can keep all layers on GPU on the tested RTX 5080 16GB machine.
- `--parallel 1` is required for the 35B preset to avoid a major throughput drop on that setup.
- Text generation stays fast with `mmproj` loaded. The checked-in 35B headline artifacts are text-prompt benchmarks against a server that had the vision projector enabled.
- The repo includes working image-input tooling through the OpenAI-compatible `image_url` request format.

## What Is Not Fully Verified Here ⚠️

- Exact speeds on every 16GB NVIDIA card.
- A universal `155,904`-token cliff on all GPUs and operating systems.
- Full multimodal throughput parity between text-only and image requests.
- Direct PDF or video pipelines. In practice those need preprocessing to images first.

## Recommended Presets 🎯

| Key | Port | Model | Default Context | Estimated VRAM | Use |
| --- | --- | --- | --- | --- | --- |
| `coding` | 8002 | `Qwen3.5-35B-A3B-Q3_K_S.gguf` | 120K | 15.3 GB | Primary coding and general reasoning |
| `fast_vision` | 8003 | `Qwen3.5-9B-UD-Q4_K_XL.gguf` | 256K | 10.6 GB | Fast image input and lighter chat |
| `quality_vision` | 8004 | `Qwen3.5-27B-Q3_K_S.gguf` | 96K | 14.5 GB | Higher quality output, slower generation |

The canonical settings live in [config/servers.yaml](config/servers.yaml).

## Reference Measurements 📊

Checked-in artifacts for the 35B preset:

- [results/benchmark_35b_128k_vis_final_20260304.json](results/benchmark_35b_128k_vis_final_20260304.json)
  - Text prompts
  - `mmproj` loaded
  - `131072` context
  - `119.7` avg gen t/s
  - `523.9` avg prompt t/s
- [results/benchmark_35b_152k_vis_final_20260304.json](results/benchmark_35b_152k_vis_final_20260304.json)
  - Text prompts
  - `mmproj` loaded
  - `155904` context
  - `124.7` avg gen t/s
  - `538.4` avg prompt t/s

Important caveat: those files measure text generation on a server with vision support enabled. They do not prove that image requests have identical throughput.

Additional notes and historical summaries are in:

- [results/BENCHMARK_RESULTS.md](results/BENCHMARK_RESULTS.md)
- [DISCOVERY.md](DISCOVERY.md)
- [docs/CONTEXT_SIZE_ANALYSIS.md](docs/CONTEXT_SIZE_ANALYSIS.md)

If a narrative doc and a checked-in JSON file disagree, prefer the raw JSON artifact.

## Quick Start ⚡

### 1. Install `llama.cpp`

Place a CUDA build in `./llama-bin/`, or build a native SM120 binary if you are on RTX 5080 or 5090.

- Build guide: [docs/RTX5080-NATIVE-BUILD.md](docs/RTX5080-NATIVE-BUILD.md)
- Release downloads: [ggml-org/llama.cpp releases](https://github.com/ggml-org/llama.cpp/releases)

### 2. Download model files

The filenames expected by the repo are:

```bash
huggingface-cli download unsloth/Qwen3.5-35B-A3B-GGUF \
  Qwen3.5-35B-A3B-Q3_K_S.gguf \
  mmproj-35B-F16.gguf \
  --local-dir ./models/unsloth-gguf/

huggingface-cli download unsloth/Qwen3.5-9B-GGUF \
  Qwen3.5-9B-UD-Q4_K_XL.gguf \
  mmproj-F16.gguf \
  --local-dir ./models/unsloth-gguf/

huggingface-cli download unsloth/Qwen3.5-27B-GGUF \
  Qwen3.5-27B-Q3_K_S.gguf \
  mmproj-27B-F16.gguf \
  --local-dir ./models/unsloth-gguf/
```

You can also use [scripts/windows/download_model.ps1](scripts/windows/download_model.ps1).

### 3. Start one server

Windows launcher:

```bat
start_servers_speed.bat coding
start_servers_speed.bat vision
start_servers_speed.bat quality
```

Cross-platform Python manager:

```bash
python server_manager.py start --server coding
python server_manager.py start --server fast_vision
python server_manager.py start --server quality_vision
python server_manager.py stop
```

Linux and macOS shell scripts:

```bash
./scripts/start_servers.sh coding
./scripts/stop_servers.sh
```

### 4. Verify the server

```bash
curl http://127.0.0.1:8002/health
curl http://127.0.0.1:8002/v1/models
```

## Benchmarking 🧪

```bash
python tests/simple_benchmark.py 8002
python tests/health_check.py
python tests/compare_models.py
python tests/vision_test.py path/to/image.png
```

Note: `vision_test.py` sends actual image requests. `simple_benchmark.py` does not.

## Terminal Chat and API Helper 💬

Terminal chat:

```bash
python chat.py
python chat.py --port 8003
```

Useful in-chat commands:

- `/img <path> [question]`
- `/speed`
- `/clear`
- `/quit`

Python helper:

```python
from qwen_api import api_35b, api_9b_vision, SamplingMode

response = api_35b.chat(
    prompt="Write a Python function to reverse a list.",
    mode=SamplingMode.THINKING_CODING,
)

vision = api_9b_vision.vision(
    prompt="Describe this image.",
    image_path="example.png",
)
```

## Context Guidance 🧠

- The repo default is 120K for the 35B preset because it leaves more Windows headroom than the 155,904-token ceiling case.
- The `155,904` figure is a measured reference point on the tested RTX 5080 machine, not a promise for every other GPU.
- The explanation in [DISCOVERY.md](DISCOVERY.md) is an informed hypothesis based on observed buffers and timings, not a proven `llama.cpp` root-cause analysis.

## Project Layout 🗂️

```text
config/                  Canonical server settings
docs/                    Technical notes and analysis
results/                 Checked-in benchmark artifacts
tests/                   Benchmark and validation scripts
chat.py                  Terminal client with image support
qwen_api.py              Minimal Python API helper
server_manager.py        Cross-platform launcher and process manager
start_servers_speed.bat  Windows single-server launcher
scripts/windows/         Legacy Windows helpers, demos, and extra benchmark scripts
```

## Improvement Rules 🛠️

If you update numbers or claims:

- Keep launchers aligned with [config/servers.yaml](config/servers.yaml).
- Commit raw JSON results with any new benchmark summary.
- Separate measured facts from extrapolation.
- Avoid claiming support for workflows that are not implemented in the repo.
