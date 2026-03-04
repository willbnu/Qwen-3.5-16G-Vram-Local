<div align="center">

# 🚀 Qwen3.5-35B-A3B × RTX 5080 16GB

### Optimal llama.cpp Setup — Verified Benchmarks — Context Cliff Discovery

<br>

|    ⚡ Speed     |   🧠 Context    |   👁️ Vision   |      🎮 GPU      |   💾 VRAM   |
| :-------------: | :-------------: | :-----------: | :--------------: | :---------: |
| **124 t/s avg** | **152K tokens** |  **Enabled**  | **41/41 layers** | **15.4 GB** |
|  166 t/s peak   |   155,904 max   | mmproj loaded |    All on GPU    | 245 MB free |

<br>

> **⚠️ Key discovery:** There is a hard performance cliff at exactly **155,904 tokens** on 16GB VRAM —
> speed drops from 124 t/s to 9 t/s with a single 256-token increase. Not a VRAM issue.
> Root cause documented inside.

<br>

![Platform](https://img.shields.io/badge/Platform-Windows%2011-0078D4?style=flat-square&logo=windows)
![GPU](https://img.shields.io/badge/GPU-RTX%205080%2016GB-76B900?style=flat-square&logo=nvidia)
![llama.cpp](https://img.shields.io/badge/llama.cpp-b8196-FF6B35?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## What This Is

A production-tested llama.cpp configuration for running **Qwen3.5-35B-A3B** (MoE) locally on an **RTX 5080 16GB**, with:

- Verified benchmark numbers (not aspirational)
- The exact token limit where speed falls off a cliff (and why)
- Working vision (multimodal) setup
- Three server profiles: coding · fast-vision · quality
- Scripts you can use immediately

**Hardware tested:** RTX 5080 16GB GDDR7 · Ryzen 7 9800X3D · 96 GB RAM · PCIe 5.0 · Windows 11 native

---

## Key Results

### 35B-A3B Q3_K_S — Coding Server

| Metric              | Value                              |
| ------------------- | ---------------------------------- |
| Generation speed    | **124.7 t/s avg · 166.4 t/s peak** |
| Prompt ingestion    | **538 t/s**                        |
| Context window      | **155,904 tokens (≈152K)**         |
| Vision (multimodal) | **Yes** — mmproj loaded            |
| VRAM used           | **15.4 GB** (245 MB free)          |
| GPU layers          | **41 / 41** — fully on GPU         |
| KV cache            | iq4_nl — only **856 MB** at 152K   |
| Model size          | 14.2 GB (Q3_K_S, 3.94 bpw)         |

### All Three Profiles

| Profile         | Model          | Port | Speed       | Context  | VRAM    |
| --------------- | -------------- | ---- | ----------- | -------- | ------- |
| **Coding**      | 35B-A3B Q3_K_S | 8002 | **124 t/s** | **152K** | 15.4 GB |
| **Vision/Chat** | 9B Q4_K_XL     | 8003 | **97 t/s**  | **256K** | 10.6 GB |
| **Quality**     | 27B Q3_K_S     | 8004 | **36 t/s**  | 64K      | 12.9 GB |

> **One server at a time.** The 35B alone uses 15.4 GB — no two models fit in 16 GB simultaneously.

---

## Quick Start

### Prerequisites

1. **llama.cpp** with CUDA — download the latest release from [github.com/ggml-org/llama.cpp/releases](https://github.com/ggml-org/llama.cpp/releases)
   - Windows: `llama-bXXXX-bin-win-cuda-12.4-x64.zip`
   - Extract to `./llama-bin/`
2. **Models** — download from Unsloth on HuggingFace:
   - [Qwen3.5-35B-A3B-Q3_K_S.gguf](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) (~14.2 GB)
   - [mmproj-35B-F16.gguf](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) (vision projection)
   - Place in `./models/unsloth-gguf/`

3. **Python 3.11+** with `requests` (for benchmark scripts only)

### Start a server

```bat
REM Windows — coding server (35B, 152K context, vision)
start_servers_speed.bat coding

REM or vision (9B, 256K context)
start_servers_speed.bat vision

REM or quality (27B, 64K context)
start_servers_speed.bat quality
```

```bash
# Linux/Mac — run llama-server directly
./llama-bin/llama-server \
  -m ./models/unsloth-gguf/Qwen3.5-35B-A3B-Q3_K_S.gguf \
  --mmproj ./models/unsloth-gguf/mmproj-35B-F16.gguf \
  --host 127.0.0.1 --port 8002 \
  -c 155904 \
  -ngl 99 \
  --flash-attn on \
  -ctk iq4_nl -ctv iq4_nl \
  --temp 0.6 --top-p 0.95 --top-k 20 \
  --presence-penalty 0.0 \
  --chat-template-kwargs '{"enable_thinking":false}'
```

### Test it

```bash
curl http://127.0.0.1:8002/health

curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen","messages":[{"role":"user","content":"Write a Python fibonacci function"}],"max_tokens":300}'
```

> **First 1–2 requests are slow** (~12 t/s). This is CUDA JIT compilation (PTX→sm_120 for Blackwell). Full speed kicks in from request 3 onward.

---

## The Discovery: 155,904 Token Context Cliff

> **This is the main finding worth sharing.** If you run Qwen3.5-35B-A3B on a 16 GB GPU, there is a precise token count above which generation speed drops 10×. It is not a VRAM limit.

### What happens

```
Context 155,904 tokens → 124 t/s  ✅
Context 156,160 tokens →   9 t/s  ❌  (10x slower)
```

A 256-token increase cuts speed by 93%. Every context size above 156,160 stays at ~9 t/s regardless of how much VRAM remains.

### Why it happens

Qwen3.5-35B-A3B uses a **hybrid recurrent architecture** — 30 Gated DeltaNet (linear recurrent) layers interleaved with 10 standard Gated Attention layers. llama.cpp allocates a `CUDA_Host compute buffer` (pinned host RAM used for PCIe data transfers per inference pass) that grows proportionally with context.

| Context     | CUDA_Host Buffer | Speed          |
| ----------- | ---------------- | -------------- |
| 64K         | 136 MB           | 109 t/s ✅     |
| 96K         | 200 MB           | 109 t/s ✅     |
| 128K        | 264 MB           | 119 t/s ✅     |
| 148K        | 304 MB           | 114 t/s ✅     |
| **155,904** | **312.52 MB**    | **124 t/s** ✅ |
| 156,160     | 313.02 MB        | 9 t/s ❌       |
| 160K        | 328 MB           | 10 t/s ❌      |
| 192K        | 392 MB           | 8 t/s ❌       |
| 256K        | 520 MB           | 9 t/s ❌       |

The buffer crosses an internal alignment boundary between 312.52 MB and 313.02 MB — a **0.5 MB jump** between 155,904 and 156,160 tokens. Past this threshold, per-token PCIe transfer volume exceeds available bandwidth, causing the 10× slowdown.

**This is not a VRAM issue.** The model fits in VRAM at all tested sizes. The constraint is PCIe bandwidth for the recurrent state transfers specific to this hybrid architecture.

**Full write-up:** [`DISCOVERY.md`](DISCOVERY.md)

---

## All Three Server Configs

### Coding — 35B-A3B Q3_K_S (Port 8002)

```
-c 155904 -ngl 99 --flash-attn on -ctk iq4_nl -ctv iq4_nl
--chat-template-kwargs '{"enable_thinking":false}'
--mmproj mmproj-35B-F16.gguf
```

**Why Q3_K_S and not Q4_K_M?**  
Q4_K_M (20.5 GB) causes partial CPU offload → 3–4 t/s. Q3_K_S (14.2 GB) fits all 41 layers on GPU → 124 t/s. The 3.94 bpw sweet spot is a bigger win than the quantization quality difference.

**Why iq4_nl KV and not q8_0?**  
MoE models only use 10 of 40 layers for attention (the rest are recurrent). KV cache at 152K is only 856 MB — tiny. iq4_nl is faster to dequant on SM120 for this small KV size. For the 9B (dense, 33 attention layers), q8_0 wins because raw bandwidth matters more.

### Fast Vision — 9B Q4_K_XL (Port 8003)

```
-c 262144 -ngl 99 --flash-attn on -ctk q8_0 -ctv q8_0
--chat-template-kwargs '{"enable_thinking":false}'
--mmproj mmproj-F16.gguf
```

Full 256K context (model native max). q8_0 KV wins on SM120 for dense models — faster than iq4_nl despite being 2× larger because RTX 5080's 960 GB/s bandwidth makes dequant cost the bottleneck, not reads.

### Quality — 27B Q3_K_S (Port 8004)

```
-c 65536 -ngl 99 --flash-attn on -ctk iq4_nl -ctv iq4_nl
--chat-template-kwargs '{"enable_thinking":false}'
--mmproj mmproj-27B-F16.gguf
```

Dense model — all 27B parameters active per token. Best output quality per generated token, 3× slower than 35B-A3B because there's no MoE sparsity.

---

## Why the 35B MoE Is Faster Than It Looks

The 35B-A3B is a **Mixture-of-Experts** model: 256 experts total, but only 8 routed + 1 shared activate per token. Effective compute per token ≈ 3B parameters — similar to a 3B dense model. This is why a "35B" model at 14.2 GB (Q3_K_S) runs at 124 t/s while a dense 27B at 12.3 GB runs at only 36 t/s.

**Architecture breakdown:**

- 40 transformer layers total
- 30 × Gated DeltaNet (linear recurrent) + 10 × Gated Attention (standard)
- Each attention block followed by a MoE FFN block
- n_embd = 2048, n_heads_kv = 4
- KV cache only needed for the 10 attention layers → tiny KV footprint

---

## Quantization Notes

For the **35B-A3B MoE**, standard quants outperform Unsloth Dynamic quants:

| Quant          | Size    | PPL       | vs Q8_0         |
| -------------- | ------- | --------- | --------------- |
| Q8_0           | 36.9 GB | 6.534     | baseline        |
| Q4_K_M         | ~20 GB  | 6.669     | +2.1%           |
| **UD-Q4_K_XL** | ~19 GB  | **7.170** | **+9.7% worse** |

UD-Q4_K_XL uses MXFP4 layers which underperform on MoE architectures. **Use standard Q4_K_M (or Q3_K_S to fit 16 GB).** Unsloth's Daniel Hanchen [confirmed this on Reddit](https://www.reddit.com/r/LocalLLaMA/comments/1rei65v/) and is investigating.

For **dense models** (9B, 27B), Unsloth Dynamic quants are fine.

---

## Hardware Notes

### RTX 5080 Specifics

- SM120 (Blackwell) — pre-built llama.cpp binaries use CUDA 12.4 which does NOT include sm_120
- PTX JIT compilation from sm_89 happens at first run → first 2 requests slow
- Building from source with `-DCMAKE_CUDA_ARCHITECTURES=120 -DGGML_CUDA_FA_ALL_QUANTS=ON` would enable native Blackwell kernels (potential +10–20% speed)
- q8_0 KV cache wins over iq4_nl for dense models on this GPU (high bandwidth makes dequant the bottleneck)

### Minimum Requirements to Replicate

| Component  | Minimum            | Tested         |
| ---------- | ------------------ | -------------- |
| GPU VRAM   | 16 GB              | RTX 5080 16 GB |
| System RAM | 32 GB              | 96 GB          |
| PCIe       | 4.0 x16            | 5.0 x16        |
| OS         | Windows 10 / Linux | Windows 11     |

The context cliff at 155,904 tokens is likely architecture-dependent (llama.cpp version + model arch), not GPU-specific. **Would be very interesting to verify on other GPUs.**

---

## Benchmarking

```bash
# Run the benchmark suite (port 8002 = coding server)
python tests/simple_benchmark.py 8002
```

Results are logged to stdout. See [`results/BENCHMARK_RESULTS.md`](results/BENCHMARK_RESULTS.md) for the full documented run.

---

## Repo Structure

```
├── config/
│   ├── servers.yaml          # All server configs — edit paths here
│   └── config_loader.py      # Python loader for servers.yaml
├── tests/
│   ├── simple_benchmark.py   # Main benchmark script
│   ├── health_check.py       # Server health check
│   ├── compare_models.py     # Side-by-side model comparison
│   └── vision_test.py        # Vision/multimodal test
├── results/
│   └── BENCHMARK_RESULTS.md  # Full documented benchmark results
├── docs/
│   ├── KV_CACHE_ANALYSIS.md  # KV quantization deep-dive
│   └── PERFORMANCE_MATRIX.md # Model comparison matrix
├── DISCOVERY.md              # The 155,904 token cliff — full write-up
├── CHANGELOG.md              # Version history
├── start_servers_speed.bat   # Windows: start coding/vision/quality server
├── start_servers_standard.bat
├── stop_servers.bat
├── server_manager.py         # Python server management
└── qwen_api.py               # Simple API helper
```

---

## Contributing / Reproducing

If you reproduce this on different hardware, please open an issue or PR with:

- GPU model + VRAM
- llama.cpp version
- The `CUDA_Host compute buffer` size where you hit the cliff
- Your measured context limit

This would help confirm whether the 155,904 limit is universal or hardware/version-dependent.

---

## Related

- [Reddit: Qwen3.5-35B-A3B benchmarks on RTX 5080](https://www.reddit.com/r/LocalLLaMA/comments/1rei65v/) — the starting point for these benchmarks
- [Unsloth GGUF models](https://huggingface.co/unsloth)
- [Bartowski GGUF models](https://huggingface.co/bartowski) — Q4_K_M has better quality than UD-Q4_K_XL for this model
- [llama.cpp releases](https://github.com/ggml-org/llama.cpp/releases)
- [Qwen3.5 HuggingFace page](https://huggingface.co/Qwen)

---

## License

MIT — do whatever you want with the configs and scripts.  
Model weights are subject to Qwen's own license (Apache 2.0 for base models).
