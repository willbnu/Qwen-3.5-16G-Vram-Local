# AGENTS.md

**Project**: qwen-llm (Qwen3.5 Local LLM on 16GB GPU)
**Version**: 1.6.2
**Purpose**: Configuration, benchmarking, and tooling for running Qwen3.5 models locally

---

## Project Overview

This project provides production-ready configurations and tooling for running Qwen3.5 LLMs on 16GB NVIDIA GPUs using llama.cpp. It includes:

- Server configurations for 3 model profiles (coding, vision, quality)
- Benchmarking tools and documented performance results
- Python API helper for programmatic access
- React dashboard for monitoring
- Windows batch scripts for easy server management

---

## Essential Commands

### Local Git Workflow (Windows)

```bash
# One-time setup
scripts/windows/setup-worktrees.ps1

# Promote reviewed commit(s) from dev -> release
scripts/windows/promote-to-release.ps1 <commit-sha>

# Validate the clean release workspace
scripts/windows/check-release.ps1

# Push only from qwen-llm-release on main
scripts/windows/push-release.ps1
```

**Rules:**
- Do normal work in the dev worktree on `personal/dev`
- Do not push from the dev workspace
- Promote only reviewed commits into the release worktree
- Push only from the release worktree

### Server Management (Windows)

```bash
# Start servers with speed profile (recommended)
start_servers_speed.bat coding    # 35B coding server (port 8002)
start_servers_speed.bat vision    # 9B vision server (port 8003)
start_servers_speed.bat quality   # 27B quality server (port 8004)

# Stop all servers
stop_servers.bat

# Python server manager (cross-platform)
python server_manager.py start --profile standard
python server_manager.py stop
python server_manager.py status
python server_manager.py profiles  # List available profiles
python server_manager.py servers   # List server configs
```

### Interactive Chat

```bash
# Terminal chat client (default port 8002)
python chat.py

# Different server
python chat.py --port 8003

# Custom system prompt
python chat.py --system "You are a coding expert."

# In-chat commands
/quit          # Exit
/clear         # Clear conversation
/speed         # Show last tokens/second
/img <path>    # Send image for vision
/help          # Show all commands
```

### Benchmarking

```bash
# Quick benchmark (single server)
python tests/simple_benchmark.py 8002

# Health check all servers
python tests/health_check.py

# Compare models side-by-side
python tests/compare_models.py

# Vision/multimodal test
python tests/vision_test.py
```

### Unit Tests

```bash
# Run all tests with pytest
pytest tests/

# Run specific test file
pytest tests/test_config_loader.py -v
```

### Dashboard (React)

```bash
cd dashboard
npm install       # Install dependencies
npm run dev       # Development server
npm run build     # Production build
```

### API Testing

```bash
# Health check
curl http://localhost:8002/health

# List models
curl http://localhost:8002/v1/models

# Chat completion
curl -X POST http://localhost:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen", "messages": [{"role": "user", "content": "Hello"}]}'
```

---

## Project Structure

```
qwen-llm/
├── config/
│   ├── servers.yaml          # Central server configuration (EDIT PATHS HERE)
│   └── config_loader.py      # Python YAML config loader
├── tests/
│   ├── simple_benchmark.py   # Main benchmark script
│   ├── health_check.py       # Server liveness check
│   ├── compare_models.py     # Model comparison
│   ├── vision_test.py        # Multimodal testing
│   └── benchmark.py          # Extended benchmark suite
├── dashboard/                 # React monitoring dashboard
│   ├── src/                  # TypeScript/React source
│   ├── package.json          # npm dependencies
│   └── vite.config.ts        # Vite configuration
├── docs/                      # Technical documentation
│   ├── RTX5080-NATIVE-BUILD.md
│   ├── KV_CACHE_ANALYSIS.md
│   └── ...
├── results/
│   └── BENCHMARK_RESULTS.md  # Documented benchmark data
├── workspace/tools/           # Agent workspace tools
├── server_manager.py         # Python server lifecycle manager
├── qwen_api.py               # Python API client helper
├── chat.py                   # Interactive chat script
├── start_servers_speed.bat   # Windows launcher (speed profile)
├── start_servers_standard.bat
└── stop_servers.bat          # Windows server killer
```

---

## Model Configuration

### Three Server Profiles

| Profile | Port | Model | Speed | Context | Best For |
|---------|------|-------|-------|---------|----------|
| **Coding** | 8002 | Qwen3.5-35B-A3B Q3_K_S | ~125 t/s | 120K | Primary coding, reasoning |
| **Fast Vision** | 8003 | Qwen3.5-9B UD-Q4_K_XL | ~97 t/s | 256K | Fast vision, chat |
| **Quality** | 8004 | Qwen3.5-27B Q3_K_S | ~46 t/s | 96K | Best reasoning quality |

### Critical Configuration Notes

1. **35B-A3B requires `--parallel 1`**: Default auto (4 slots) causes 10× slowdown due to GDN hybrid architecture recurrent state buffers

2. **155,904 token cliff**: On 16GB GPUs, exceeding 155,904 context causes 93% speed drop. Recommended practical limit: 120K tokens

3. **One server at a time**: 35B alone uses 15.4GB — no two models fit in 16GB simultaneously

4. **KV Cache settings**:
   - MoE (35B): Use `iq4_nl` (small KV, dequant speed wins)
   - Dense (9B, 27B): Use `q8_0` (large KV, bandwidth wins)

### Configuration File

All server settings are in `config/servers.yaml`. Edit paths in this file to match your installation:

```yaml
paths:
  llama_dir: "./llama-bin"
  models_dir: "./models/unsloth-gguf"
  logs_dir: "./logs"
```

---

## Code Patterns

### Python Style

- Python 3.11+ required
- Use `pathlib.Path` for all file paths (not string concatenation)
- Dataclasses for configuration objects (see `config_loader.py`)
- Type hints on all function signatures
- Docstrings on public functions
- YAML for configuration (loaded via `config_loader.py`)

### Example: Using the Config Loader

```python
from config.config_loader import get_config, get_server

# Get configuration singleton
config = get_config()

# Access server by key
coding_server = config.get_server("coding")
print(f"Port: {coding_server.port}")
print(f"API URL: {coding_server.api_url}")

# Get all servers for a profile
servers = config.get_servers_for_profile("speed")
```

### Example: Using the API Helper

```python
from qwen_api import api_35b, api_9b_vision, SamplingMode

# Text chat with 35B (coding mode)
response = api_35b.chat(
    prompt="Write a Python function",
    mode=SamplingMode.THINKING_CODING
)
content = api_35b.get_content(response)
stats = api_35b.get_stats(response)  # tokens, t/s

# Vision with 9B
response = api_9b_vision.vision(
    prompt="Describe this image",
    image_path="screenshot.png"
)
```

### Terminal Chat Client (chat.py)

```bash
# Start interactive chat (default: port 8002)
python chat.py

# Use different model
python chat.py --port 8003

# Custom system prompt
python chat.py --system "You are a coding expert."
```

**In-chat commands:**
- `/quit` or `/exit` — exit chat
- `/clear` — clear conversation history
- `/speed` — show last generation speed (t/s)
- `/system <text>` — change system prompt mid-session
- `/img <path> [question]` — send image for vision analysis
- `/help` — show all commands

**Image handling:**
- Auto-resizes to 768px longest side (matches ViT tile size)
- Requires `Pillow` for auto-resize: `pip install Pillow`
- Without Pillow: images sent at full size (slower, more tokens)

### React/TypeScript (Dashboard)

- React 19 + TypeScript 5.5
- Vite 5 for build
- Zustand v5 with immer middleware for state management
- Tailwind CSS v4 for styling
- JSON-Render library for component specs (`@json-render/*`)

**Store pattern:**
```tsx
// src/store/useAppStore.ts - Zustand with immer middleware
import { useAppStore, selectMetrics, selectCosts, selectModel } from './store/useAppStore';

// Get state with selector for optimized re-renders
const metrics = useAppStore(selectMetrics);

// Get actions
const { setMetrics, setCosts, setModel, reset } = useAppStore();

// Update state
setMetrics({ totalTokens: 1000, genTps: 125.8 });
```

**Store structure:**
- `StoreMetrics`: totalTokens, promptTokens, completionTokens, requestsCount, genTps, promptTps
- `StoreCosts`: inputCost, outputCost, totalCost, costPerRequest, costPer1kTokens
- `StoreModelInfo`: name, provider, contextWindow, maxOutput, port, speed, useCase
- `StoreAppActions`: setMetrics, setCosts, setModel, setDocs, setBenchmarks, reset

**Dashboard commands:**
```bash
cd dashboard
npm install       # Install dependencies
npm run dev       # Development server (Vite)
npm run build     # Production build (tsc + vite build)
npm run lint      # ESLint check
npx tsc --noEmit  # Type check only
```

---

## Testing Approach

### Benchmark Testing

- `simple_benchmark.py`: Runs 3 categories (simple, coding, reasoning) with warmup
- Reports: avg time, avg gen t/s, avg prompt t/s
- Results saved as JSON files

### Health Checks

- `health_check.py`: Verifies all configured servers respond
- Returns exit code 1 if any server fails

### Quality Tests

Defined in `config/servers.yaml` under `quality_tests`:
- Coding accuracy: Checks for expected keywords in output
- Vision accuracy: Requires image input

---

## Important Gotchas

### 1. Quantization Choice

- **35B-A3B MoE**: Use Q3_K_S only (14.2GB fits all layers on GPU)
- **Do NOT use UD-Q4_K_XL** for MoE models — MXFP4 underperforms on MoE routing
- Dense models (9B, 27B): UD quants perform normally

### 2. Thinking Mode

- `enable_thinking: false` is recommended for most use cases
- Thinking mode causes 2-3× slowdown from chain-of-thought overhead
- Enable only when you explicitly need reasoning traces

### 3. RTX 5080/5090 JIT Warmup

- Pre-built llama.cpp binaries lack SM120 support
- First 2-3 requests will be slow (~12 t/s instead of 125 t/s)
- Solution: Build llama.cpp from source with `-DCMAKE_CUDA_ARCHITECTURES=120`
- See `docs/RTX5080-NATIVE-BUILD.md` for instructions

### 4. VRAM Constraints

- 35B coding server uses 15.4GB (only 245MB free)
- Cannot run multiple servers simultaneously on 16GB
- Use profiles to select single server for current task

### 5. Flash Attention

- Must be `on` (not `auto`) for quantized KV cache
- Required for `iq4_nl` and `q8_0` cache types

### 6. Image Processing in chat.py

- Auto-resizes images to 768px longest side (matches ViT tile size)
- Requires `Pillow` package for auto-resize: `pip install Pillow`
- Without Pillow: images sent at full size (slower, more tokens)

### 7. Linux/Mac Server Scripts

- Use `scripts/start_servers.sh` and `scripts/stop_servers.sh` for Unix platforms
- Python server_manager.py works cross-platform

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "llama-server.exe not found" | Download llama.cpp to `./llama-bin/` or build from source |
| Server slow on first request (RTX 5080/5090) | Normal JIT warmup; build with SM120 support for native speed |
| 35B server only ~12 t/s | Add `--parallel 1` flag (GDN architecture requirement) |
| "Server not responding" | Check if port is in use: `netstat -ano \| findstr 8002` |
| Vision not working | Verify mmproj file exists and path in servers.yaml is correct |
| Out of VRAM | Only run one server at a time; 35B uses 15.4GB |

---

## Development Guidelines

### Commit Messages
- Use conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep messages concise and descriptive

### Code Quality
- Run `pytest tests/test_config_loader.py -v` before committing Python changes
- Run `npm run build` in dashboard/ before committing TypeScript changes
- Run `npx tsc --noEmit` for type checking
- Type hints required on all public Python functions
- TypeScript strict mode enabled in dashboard

### Testing
```bash
# Python unit tests
pytest tests/test_config_loader.py -v

# Health check (requires running servers)
python tests/health_check.py

# Benchmarks (requires running servers)
python tests/simple_benchmark.py 8002
```

---

## Sampling Best Practices (Qwen3.5 Official)

### Thinking Mode (General Tasks)
```
temperature=1.0, top_p=0.95, top_k=20
presence_penalty=1.5, repetition_penalty=1.0
```

### Thinking Mode (Precise Coding)
```
temperature=0.6, top_p=0.95, top_k=20
presence_penalty=0.0, repetition_penalty=1.0
```

### Instruct Mode (General)
```
temperature=0.7, top_p=0.8, top_k=20
presence_penalty=1.5, repetition_penalty=1.0
```

### Output Length
- Most queries: 32,768 tokens
- Complex problems (math/competitions): 81,920 tokens

---

## Key Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `DISCOVERY.md` | 155,904 token cliff technical write-up |
| `CHANGELOG.md` | Version history and changes |
| `results/BENCHMARK_RESULTS.md` | Full benchmark documentation |
| `docs/RTX5080-NATIVE-BUILD.md` | SM120 native build guide |
| `docs/KV_CACHE_ANALYSIS.md` | KV cache quantization deep-dive |
| `docs/PERFORMANCE_MATRIX.md` | Performance comparison table |

---

## Dependencies

### Python
- Python 3.11+
- `requests` for API calls
- `pyyaml` for config loading
- `pytest` for testing
- `Pillow` (optional) for image auto-resize in chat.py
- `huggingface_hub[cli]` for model downloads

Install: `pip install -r requirements.txt`

### Node.js (Dashboard)
- Node.js 18+
- npm or pnpm

### External
- llama.cpp (b8196+ recommended)
- CUDA 12.4+ (12.6+ for SM120 native build)
- NVIDIA GPU with 16GB+ VRAM

---

## Model Downloads

```bash
# 35B Coding server (14.2 GB) — PRIMARY MODEL
huggingface-cli download unsloth/Qwen3.5-35B-A3B-GGUF \
  Qwen3.5-35B-A3B-Q3_K_S.gguf \
  mmproj-35B-F16.gguf \
  --local-dir ./models/unsloth-gguf/

# 9B Vision server (~5 GB)
huggingface-cli download unsloth/Qwen3.5-9B-GGUF \
  Qwen3.5-9B-UD-Q4_K_XL.gguf \
  mmproj-F16.gguf \
  --local-dir ./models/unsloth-gguf/

# 27B Quality server (~11 GB)
huggingface-cli download unsloth/Qwen3.5-27B-GGUF \
  Qwen3.5-27B-Q3_K_S.gguf \
  mmproj-27B-F16.gguf \
  --local-dir ./models/unsloth-gguf/
```

Or use the helper script: `scripts/windows/download_model.ps1`

> **Note**: mmproj filenames differ by model. Check `config/servers.yaml` for exact filenames.

---

## CI/CD

GitHub Actions workflow (`.github/workflows/test.yml`) runs on push/PR to main:

- **Python Tests**: pytest on Python 3.11/3.12 (`pytest tests/test_config_loader.py -v`)
- **Dashboard Build**: npm ci + npm run build + TypeScript check

Local CI commands:
```bash
# Python tests
pytest tests/test_config_loader.py -v

# Dashboard build + type check
cd dashboard && npm ci && npm run build && npx tsc --noEmit
```
