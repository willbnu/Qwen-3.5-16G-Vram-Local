# AGENTS.md

**Project**: qwen-llm  
**Version**: 1.7.0  
**Purpose**: Local Qwen3.5 serving, benchmarking, and workflow notes for a 16 GB NVIDIA GPU

---

## Quick Reference

### Current Winners (RTX 5080 16GB)

| Use Case | Model | Config | Measured Speed |
| --- | --- | --- | --- |
| Primary coding / strongest overall | 35B-A3B Q3_K_S | `iq4_nl`, `--parallel 1`, 64K-120K recommended | ~110 to 117 t/s |
| Max-context 35B profile | 35B-A3B Q3_K_S | `iq4_nl`, 256K, edge-fit | ~91 to 93 t/s |
| Best 27B general preset | 27B IQ4_XS | `iq4_nl`, 32K | ~41 t/s |
| Best 27B longer-context tested | 27B IQ4_XS | `iq4_nl`, 64K | ~35 to 36 t/s |
| Best practical 9B | 9B UD-Q4_K_XL | `q8_0`, 256K | ~105 to 107 t/s |
| Strongest-weight 9B tested | 9B Q8_0 | `q8_0`, 256K | ~78 to 80 t/s |

### Shipped Server Presets

| Key | Port | Model | Current Shipped Context | Notes |
| --- | --- | --- | --- | --- |
| `coding` | 8002 | 35B-A3B Q3_K_S | 256K | Max-context local preset, edge-fit on 16 GB |
| `fast_vision` | 8003 | 9B UD-Q4_K_XL | 256K | Fastest practical multimodal preset |
| `quality_vision` | 8004 | 27B Q3_K_S | 96K | Conservative 27B vision fallback |

### Core Commands

```bash
start_servers_speed.bat coding
start_servers_speed.bat vision
start_servers_speed.bat quality
stop_servers.bat
python server_manager.py status
python chat.py
```

---

## Benchmark Rules

Always record:

1. `nvidia-smi` free / used VRAM before launch
2. `llama.cpp` projected device memory use
3. `llama.cpp` effective free device memory during fit
4. KV buffer size
5. Recurrent-state buffer size where applicable

Use:

```bash
powershell -ExecutionPolicy Bypass -File scripts/windows/purge-vram.ps1
```

before each serious run.

Best benchmark runs on the test machine started from about:

- `15977 MiB free`
- `0 MiB used`

---

## Critical Gotchas

1. **35B requires `--parallel 1`**. Anything higher can cause a major slowdown on this hybrid architecture.
2. **One server at a time** on a 16 GB card. The 35B preset fills the card.
3. **Flash attention must stay on** for these quantized KV presets.
4. **35B at 256K is real but edge-fit**. It is a max-context preset, not the safest daily default.
5. **MoE vs dense KV rule**:
   - MoE 35B: prefer `iq4_nl`
   - Dense 9B / 27B: `q8_0` often wins when there is enough headroom
6. **27B winner changed**. The best 27B text preset is now `IQ4_XS + iq4_nl`, not the older `Q3_K_S` default.

---

## Repo Layout

```text
config/                  Canonical server settings
docs/                    Workflow and benchmark guides
results/                 Checked-in benchmark artifacts
tests/                   Benchmark and validation scripts
scripts/windows/         Windows helpers including VRAM purge
server_manager.py        Launcher and process manager
qwen_api.py              Python API helper
chat.py                  Local terminal chat client
```

---

## Workflow

Use the two-repo setup on `D:`:

- `D:\Projects\qwen-llm-git` -> dev on `personal/dev`
- `D:\Projects\qwen-llm-release-git` -> clean release repo on `main`

Rule:

1. Work and commit in dev
2. Promote reviewed changes into release
3. Push from release

Reference:

- `docs/GIT_WORKFLOW.md`

---

## Key Docs

| File | Purpose |
| --- | --- |
| `README.md` | Main public docs |
| `results/BENCHMARK_RESULTS.md` | Checked-in benchmark index |
| `docs/BENCHMARKING.md` | Benchmark procedure and helpers |
| `docs/GIT_WORKFLOW.md` | Dev/release workflow |
| `docs/API_EXAMPLES.md` | API and chat examples |
| `docs/RTX5080-NATIVE-BUILD.md` | Native SM120 build notes |
