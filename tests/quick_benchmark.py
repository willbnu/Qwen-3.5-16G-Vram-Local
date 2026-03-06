#!/usr/bin/env python3
"""
Quick Benchmark - Test all models using SM120 native llama-server
Usage: python quick_benchmark.py [--model 35b|9b|27b|all]

Models must run ONE AT A TIME due to VRAM constraints.
Uses SM120 native build for accurate results (no JIT overhead).
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import requests

# Configuration
ROOT_DIR = Path(__file__).parent.parent
SM120_SERVER = ROOT_DIR / "llama.cpp/build-sm120/bin/Release/llama-server.exe"
PREBUILT_SERVER = ROOT_DIR / "llama-bin/llama-server.exe"
MODELS_DIR = ROOT_DIR / "models/unsloth-gguf"
RESULTS_DIR = ROOT_DIR / "results"

MODELS = {
    "35b": {
        "name": "35B-A3B MoE",
        "model": "Qwen3.5-35B-A3B-Q3_K_S.gguf",
        "mmproj": "mmproj-35B-F16.gguf",
        "port": 8002,
        "ctx": 122880,
        "kv_type": "iq4_nl",
        "extra_args": ["--parallel", "1", "--reasoning-budget", "0"],
        "target_tps": 125,
        "warmup": 5,  # More warmup for JIT on prebuilt
    },
    "9b": {
        "name": "9B Vision",
        "model": "Qwen3.5-9B-UD-Q4_K_XL.gguf",
        "mmproj": "mmproj-F16.gguf",
        "port": 8003,
        "ctx": 65536,
        "kv_type": "q8_0",
        "extra_args": [],
        "target_tps": 97,
        "warmup": 3,
    },
    "27b": {
        "name": "27B Quality",
        "model": "Qwen3.5-27B-Q3_K_S.gguf",
        "mmproj": "mmproj-27B-F16.gguf",
        "port": 8004,
        "ctx": 65536,
        "kv_type": "iq4_nl",
        "extra_args": ["--parallel", "1"],
        "target_tps": 46,
        "warmup": 5,
    },
}

BENCHMARK_PROMPTS = [
    "Write a Python function to calculate fibonacci",
    "Write a function to check if a string is a palindrome",
    "Write a function to reverse a list",
]


def find_server():
    """Find llama-server executable (SM120 > prebuilt)"""
    if SM120_SERVER.exists():
        return SM120_SERVER, "SM120 native"
    elif PREBUILT_SERVER.exists():
        return PREBUILT_SERVER, "prebuilt (JIT)"
    else:
        return None, None


def kill_server():
    """Kill any running llama-server"""
    try:
        subprocess.run(
            ["taskkill", "/F", "/IM", "llama-server.exe"],
            capture_output=True,
            timeout=5,
        )
        time.sleep(2)
    except:
        pass


def start_server(model_key: str) -> subprocess.Popen:
    """Start llama-server for a model"""
    config = MODELS[model_key]
    server_path, server_type = find_server()

    if not server_path:
        print("[ERROR] llama-server.exe not found!")
        sys.exit(1)

    model_path = MODELS_DIR / config["model"]
    mmproj_path = MODELS_DIR / config["mmproj"]

    if not model_path.exists():
        print(f"[ERROR] Model not found: {model_path}")
        sys.exit(1)

    cmd = [
        str(server_path),
        "-m",
        str(model_path),
        "--mmproj",
        str(mmproj_path),
        "--host",
        "127.0.0.1",
        "--port",
        str(config["port"]),
        "-c",
        str(config["ctx"]),
        "-ngl",
        "99",
        "--flash-attn",
        "on",
        "-ctk",
        config["kv_type"],
        "-ctv",
        config["kv_type"],
        "--temp",
        "0.6",
        "--top-p",
        "0.95",
        "--top-k",
        "20",
    ] + config["extra_args"]

    print(f"[*] Starting server ({server_type})...")
    print(f"    Model: {config['name']}")
    print(f"    Port: {config['port']}")

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return proc


def wait_for_server(port: int, timeout: int = 120) -> bool:
    """Wait for server to be ready"""
    print(f"[*] Waiting for model to load (up to {timeout}s)...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"http://127.0.0.1:{port}/health", timeout=2)
            if r.status_code == 200:
                return True
        except:
            pass
        time.sleep(2)
        elapsed = int(time.time() - start)
        if elapsed % 10 == 0:
            print(f"    Still loading... {elapsed}s")
    return False


def run_benchmark(port: int, warmup: int = 3, runs: int = 5) -> dict:
    """Run benchmark via API"""
    url = f"http://127.0.0.1:{port}/v1/chat/completions"
    results = []

    # Warmup
    print(f"[*] Warmup ({warmup} requests)...")
    for i in range(warmup):
        try:
            r = requests.post(
                url,
                json={
                    "model": "qwen",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 30,
                },
                timeout=60,
            )
            if r.status_code == 200:
                data = r.json()
                tps = data.get("timings", {}).get("predicted_per_second", 0)
                print(f"    Warmup {i + 1}: {tps:.1f} t/s")
        except Exception as e:
            print(f"    Warmup {i + 1}: Error - {e}")

    # Benchmark
    print(f"[*] Benchmark ({runs} runs)...")
    for i, prompt in enumerate(BENCHMARK_PROMPTS[:runs]):
        try:
            start = time.time()
            r = requests.post(
                url,
                json={
                    "model": "qwen",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 100,
                },
                timeout=120,
            )
            elapsed = time.time() - start

            if r.status_code == 200:
                data = r.json()
                tokens = data.get("usage", {}).get("completion_tokens", 0)
                timings = data.get("timings", {})
                gen_tps = timings.get("predicted_per_second", 0)
                prompt_tps = timings.get("prompt_per_second", 0)

                results.append(
                    {
                        "run": i + 1,
                        "gen_tps": gen_tps,
                        "prompt_tps": prompt_tps,
                        "tokens": tokens,
                        "time": elapsed,
                    }
                )
                print(
                    f"    Run {i + 1}: {gen_tps:.1f} t/s gen | {prompt_tps:.0f} t/s prompt ({tokens} tokens)"
                )
            else:
                print(f"    Run {i + 1}: HTTP {r.status_code}")
        except Exception as e:
            print(f"    Run {i + 1}: Error - {e}")

    return results


def calculate_summary(results: list) -> dict:
    """Calculate summary statistics"""
    if not results:
        return {}

    gen_tps = [r["gen_tps"] for r in results if r.get("gen_tps", 0) > 0]
    prompt_tps = [r["prompt_tps"] for r in results if r.get("prompt_tps", 0) > 0]

    return {
        "avg_gen_tps": sum(gen_tps) / len(gen_tps) if gen_tps else 0,
        "max_gen_tps": max(gen_tps) if gen_tps else 0,
        "min_gen_tps": min(gen_tps) if gen_tps else 0,
        "avg_prompt_tps": sum(prompt_tps) / len(prompt_tps) if prompt_tps else 0,
        "runs": len(results),
    }


def benchmark_model(model_key: str) -> dict:
    """Benchmark a single model"""
    config = MODELS[model_key]

    print("\n" + "=" * 60)
    print(f"  BENCHMARKING: {config['name']}")
    print(f"  Target: ~{config['target_tps']} t/s")
    print("=" * 60 + "\n")

    # Kill any existing server
    kill_server()

    # Start server
    proc = start_server(model_key)

    try:
        # Wait for ready
        if not wait_for_server(config["port"]):
            print("[ERROR] Server failed to start!")
            return {"error": "Server failed to start"}

        print("[*] Server ready!")

        # Run benchmark
        results = run_benchmark(config["port"], warmup=config["warmup"], runs=5)

        # Calculate summary
        summary = calculate_summary(results)

        return {
            "model": model_key,
            "name": config["name"],
            "target_tps": config["target_tps"],
            "results": results,
            "summary": summary,
        }

    finally:
        # Stop server
        print("[*] Stopping server...")
        proc.terminate()
        proc.wait(timeout=5)
        kill_server()


def print_comparison_table(all_results: list):
    """Print a comparison table"""
    print("\n" + "=" * 70)
    print("  BENCHMARK RESULTS COMPARISON")
    print("=" * 70)
    print()
    print(
        f"{'Model':<15} {'Target':>10} {'Avg t/s':>10} {'Max t/s':>10} {'Status':>10}"
    )
    print("-" * 70)

    for result in all_results:
        if "error" in result:
            print(
                f"{result.get('name', 'Unknown'):<15} {'-':>10} {'-':>10} {'-':>10} {'ERROR':>10}"
            )
            continue

        summary = result.get("summary", {})
        avg = summary.get("avg_gen_tps", 0)
        max_tps = summary.get("max_gen_tps", 0)
        target = result.get("target_tps", 0)

        status = "✅ PASS" if avg >= target * 0.8 else "⚠️ SLOW"

        print(
            f"{result['name']:<15} {target:>10} {avg:>10.1f} {max_tps:>10.1f} {status:>10}"
        )

    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Quick benchmark for Qwen models")
    parser.add_argument(
        "--model",
        choices=["35b", "9b", "27b", "all"],
        default="all",
        help="Model to benchmark (default: all)",
    )
    parser.add_argument("--runs", type=int, default=5, help="Number of benchmark runs")
    args = parser.parse_args()

    # Create results directory
    RESULTS_DIR.mkdir(exist_ok=True)

    # Determine which models to test
    if args.model == "all":
        models_to_test = ["35b", "9b", "27b"]
    else:
        models_to_test = [args.model]

    print("\n" + "=" * 60)
    print("  QWEN3.5 QUICK BENCHMARK")
    print("  RTX 5080 16GB - SM120 Native Build")
    print("=" * 60)
    print(f"\n  Models to test: {', '.join(models_to_test)}")
    print("  NOTE: Models run ONE AT A TIME (VRAM constraint)")

    # Find server
    server_path, server_type = find_server()
    if not server_path:
        print("\n[ERROR] llama-server.exe not found!")
        print("  Checked:")
        print(f"    - {SM120_SERVER}")
        print(f"    - {PREBUILT_SERVER}")
        sys.exit(1)

    print(f"\n  Server: {server_type}")

    # Run benchmarks
    all_results = []
    for model_key in models_to_test:
        result = benchmark_model(model_key)
        all_results.append(result)

    # Print comparison table
    print_comparison_table(all_results)

    # Save results
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    results_file = RESULTS_DIR / f"quick_benchmark_{timestamp}.json"

    output = {
        "timestamp": timestamp,
        "server_type": server_type,
        "results": all_results,
    }

    with open(results_file, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n  Results saved to: {results_file}")


if __name__ == "__main__":
    main()
