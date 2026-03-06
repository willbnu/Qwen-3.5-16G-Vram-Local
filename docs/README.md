# Qwen3.5 LLM Documentation

Documentation for local Qwen3.5 deployment optimized for 16GB NVIDIA GPUs.

## Quick Start

1. **Install llama.cpp** - Download from [github.com/ggml-org/llama.cpp/releases](https://github.com/ggml-org/llama.cpp/releases)
2. **Download models** - Get GGUF models from Unsloth or HuggingFace
3. **Configure paths** - Edit `config/servers.yaml` to match your setup
4. **Start a server** - Run `start_servers_speed.bat coding` (Windows) or `./scripts/start_servers.sh coding` (Linux/macOS)

## Server Profiles

| Profile | Port | Model | Speed | Context | Use Case |
|---------|------|-------|-------|---------|----------|
| Coding | 8002 | 35B-A3B Q3_K_S | ~120 t/s | 32K | Development, coding tasks |
| Vision | 8003 | 9B Q4_K_XL | ~97 t/s | 256K | Fast multimodal, OCR |
| Quality | 8004 | 27B Q3_K_S | ~36 t/s | 64K | Best quality output |

## Documentation Index

| Document | Description |
|----------|-------------|
| [RTX5080-NATIVE-BUILD.md](RTX5080-NATIVE-BUILD.md) | Building llama.cpp for RTX 5080 SM120 architecture |
| [PERFORMANCE_MATRIX.md](PERFORMANCE_MATRIX.md) | Comprehensive speed/quality benchmarks |
| [KV_CACHE_ANALYSIS.md](KV_CACHE_ANALYSIS.md) | KV cache type comparisons (q8_0 vs iq4_nl) |
| [CONTEXT_SIZE_ANALYSIS.md](CONTEXT_SIZE_ANALYSIS.md) | Context size vs VRAM tradeoffs |
| [27B_OPTIMIZATION_ANALYSIS.md](27B_OPTIMIZATION_ANALYSIS.md) | Optimization findings for 27B model |
| [RESEARCH_FINDINGS.md](RESEARCH_FINDINGS.md) | Key technical discoveries |
| [HERETIC_COMPARISON.md](HERETIC_COMPARISON.md) | Uncensored model comparison |
| [RTX_STONE_ANALYSIS.md](RTX_STONE_ANALYSIS.md) | RTX Stone benchmark results |
| [QWEN_AGENT_vs_OPENCODE.md](QWEN_AGENT_vs_OPENCODE.md) | AI agent framework comparison |

## Critical Technical Findings

1. **`--parallel 1` is mandatory** for 35B-A3B model (10x speedup vs default)
2. **155,904 token cliff** - exceeding causes 93% speed drop on 16GB GPUs
3. **KV Cache types**: MoE uses `iq4_nl`, Dense uses `q8_0` for best performance
4. **One server at a time** - 35B alone uses 15.4GB VRAM

## Configuration

Edit `config/servers.yaml` to customize:
- Model paths
- Server ports
- Context sizes
- Sampling parameters

Use `config/config_loader.py` for programmatic access:

```python
from config.config_loader import get_config, get_server

config = get_config()
coding_server = get_server("coding")
print(coding_server.api_url)  # http://127.0.0.1:8002/v1/chat/completions
```

## API Usage

Once a server is running, use the OpenAI-compatible API:

```bash
curl http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```
