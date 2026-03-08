# Benchmarking Guide

## Main Rule

Benchmark one server at a time and purge VRAM before every serious run.

```bash
powershell -ExecutionPolicy Bypass -File scripts/windows/purge-vram.ps1
```

## Core Commands

```bash
python tests/simple_benchmark.py 8002
python tests/health_check.py
python tests/compare_models.py
python tests/vision_test.py path/to/image.png
```

## Extra Comparison Helpers

```bash
python tests/benchmark_64k_compare.py
python tests/benchmark_iq4xs_vision.py
python tests/benchmark_vision_models.py
python tests/benchmark_custom_models.py
python tests/find_max_context_27b.py
```

## Record These Every Time

1. `nvidia-smi` free / used VRAM before launch
2. `llama.cpp` projected device memory use
3. `llama.cpp` effective free device memory during fit
4. KV buffer size
5. recurrent-state buffer size where applicable

## Interpretation Rules

- `nvidia-smi` is the system baseline
- `llama.cpp` free device memory is the runtime fit number
- a model can still run even when it misses the comfort target, but that means the config is edge-fit

## Known Good Baseline

Best benchmark runs on the RTX 5080 test machine came after reboot from about:

- `15977 MiB free`
- `0 MiB used`

If numbers suddenly collapse:

1. stop the server
2. purge VRAM
3. rerun
4. if needed, reboot before trusting new benchmark data
