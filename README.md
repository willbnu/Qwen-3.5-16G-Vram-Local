<div align="center">

<h1>⚡ Qwen3.5-35B-A3B on 16GB GPU</h1>

<p><strong>Maximum-speed local LLM on consumer hardware — 125 t/s with 152K context, <ins>multimodal vision enabled</ins>, fully documented.</strong></p>

<p><em>See images · Read PDFs · Analyze screenshots — all at 125 t/s on 16GB VRAM</em></p>

<p><em>Tested on RTX 5080 · Works on any NVIDIA 16GB (RTX 30xx / 40xx / 50xx)</em></p>

<br>

<table>
  <tr>
    <td align="center"><b>⚡ Avg Speed</b></td>
    <td align="center"><b>🏎️ Peak Speed</b></td>
    <td align="center"><b>🧠 Context</b></td>
    <td align="center"><b>Vision</b></td>
    <td align="center"><b>🎮 GPU Layers</b></td>
    <td align="center"><b>💾 VRAM</b></td>
  </tr>
  <tr>
    <td align="center"><h2>125 t/s</h2></td>
    <td align="center"><h2>192 t/s</h2></td>
    <td align="center"><h2>152K</h2></td>
    <td align="center"><h2>✅ On</h2></td>
    <td align="center"><h2>41 / 41</h2></td>
    <td align="center"><h2>15.4 GB</h2></td>
  </tr>
  <tr>
    <td align="center">Q3_K_S · MoE</td>
    <td align="center">single token burst</td>
    <td align="center">120K tokens (155K max)</td>
    <td align="center"><b>mmproj loaded</b></td>
    <td align="center">all on GPU</td>
    <td align="center">245 MB free</td>
  </tr>
</table>

<br>

<a href="https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF"><img src="https://img.shields.io/badge/🤗_Model-Qwen3.5--35B--A3B-yellow?style=for-the-badge" alt="HuggingFace Model"></a>
<img src="https://img.shields.io/badge/🖼️_Vision-Enabled-purple?style=for-the-badge" alt="Vision Enabled">
<a href="https://github.com/ggml-org/llama.cpp/releases"><img src="https://img.shields.io/badge/llama.cpp-b8196+-FF6B35?style=for-the-badge" alt="llama.cpp"></a>
<a href="https://developer.nvidia.com/cuda-downloads"><img src="https://img.shields.io/badge/NVIDIA-16GB_VRAM-76B900?style=for-the-badge&logo=nvidia&logoColor=white" alt="NVIDIA"></a>
<a href="#-license"><img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" alt="License"></a>

<br>

> 🚀 **RTX 5080 / 5090 owner?** There's a native SM120 build guide that eliminates JIT warmup latency. **[Jump to Advanced Build →](#-rtx-50805090-native-build-advanced)**

</div>

---

## Quick Navigation

| I want to...                        | Go to                                                      |
| ----------------------------------- | ---------------------------------------------------------- |
| **Get running fast**             | [Quick Start](#-quick-start)                               |
| **Use vision/multimodal**        | [Vision & Multimodal](#vision--multimodal--fully-working) |
| **See benchmark numbers**        | [Key Results](#-key-results)                               |
| **Understand the context cliff** | [The Discovery](#️-the-discovery-155904-token-cliff)        |
| ⚙️ **Copy server configs**          | [Server Configs](#all-three-server-configs)               |
| **Learn why MoE is fast**        | [MoE Explained](#why-the-35b-moe-is-faster-than-it-looks) |
| **Pick the right quant**         | [Quantization Notes](#-quantization-notes)                 |
| **Check GPU compatibility**      | [Hardware Notes](#-hardware-notes)                         |
| **Build for RTX 5080/5090**      | [Native Build Guide](docs/RTX5080-NATIVE-BUILD.md)         |
| **Run benchmarks**               | [Benchmarking](#benchmarking)                             |

---

## What's In Here

A production-tested [llama.cpp](https://github.com/ggml-org/llama.cpp) setup for **[Qwen3.5-35B-A3B](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF)** (MoE) on **any NVIDIA 16GB GPU** — everything you need to hit max speed locally:

- ✅ **Verified numbers** — every benchmark run fresh, no aspirational figures → [See results](results/BENCHMARK_RESULTS.md)
- ✅ **Vision & Multimodal** — images, PDFs, screenshots, diagrams — all working at full speed
- **Context cliff discovery** — the exact token count where 16GB GPUs hit a wall → [Full write-up](DISCOVERY.md)
- **Three ready-to-run profiles** — coding · fast vision · quality → [Configs](#-all-three-server-configs)
- **Drop-in scripts** — Windows `.bat` launchers, Python benchmarks, health checks

> **Works on:** [RTX 3060 Ti 16GB](https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/) · [RTX 4060 Ti 16GB](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/) · [RTX 4070 Ti Super](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-4070ti-super/) · [RTX 4080](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080/) · [RTX 5080](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/) · Any NVIDIA 16GB+

---

## Key Results

### 35B-A3B Q3_K_S — Coding Server (Best Config)

| Metric              | Value                                                                             |
| ------------------- | --------------------------------------------------------------------------------- |
| ⚡ Generation speed | **125.8 t/s avg · 192 t/s peak** (with `--parallel 1`)                            |
| Prompt ingestion | **538 t/s**                                                                       |
| 🧠 Context window   | **120K tokens (155K max) (≈152K)**                                                |
| Vision           | **Yes** — [mmproj](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) loaded    |
| 💾 VRAM used        | **15.4 GB** (245 MB free)                                                         |
| 🎮 GPU layers       | **41 / 41** — fully on GPU                                                        |
| KV cache         | [iq4_nl](docs/KV_CACHE_ANALYSIS.md) — only **856 MB** at 152K                     |
| Model size       | 14.2 GB ([Q3_K_S](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF), 3.94 bpw) |

### All Three Profiles Compared

| Profile            | Model                                                                     | Port |  ⚡ Speed   | 🧠 Context | 💾 VRAM | Config                                   |
| ------------------ | ------------------------------------------------------------------------- | :--: | :---------: | :--------: | :-----: | ---------------------------------------- |
| **Coding**      | [35B-A3B Q3_K_S](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF)     | 8002 | **125 t/s** |  **152K**  | 15.4 GB | [→](#coding--35b-a3b-q3_k_s-port-8002)  |
| **Vision/Chat** | [9B Q4_K_XL](https://huggingface.co/unsloth/Qwen2.5-VL-9B-Instruct-GGUF)  | 8003 | **97 t/s**  |  **256K**  | 10.6 GB | [→](#fast-vision--9b-q4_k_xl-port-8003) |
| **Quality**     | [27B Q3_K_S](https://huggingface.co/unsloth/Qwen2.5-VL-27B-Instruct-GGUF) | 8004 | **46 t/s**  |    96K     | 14.5 GB | [→](#quality--27b-q3_k_s-port-8004)     |

> **⚠️ One server at a time.** The 35B alone uses 15.4 GB — no two models fit in 16 GB simultaneously.

---

## Vision & Multimodal — Fully Working

This isn't just text. All three models support **vision/multimodal input** out of the box:

| Capability                  |   35B-A3B   |     9B     |    27B     |
| --------------------------- | :---------: | :--------: | :--------: |
| Image analysis           |     ✅      |     ✅     |     ✅     |
| PDF reading              |     ✅      |     ✅     |     ✅     |
| Screenshot understanding |     ✅      |     ✅     |     ✅     |
| Chart/diagram analysis   |     ✅      |     ✅     |     ✅     |
| 🎥 Video frame analysis     |     ✅      |     ✅     |     ✅     |
| Speed with vision           | **120 t/s** | **97 t/s** | **46 t/s** |

### Quick Vision Test

```bash
# Send an image to the model
curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "What do you see in this image?"},
        {"type": "image_url", "image_url": {"url": "file:///path/to/your/image.png"}}
      ]
    }],
    "max_tokens": 500
  }'
```

### Vision Performance

The mmproj (vision projection) adds ~0.9 GB VRAM overhead but **does NOT slow down text generation**. You get full 125 t/s even with vision loaded.

> **💡 This is rare.** Many local LLM setups sacrifice speed for vision. This config gives you both.

---

## 🚀 Quick Start

### Prerequisites

**1. Get llama.cpp**

> **🚀 OPTION A (RTX 5080/5090 only):** Build llama.cpp from source with SM120 support for native Blackwell kernels (eliminates JIT warmup). See [Native Build Guide](docs/RTX5080-NATIVE-BUILD.md).

> **⚠️ OPTION B (All GPUs):** Download the latest CUDA release from [llama.cpp releases](https://github.com/ggml-org/llama.cpp/releases):

| Platform | Download                                |
| -------- | --------------------------------------- |
| Windows  | `llama-bXXXX-bin-win-cuda-12.4-x64.zip` |
| Linux    | `llama-bXXXX-bin-linux-x64-cuda.tar.gz` |

Extract to `./llama-bin/` in this repo root.

> 💡 **Tip:** Need CUDA? Download from [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-downloads) (12.4+ recommended)

**2. Download the models**

Install the [HuggingFace CLI](https://huggingface.co/docs/huggingface_hub/guides/cli):

```bash
pip install -U "huggingface_hub[cli]"
```

Then download:

```bash
# 35B Coding server (14.2 GB) — REQUIRED
huggingface-cli download unsloth/Qwen3.5-35B-A3B-GGUF \
  Qwen3.5-35B-A3B-Q3_K_S.gguf \
  mmproj-Qwen3.5-35B-A3B-F16.gguf \
  --local-dir ./models/unsloth-gguf/

# 9B Vision server (~5 GB) — OPTIONAL
huggingface-cli download unsloth/Qwen2.5-VL-9B-Instruct-GGUF \
  Qwen2.5-VL-9B-Instruct-Q4_K_XL.gguf \
  mmproj-Qwen2.5-VL-9B-Instruct-F16.gguf \
  --local-dir ./models/unsloth-gguf/

# 27B Quality server (~11 GB) — OPTIONAL
huggingface-cli download unsloth/Qwen2.5-VL-27B-Instruct-GGUF \
  Qwen2.5-VL-27B-Instruct-Q3_K_S.gguf \
  mmproj-Qwen2.5-VL-27B-Instruct-F16.gguf \
  --local-dir ./models/unsloth-gguf/
```

Or use the included helper: [`download_model.ps1`](download_model.ps1)

> **Direct downloads:** [35B-A3B](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) · [9B-VL](https://huggingface.co/unsloth/Qwen2.5-VL-9B-Instruct-GGUF) · [27B-VL](https://huggingface.co/unsloth/Qwen2.5-VL-27B-Instruct-GGUF)

**3. Python** (benchmark scripts only) — 3.11+ with:

```bash
pip install requests
```

---

### Start a Server

<table>
<tr><th>Windows</th><th>Linux / Mac</th></tr>
<tr>
<td>

```bat
REM Coding — 35B, 152K, vision
start_servers_speed.bat coding

REM Vision — 9B, 256K
start_servers_speed.bat vision

REM Quality — 27B, 64K
start_servers_speed.bat quality
```

</td>
<td>

```bash
# Download and extract llama.cpp to ./llama-bin/
# Then run the server:
./llama-bin/llama-server \
  -m ./models/unsloth-gguf/Qwen3.5-35B-A3B-Q3_K_S.gguf \
  --mmproj ./models/unsloth-gguf/mmproj-35B-F16.gguf \
  --host 127.0.0.1 --port 8002 \
  -c 122880 -ngl 99 \
  --flash-attn on \
  -ctk iq4_nl -ctv iq4_nl \
  --parallel 1 \
  --temp 0.6 --top-p 0.95 --top-k 20 \
  --chat-template-kwargs '{"enable_thinking":false}'
```

</td>
</tr>
</table>

> 📝 **Config file:** All settings are in [`config/servers.yaml`](config/servers.yaml) — edit paths there for your setup.

### Verify It's Running

```bash
# Health check
curl http://127.0.0.1:8002/health

# First inference
curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen",
    "messages": [{"role": "user", "content": "Write a Python fibonacci function"}],
    "max_tokens": 300
  }'
```

> **⚠️ CRITICAL: Always use `--parallel 1` for the 35B-A3B model.** Without it, the default auto-parallel (4 slots) causes a 10× slowdown (9 t/s instead of 125 t/s) due to oversized recurrent state buffers in the GDN hybrid architecture. [Details →](results/BENCHMARK_RESULTS.md)
>
> **💡 Using the included SM120 build eliminates JIT warmup.** If using prebuilt binaries, first 2 requests may be slow on RTX 5080/5090 due to PTX→sm_120 JIT compilation. [Learn more →](docs/RTX5080-NATIVE-BUILD.md#jit-warmup-explained)

---

## ⚠️ The Discovery: 155,904 Token Cliff

> **This is the main reason this repo exists.** There is a hard, precise performance cliff in Qwen3.5-35B-A3B on 16GB GPUs that nobody had documented. Here's what it looks like:

```
  Context    Speed
  ───────    ─────────────────────────────────────────────────────
   64,000    109 t/s  ████████████████████████████████████████
   96,000    109 t/s  ████████████████████████████████████████
  128,000    119 t/s  ████████████████████████████████████████████
  148,000    114 t/s  ██████████████████████████████████████████
  155,904    125 t/s  ██████████████████████████████████████████████  ← SWEET SPOT
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  156,160      9 t/s  ███  ← 93% speed DROP at +256 tokens
  160,000     10 t/s  ████
  192,000      8 t/s  ███
  256,000      9 t/s  ███
```

### The Numbers

|   Context   | CUDA_Host Buffer |    Speed    |    Status    |
| :---------: | :--------------: | :---------: | :----------: |
|     64K     |      136 MB      |   109 t/s   |      ✅      |
|     96K     |      200 MB      |   109 t/s   |      ✅      |
|    128K     |      264 MB      |   119 t/s   |      ✅      |
|    148K     |      304 MB      |   114 t/s   |      ✅      |
| **155,904** |  **312.52 MB**   | **125 t/s** |  ✅ **MAX**  |
| **156,160** |  **313.02 MB**   |  **9 t/s**  | ❌ **CLIFF** |
|    160K     |      328 MB      |   10 t/s    |      ❌      |
|    192K     |      392 MB      |    8 t/s    |      ❌      |
|    256K     |      520 MB      |    9 t/s    |      ❌      |

### Why It Happens

[Qwen3.5-35B-A3B](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) uses a **hybrid recurrent architecture** — 30 Gated DeltaNet layers (linear recurrent) interleaved with 10 standard Gated Attention layers. llama.cpp allocates a `CUDA_Host compute buffer`: pinned host RAM for PCIe data transfers on every inference pass.

This buffer grows with context size. Between 155,904 and 156,160 tokens, it crosses an **internal alignment boundary** — jumping from 312.52 MB to 313.02 MB (a 0.5 MB step). Past this threshold, per-token PCIe transfer volume exceeds available bandwidth, and the model slows 10×.

```
312.52 MB  →  fast  ✅   (below alignment boundary)
313.02 MB  →  slow  ❌   (above alignment boundary)
```

**It is NOT a VRAM issue.** The model fits in VRAM at 192K and 256K too. VRAM is not the constraint — PCIe bandwidth for recurrent state transfers is.

**This is specific to hybrid recurrent architectures.** Pure transformer models (Qwen 9B, 27B) don't have this constraint — they don't use Gated DeltaNet layers and have no recurrent state PCIe transfers.

**Full technical write-up with reproduce steps:** [`DISCOVERY.md`](DISCOVERY.md)

---

> **📝 Important: Practical Limit for Windows Users**
>
> The **theoretical maximum** is **120K tokens (155K max)** (full 125 t/s speed). However, when running Windows with other applications, you need ~1GB VRAM headroom for the OS and other apps.
>
> **We recommend 120K tokens** as the practical sweet spot:
>
> | Context  |    Speed    |     VRAM     | Notes                                          |
> | :------: | :---------: | :----------: | :--------------------------------------------- |
> |   96K    |   125 t/s   |   ~15.3 GB   | Conservative                                   |
> | **120K** | **120 t/s** | **~15.4 GB** | **✅ Recommended**                             |
> |   155K   |   125 t/s   |   ~15.9 GB   | Theoretical max, may cause issues with Windows |
>
> - **120K tokens** gives you ~120 t/s (only **4% slower** than max)
> - **+25% more context** vs 96K
> - **Stable** with Windows + other apps running
> - This is the default in our launch scripts

---

## All Three Server Configs

### Coding — 35B-A3B Q3_K_S (Port 8002)

```bash
-m Qwen3.5-35B-A3B-Q3_K_S.gguf
--mmproj mmproj-Qwen3.5-35B-A3B-F16.gguf
-c 155904 -ngl 99 --flash-attn on
-ctk iq4_nl -ctv iq4_nl
--parallel 1
--chat-template-kwargs '{"enable_thinking":false}'
```

| Decision                                             | Reasoning                                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **`--parallel 1`** ⚠️                                | **CRITICAL.** Default auto (4 slots) allocates 4× larger recurrent state buffers → 10× slowdown (9 t/s). With `--parallel 1` → 125 t/s.   |
| **[Q3_K_S](docs/Quantization_Notes.md) over Q4_K_M** | Q4_K_M = 20.5 GB → partial CPU offload → 3–4 t/s. Q3_K_S = 14.2 GB → all 41 layers on GPU → 125 t/s. Full GPU wins by 30×.                |
| **[iq4_nl KV cache](docs/KV_CACHE_ANALYSIS.md)**     | MoE uses only 10/40 layers for attention. KV at 152K = only 856 MB. iq4_nl dequants faster for small KV caches.                           |
| **thinking disabled**                                | `enable_thinking:false` prevents 2–3× slowdown from chain-of-thought overhead. Use `true` only when you explicitly need reasoning traces. |
| **-c 155904**                                        | Exactly one step below the 313 MB PCIe alignment cliff. This is the verified sweet spot.                                                  |

---

### Fast Vision — 9B Q4_K_XL (Port 8003)

```bash
-m Qwen2.5-VL-9B-Instruct-Q4_K_XL.gguf
--mmproj mmproj-Qwen2.5-VL-9B-Instruct-F16.gguf
-c 262144 -ngl 99 --flash-attn on
-ctk q8_0 -ctv q8_0
--chat-template-kwargs '{"enable_thinking":false}'
```

Full 256K context ([model native max](https://huggingface.co/Qwen/Qwen2.5-VL-9B-Instruct)). Uses **[q8_0 KV](docs/KV_CACHE_ANALYSIS.md)** — not iq4_nl — because the 9B is a dense model with 33 attention layers. On high-bandwidth GPUs (GDDR6X/GDDR7), raw read speed matters more than dequant cost, so the larger but simpler q8_0 wins.

---

### Quality — 27B Q3_K_S (Port 8004)

```bash
-m Qwen3.5-27B-Q3_K_S.gguf
--mmproj mmproj-27B-F16.gguf
-c 98304 -ngl 99 --flash-attn on
-ctk iq4_nl -ctv iq4_nl
--parallel 1
--reasoning-budget 0
```

Dense model — **all 27B parameters active per token** (no MoE sparsity). Generates the highest quality output of the three. **Optimized to 46 t/s** (was 36 t/s) with `--parallel 1` and 96K context. Use this when output quality is the priority over speed.

> **💡 Optimization note:** The 27B benefits from `--parallel 1` (reduces recurrent state buffer) and can use 96K context with iq4_nl KV at the same 46 t/s speed as 64K.

---

## Why the 35B MoE Is Faster Than It Looks

The "35B" label is misleading. Here's the actual compute:

```
  Dense 27B:  27B params active per token  →  46 t/s  🐢  (optimized)
  Dense  9B:   9B params active per token  →  97 t/s  🐇
  MoE   35B:  ~3B params active per token  → 120 t/s  🚀  (with --parallel 1)
```

[Qwen3.5-35B-A3B](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) has **256 experts** total, but only **8 routed + 1 shared** activate per token. Effective compute ≈ 3B parameters per forward pass — comparable to a 3B dense model. This is why a nominally "35B" model at 14.2 GB outruns a dense 27B at 11.4 GB by 2.6×.

**Architecture breakdown:**

| Component             | Detail                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| Total layers          | 40 transformer layers                                                      |
| Recurrent layers      | 30 × [Gated DeltaNet](https://arxiv.org/abs/2501.06026) (linear recurrent) |
| Attention layers      | 10 × Gated Attention (standard)                                            |
| Experts per MoE block | 256 total · 8 routed + 1 shared active                                     |
| Embedding dim         | n_embd = 2048                                                              |
| KV heads              | n_heads_kv = 4                                                             |
| KV footprint          | Only 10 layers need KV cache → tiny                                        |

The tiny KV footprint (only 10 attention layers vs 40 for a dense model) is also why [iq4_nl KV cache](docs/KV_CACHE_ANALYSIS.md) works better here than q8_0 — there's simply less KV data to transfer, so dequant speed dominates over read bandwidth.

---

## Quantization Notes

### 35B-A3B MoE: Standard Quants Win

> **Don't use Unsloth Dynamic quants for the MoE model.** UD-Q4_K_XL uses MXFP4 mixed-precision layers that underperform on MoE architectures — confirmed by [Unsloth's founder on Reddit](https://www.reddit.com/r/LocalLLaMA/comments/1rei65v/).

|                               Quant                               |    Size     | Perplexity |   vs Q8_0   | Download                                                     |
| :---------------------------------------------------------------: | :---------: | :--------: | :---------: | ------------------------------------------------------------ |
|                               Q8_0                                |   36.9 GB   |   6.534    |  baseline   | —                                                            |
|  [Q4_K_M](https://huggingface.co/bartowski/Qwen3.5-35B-A3B-GGUF)  |   ~20 GB    |   6.669    |    +2.1%    | [🤗](https://huggingface.co/bartowski/Qwen3.5-35B-A3B-GGUF)  |
| **[Q3_K_S](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF)** | **14.2 GB** |  **~6.9**  |   **~5%**   | [🤗](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) ✅ |
| [UD-Q4_K_XL](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF) |   ~19 GB    |   7.170    | +9.7% worse | ❌ Avoid                                                     |

Q3_K_S is the only quant that fits all 41 layers on a 16 GB GPU. The ~5% perplexity increase vs Q4_K_M is a much smaller penalty than the 30× speed loss from partial CPU offload (125 t/s vs 3–4 t/s).

### Dense Models (9B, 27B): Unsloth Dynamic is Fine

For dense models, UD quants perform normally. The MXFP4 issue is specific to MoE routing.

### KV Cache: Different Rules for MoE vs Dense

| Model type      | Best KV quant | Why                                                      | Learn more                               |
| --------------- | :-----------: | -------------------------------------------------------- | ---------------------------------------- |
| MoE (35B-A3B)   |   `iq4_nl`    | Only 10 attention layers → small KV → dequant speed wins | [KV Analysis](docs/KV_CACHE_ANALYSIS.md) |
| Dense (9B, 27B) |    `q8_0`     | 33+ attention layers → large KV → read bandwidth wins    | [KV Analysis](docs/KV_CACHE_ANALYSIS.md) |

> **⚠️ Never mix K and V quant types.** Using different quants for `-ctk` and `-ctv` causes a significant slowdown. Always set both to the same value.

---

## Hardware Notes

### Compatible 16GB NVIDIA GPUs

The 35B-A3B Q3_K_S model (14.2 GB) fits on any NVIDIA card with **16 GB+ VRAM**. Speeds vary by generation:

| GPU                                                                                                                                                                          | VRAM  |  Est. Speed  | Notes                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---: | :----------: | ------------------------------------- |
| **[RTX 5080](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/)**                                                                                      | 16 GB | **125 t/s**  | ✅ Tested — SM120, GDDR7              |
| [RTX 5070 Ti](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/)                                                                                                | 16 GB | ~100-110 t/s | Same arch, slightly less bandwidth    |
| **[RTX 4080](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080/)**                                                                                      | 16 GB |  ~85-95 t/s  | SM89, GDDR6X — should hit same cliff  |
| **[RTX 4070 Ti Super](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-4070ti-super/)**                                                                | 16 GB |  ~75-85 t/s  | Cut-down 4080, still fast             |
| **[RTX 4060 Ti](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/)**                                                                            | 16 GB |  ~55-70 t/s  | Narrower bus, but works               |
| **[RTX 3060 Ti](https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/)**                                                                            | 16 GB |  ~45-60 t/s  | Older arch, still capable             |
| [RTX 3090](https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/) / [4090](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/) | 24 GB |    Higher    | Can run Q4_K_M full-GPU, more context |

> **The 155,904 context cliff is architecture-dependent, not GPU-specific.** All cards above should hit the same cliff at the same token count — it's about the `CUDA_Host buffer` alignment in llama.cpp, not VRAM or GPU model. If you test on a different card, please [report your cliff point](#-contributing--reproducing)!

### Tested Hardware

| Component | Tested                                                                                                        | Notes                          |
| --------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| GPU       | [RTX 5080 16GB GDDR7](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/)                | SM120 Blackwell                |
| CPU       | [Ryzen 7 9800X3D](https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/ryzen-7-9800x3d.html) | 8-core, not Ryzen 9            |
| RAM       | 96 GB DDR5                                                                                                    | Overkill — 32 GB sufficient    |
| PCIe      | 5.0 x16                                                                                                       | 4.0 x16 should be fine         |
| OS        | Windows 11 Pro                                                                                                | Linux untested but should work |

### GPU Architecture Notes

| Topic                   | Detail                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SM120 (Blackwell)**   | Pre-built llama.cpp uses CUDA 12.4 which lacks sm_120. PTX→sm_120 JIT on first run = 2 slow requests. Native build = ~1% faster steady-state. **[Build native →](docs/RTX5080-NATIVE-BUILD.md)** |
| **SM89 (Ada Lovelace)** | 40xx series has native support in [CUDA 12.x](https://developer.nvidia.com/cuda-downloads) — no JIT warmup needed                                                                                |
| **Source build**        | `-DCMAKE_CUDA_ARCHITECTURES=120 -DGGML_CUDA_FA_ALL_QUANTS=ON` for native Blackwell kernels. **[Full guide →](docs/RTX5080-NATIVE-BUILD.md)**                                                     |
| **PCIe bandwidth**      | Recurrent state transfers (MoE) are PCIe-bound. Gen 4 vs 5 shouldn't change cliff location.                                                                                                      |

### Minimum Requirements

| Component  |      Minimum       |        Recommended        |
| ---------- | :----------------: | :-----------------------: |
| GPU VRAM   |       16 GB        |       16 GB+ NVIDIA       |
| System RAM |       32 GB        |           64 GB           |
| PCIe       |      3.0 x16       |         4.0 x16+          |
| OS         | Windows 10 / Linux | Windows 11 / Ubuntu 22.04 |
| llama.cpp  |       b5000+       |          b8196+           |

---

## 🚀 RTX 5080/5090 Native Build (Advanced)

> **For [Blackwell (SM120)](https://www.nvidia.com/en-us/technologies/blackwell-architecture/) GPU owners who want maximum performance.**

### The Problem with Pre-built Binaries

Pre-built llama.cpp binaries use CUDA 12.4, which **does not include SM120 support**. They run via PTX JIT compilation, which causes:

| Issue                    | Impact                                    |
| ------------------------ | ----------------------------------------- |
| 2-3 slow warmup requests | ~12 t/s instead of 125 t/s on first start |

### The Solution: Build from Source

A native SM120 build gives you:

| Benefit                        | Gain                                                  |
| ------------------------------ | ----------------------------------------------------- |
| **No JIT warmup**              | Full speed from request 1                             |
| **Native Blackwell kernels**   | ~1% raw throughput gain (125.8 vs 124.8 t/s measured) |
| **All Flash Attention quants** | Better KV cache options                               |

> **Note:** The real 10× speedup (9 → 125 t/s) comes from `--parallel 1`, not the native build. See [benchmark results](results/BENCHMARK_RESULTS.md).

### Quick Build Commands

```powershell
# Prerequisites: CUDA 12.6+, Visual Studio 2022, CMake 3.28+

git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
mkdir build && cd build

cmake .. -G "Visual Studio 17 2022" -A x64 `
  -DCMAKE_CUDA_ARCHITECTURES=120 `
  -DGGML_CUDA=ON `
  -DGGML_CUDA_FA_ALL_QUANTS=ON `
  -DGGML_FLASH_ATTN=ON `
  -DCMAKE_BUILD_TYPE=Release

cmake --build . --config Release --parallel 8
```

### SM120-Specific KV Cache Recommendations

On Blackwell's GDDR7 (960 GB/s), bandwidth is abundant:

| Model           | Best KV  | Why                                    |
| --------------- | :------: | -------------------------------------- |
| MoE (35B-A3B)   | `iq4_nl` | Small KV (856 MB) → dequant speed wins |
| Dense (9B, 27B) |  `q8_0`  | Large KV → raw bandwidth wins          |

### Full Guide

**Complete build instructions, troubleshooting, and performance analysis:**

👉 **[`docs/RTX5080-NATIVE-BUILD.md`](docs/RTX5080-NATIVE-BUILD.md)**

Includes:

- Detailed CMake flags explained
- PowerShell build script
- JIT warmup technical explanation
- Expected performance gains
- How to verify SM120 support

---

## Benchmarking

```bash
# Quick benchmark — runs 5 requests, reports avg/peak/p95
python tests/simple_benchmark.py 8002

# Health check across all ports
python tests/health_check.py

# Side-by-side model comparison
python tests/compare_models.py

# Vision / multimodal test
python tests/vision_test.py
```

**Full documented results:** [`results/BENCHMARK_RESULTS.md`](results/BENCHMARK_RESULTS.md)

---

## Repo Structure

```
Qwen-3.5-16G-Vram-Local/
│
├── README.md                  ← You are here
├── [DISCOVERY.md](DISCOVERY.md)               ← Full 155,904 cliff write-up
├── [CHANGELOG.md](CHANGELOG.md)               ← Version history
│
├── ⚙️  config/
│   ├── [servers.yaml](config/servers.yaml)              ← All server configs — edit model paths here
│   └── [config_loader.py](config/config_loader.py)     ← Python config loader
│
├── tests/
│   ├── [simple_benchmark.py](tests/simple_benchmark.py)      ← Main benchmark (avg/peak/p95)
│   ├── [health_check.py](tests/health_check.py)              ← Server liveness check
│   ├── [compare_models.py](tests/compare_models.py)          ← Side-by-side comparison
│   ├── [benchmark.py](tests/benchmark.py)                    ← Extended benchmark suite
│   └── [vision_test.py](tests/vision_test.py)                ← Multimodal / image test
│
├── results/
│   └── [BENCHMARK_RESULTS.md](results/BENCHMARK_RESULTS.md)     ← Full documented benchmark run
│
├── 📚 docs/
│   ├── [RTX5080-NATIVE-BUILD.md](docs/RTX5080-NATIVE-BUILD.md)  ← 🚀 SM120 native build guide (5080/5090 only)
│   ├── [KV_CACHE_ANALYSIS.md](docs/KV_CACHE_ANALYSIS.md)     ← KV quant deep-dive
│   ├── [PERFORMANCE_MATRIX.md](docs/PERFORMANCE_MATRIX.md)    ← Model comparison matrix
│   ├── [27B_OPTIMIZATION_ANALYSIS.md](docs/27B_OPTIMIZATION_ANALYSIS.md)
│   └── [RESEARCH_FINDINGS.md](docs/RESEARCH_FINDINGS.md)
│
├── 🚀 [start_servers_speed.bat](start_servers_speed.bat)    ← Windows: launch coding/vision/quality
├── 🔧 [start_servers_standard.bat](start_servers_standard.bat) ← Windows: standard profiles
├── 🛑 [stop_servers.bat](stop_servers.bat)           ← Windows: kill all servers
├── [server_manager.py](server_manager.py)          ← Python server lifecycle manager
├── [qwen_api.py](qwen_api.py)                ← Minimal API client helper
└── [download_model.ps1](download_model.ps1)         ← Model download script
```

---

## Contributing / Reproducing

**Help expand GPU compatibility data!** Test on your 16GB card and report:

| Field                               | Example        |
| ----------------------------------- | -------------- |
| GPU + VRAM                          | RTX 4080 16GB  |
| llama.cpp version                   | b8500          |
| `CUDA_Host compute buffer` at cliff | 313.02 MB      |
| Context size at cliff               | 156,160        |
| Speed before / after                | 85 t/s → 8 t/s |

👉 **[Open an issue](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/issues/new)** with your results!

This helps confirm whether the 155,904 cliff is universal or shifts with GPU/architecture.

Other useful contributions:

- **Linux results** — same hardware, different OS
- **Native sm_89/sm_120 builds** — source compile benchmarks → [Build guide](docs/RTX5080-NATIVE-BUILD.md)
- **Other MoE models** — does the cliff exist on other hybrid-recurrent architectures?

---

## Related Resources

### Models & Downloads

| Resource                             | Link                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Qwen3.5-35B-A3B (Recommended)** | [unsloth/Qwen3.5-35B-A3B-GGUF](https://huggingface.co/unsloth/Qwen3.5-35B-A3B-GGUF)                 |
| Qwen2.5-VL-9B (Vision)            | [unsloth/Qwen2.5-VL-9B-Instruct-GGUF](https://huggingface.co/unsloth/Qwen2.5-VL-9B-Instruct-GGUF)   |
| Qwen2.5-VL-27B (Quality)          | [unsloth/Qwen2.5-VL-27B-Instruct-GGUF](https://huggingface.co/unsloth/Qwen2.5-VL-27B-Instruct-GGUF) |
| Alternative quants                | [bartowski/Qwen3.5-35B-A3B-GGUF](https://huggingface.co/bartowski/Qwen3.5-35B-A3B-GGUF)             |

### Tools & Frameworks

| Resource              | Link                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| **llama.cpp**      | [github.com/ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp)      |
| llama.cpp releases | [Releases page](https://github.com/ggml-org/llama.cpp/releases)             |
| HuggingFace CLI    | [CLI documentation](https://huggingface.co/docs/huggingface_hub/guides/cli) |
| 🔧 CUDA Toolkit       | [NVIDIA downloads](https://developer.nvidia.com/cuda-downloads)             |

### Community & Discussion

| Resource                           | Link                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| 📖 **Reddit: Original benchmarks** | [r/LocalLLaMA thread](https://www.reddit.com/r/LocalLLaMA/comments/1rei65v/) |
| 📖 r/LocalLLaMA                    | [reddit.com/r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/)              |
| 📖 Qwen documentation              | [QwenLM GitHub](https://github.com/QwenLM/Qwen)                              |

### Architecture Papers

| Resource                 | Link                                                         |
| ------------------------ | ------------------------------------------------------------ |
| Gated DeltaNet        | [arxiv.org/abs/2501.06026](https://arxiv.org/abs/2501.06026) |
| Qwen Technical Report | [arxiv.org/abs/2309.16609](https://arxiv.org/abs/2309.16609) |
| Flash Attention       | [arxiv.org/abs/2205.14135](https://arxiv.org/abs/2205.14135) |

---

## License

**Scripts and configs:** [MIT](LICENSE) — use freely, no attribution required.

**Model weights:** Subject to [Qwen's license](https://huggingface.co/Qwen/Qwen2.5-72B/blob/main/LICENSE) (Apache 2.0 for base models).

---

## About the Author

This project was created through extensive hands-on benchmarking and experimentation on consumer hardware.

**William Finger** ([@willbnu](https://github.com/willbnu))

- 🔧 Hardware enthusiast — RTX 5080, Ryzen 7 9800X3D, 96GB DDR5
- Passionate about local LLM optimization and real-world performance testing
- Discovered the 155,904 token context cliff through systematic benchmarking
- 🚀 Building tools and sharing knowledge to help others run LLMs locally

> _"If it can't run locally at 100+ t/s, I'm not interested."_

**Portfolio:** [willfinger.com](https://willfinger.com)

**Connect:**

- [GitHub](https://github.com/willbnu)
- Open an issue for questions or collaborations

---

<div align="center">

### ⭐ Star if this saved you hours of benchmarking

[![Star History Chart](https://api.star-history.com/svg?repos=willbnu/Qwen-3.5-16G-Vram-Local&type=Date)](https://star-history.com/#willbnu/Qwen-3.5-16G-Vram-Local&Date)

**🔄 Test on your GPU · Report your cliff · Help the community**

[Open an Issue](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/issues/new) · [Submit a PR](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/pulls) · [Discuss](https://github.com/willbnu/Qwen-3.5-16G-Vram-Local/discussions)

---

_Numbers are reproducible · PRs welcome · MIT license_

</div>
