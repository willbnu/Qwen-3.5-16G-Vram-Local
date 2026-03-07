"""
Sequential comparison runner for local Qwen presets on a single GPU.

Runs one server at a time via server_manager.py, warms it up, sends a small
set of comparable prompts, and writes the results to results/.
"""

import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from config.config_loader import get_config

PAYLOADS: dict[str, dict[str, Any]] = {
    "reasoning": {
        "messages": [
            {
                "role": "user",
                "content": (
                    "If it takes 5 machines 5 minutes to make 5 widgets, how long "
                    "do 100 machines take to make 100 widgets? Answer briefly."
                ),
            }
        ],
        "max_tokens": 120,
    },
    "coding": {
        "messages": [
            {
                "role": "user",
                "content": (
                    "Write a Python function that merges two sorted lists and "
                    "include one short doctest."
                ),
            }
        ],
        "max_tokens": 220,
    },
    "developer_role": {
        "messages": [
            {
                "role": "developer",
                "content": (
                    "You are a precise coding assistant. Keep the answer compact. "
                    "Think internally but only return code."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Write Python code for is_palindrome(s: str) -> bool and "
                    "include three assert tests."
                ),
            },
        ],
        "max_tokens": 220,
    },
}


def kill_servers() -> None:
    """Stop any running llama-server process before the next trial."""
    subprocess.run(
        ["taskkill", "/F", "/IM", "llama-server.exe"],
        capture_output=True,
        check=False,
    )
    time.sleep(3)


def read_vram_used_mib() -> int | None:
    """Read used VRAM for GPU 0 via nvidia-smi."""
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=memory.used",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            check=True,
            text=True,
        )
        first_line = result.stdout.strip().splitlines()[0]
        return int(first_line)
    except (IndexError, ValueError, subprocess.SubprocessError, FileNotFoundError):
        return None


def wait_for_vram_recovery(baseline_mib: int | None, tolerance_mib: int = 256, timeout: int = 180) -> int | None:
    """Wait until used VRAM drops back near the observed baseline."""
    if baseline_mib is None:
        time.sleep(3)
        return None

    deadline = time.time() + timeout
    while time.time() < deadline:
        current = read_vram_used_mib()
        if current is not None and current <= baseline_mib + tolerance_mib:
            return current
        time.sleep(2)
    return read_vram_used_mib()


def wait_for_server(port: int, timeout: int = 240) -> bool:
    """Poll the health endpoint until the server is ready."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            response = requests.get(f"http://127.0.0.1:{port}/health", timeout=2)
            if response.status_code == 200:
                return True
        except requests.RequestException:
            pass
        time.sleep(2)
    return False


def post_json(url: str, payload: dict[str, Any], timeout: int = 300) -> tuple[requests.Response, float]:
    """POST JSON and return the response with wall-clock time."""
    start = time.time()
    response = requests.post(url, json=payload, timeout=timeout)
    elapsed = time.time() - start
    return response, elapsed


def benchmark_server(server_key: str) -> dict[str, Any]:
    """Launch and benchmark a configured server sequentially."""
    config = get_config()
    server = config.get_server(server_key)
    if server is None:
        raise ValueError(f"Unknown server key: {server_key}")

    print(f"=== {server_key} ({server.name}) ===", flush=True)
    kill_servers()
    baseline_mib = read_vram_used_mib()
    recovered_mib = wait_for_vram_recovery(baseline_mib)
    subprocess.run(
        [sys.executable, "server_manager.py", "start", "--server", server_key],
        cwd=ROOT,
        check=True,
    )

    if not wait_for_server(server.port):
        return {"name": server.name, "error": "server failed to start"}

    api_url = f"http://127.0.0.1:{server.port}/v1/chat/completions"
    result: dict[str, Any] = {
        "name": server.name,
        "port": server.port,
        "model": server.model,
        "context": server.context,
        "parallel": server.parallel,
        "reasoning_budget": server.reasoning_budget,
        "chat_template_file": (
            str(server.chat_template_file) if server.chat_template_file else None
        ),
        "vram_baseline_mib": baseline_mib,
        "vram_before_launch_mib": recovered_mib,
        "runs": {},
    }

    for _ in range(2):
        try:
            post_json(
                api_url,
                {
                    "model": server.model,
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 24,
                    "temperature": server.temp,
                    "top_p": server.top_p,
                    "top_k": server.top_k,
                },
                timeout=180,
            )
        except requests.RequestException:
            pass

    for label, extra in PAYLOADS.items():
        payload = {
            "model": server.model,
            "temperature": server.temp,
            "top_p": server.top_p,
            "top_k": server.top_k,
            **extra,
        }
        try:
            response, elapsed = post_json(api_url, payload)
            run_result: dict[str, Any] = {
                "http_status": response.status_code,
                "elapsed": round(elapsed, 2),
            }
            if response.status_code == 200:
                data = response.json()
                message = data.get("choices", [{}])[0].get("message", {})
                run_result.update(
                    {
                        "success": True,
                        "completion_tokens": data.get("usage", {}).get(
                            "completion_tokens", 0
                        ),
                        "prompt_tokens": data.get("usage", {}).get(
                            "prompt_tokens", 0
                        ),
                        "gen_tps": data.get("timings", {}).get(
                            "predicted_per_second", 0
                        ),
                        "prompt_tps": data.get("timings", {}).get(
                            "prompt_per_second", 0
                        ),
                        "content_preview": message.get("content", "")[:400],
                        "reasoning_preview": message.get("reasoning_content", "")[:400],
                    }
                )
            else:
                run_result.update(
                    {
                        "success": False,
                        "error": response.text[:400],
                    }
                )
        except requests.RequestException as exc:
            run_result = {"success": False, "error": str(exc)}

        result["runs"][label] = run_result
        status = "OK" if run_result.get("success") else "FAIL"
        print(f"  {label}: {status} {run_result.get('gen_tps', 0):.1f} t/s", flush=True)

    return result


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Sequential local model comparison")
    parser.add_argument(
        "--servers",
        nargs="+",
        default=["coding", "quality_vision", "quality_text_agent", "qwopus_reasoning"],
        help="Server keys to benchmark sequentially",
    )
    args = parser.parse_args()

    results: dict[str, Any] = {
        "timestamp": datetime.now().isoformat(),
        "servers": {},
    }

    try:
        for server_key in args.servers:
            results["servers"][server_key] = benchmark_server(server_key)
    finally:
        kill_servers()

    output = ROOT / "results" / f"experimental_compare_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"RESULT_FILE={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
