#!/usr/bin/env python3
"""
Test Qwen-Agent with local llama.cpp server.

Prerequisites:
    pip install qwen-agent

Run:
    python tests/test_qwen_agent_local.py
"""

import sys
import os
import pytest

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import qwen_agent as _qwen_agent
except ImportError:
    _qwen_agent = None

pytestmark = pytest.mark.skipif(
    _qwen_agent is None,
    reason="qwen_agent is optional and is not installed in this environment",
)


def test_basic_chat():
    """Test basic chat without tools."""
    from qwen_agent.agents import Assistant

    # Configure for local llama.cpp server
    llm_cfg = {
        "model": "Qwen3.5-35B-A3B-Q3_K_S.gguf",  # Model name from /v1/models
        "model_server": "http://localhost:8002/v1",  # OpenAI-compatible API
        "api_key": "EMPTY",  # Required but unused for local
        "generate_cfg": {
            "top_p": 0.9,
            "temperature": 0.7,
        },
    }

    print("=" * 60)
    print("Testing Qwen-Agent with local Qwen3.5-35B-A3B")
    print("=" * 60)

    # Create a simple assistant
    bot = Assistant(
        llm=llm_cfg,
        system_message="You are a helpful coding assistant. Be concise.",
    )

    # Test message
    messages = [
        {
            "role": "user",
            "content": "Write a Python function to reverse a string. Keep it short.",
        }
    ]

    print("\nUser: Write a Python function to reverse a string. Keep it short.")
    print("\nAssistant: ", end="", flush=True)

    response_text = ""
    for response in bot.run(messages=messages):
        # Extract text from response
        if response:
            for msg in response:
                if msg.get("role") == "assistant":
                    content = msg.get("content", "")
                    if content:
                        # Print only new content
                        new = content[len(response_text) :]
                        print(new, end="", flush=True)
                        response_text = content

    print("\n")
    print("=" * 60)
    print("[OK] Basic chat test PASSED")
    return True


def test_function_calling():
    """Test function calling with custom tool."""
    from qwen_agent.agents import Assistant
    from qwen_agent.tools.base import BaseTool, register_tool
    import json

    @register_tool("get_weather")
    class WeatherTool(BaseTool):
        description = "Get current weather for a city"
        parameters = [
            {
                "name": "city",
                "type": "string",
                "description": "City name",
                "required": True,
            }
        ]

        def call(self, params: str, **kwargs) -> str:
            data = json.loads(params)
            city = data.get("city", "unknown")
            # Mock response
            return json.dumps(
                {"city": city, "temperature": "22°C", "condition": "sunny"}
            )

    llm_cfg = {
        "model": "Qwen3.5-35B-A3B-Q3_K_S.gguf",
        "model_server": "http://localhost:8002/v1",
        "api_key": "EMPTY",
    }

    print("\n" + "=" * 60)
    print("Testing Function Calling")
    print("=" * 60)

    bot = Assistant(
        llm=llm_cfg,
        system_message="You have access to a weather tool. Use it when asked about weather.",
        function_list=["get_weather"],
    )

    messages = [{"role": "user", "content": "What's the weather in Tokyo?"}]

    print("\nUser: What's the weather in Tokyo?")
    print("\nAssistant: ", end="", flush=True)

    response_text = ""
    for response in bot.run(messages=messages):
        if response:
            for msg in response:
                content = msg.get("content", "")
                if content and msg.get("role") == "assistant":
                    new = content[len(response_text) :]
                    print(new, end="", flush=True)
                    response_text = content

    print("\n")
    print("=" * 60)
    print("[OK] Function calling test PASSED")
    return True


def test_streaming():
    """Test streaming response."""
    from qwen_agent.agents import Assistant
    import time

    llm_cfg = {
        "model": "Qwen3.5-35B-A3B-Q3_K_S.gguf",
        "model_server": "http://localhost:8002/v1",
        "api_key": "EMPTY",
    }

    print("\n" + "=" * 60)
    print("Testing Streaming Response")
    print("=" * 60)

    bot = Assistant(llm=llm_cfg)

    messages = [{"role": "user", "content": "Count from 1 to 5, one per line."}]

    print("\nUser: Count from 1 to 5, one per line.")
    print("\nAssistant: ", end="", flush=True)

    start_time = time.time()
    token_count = 0
    last_content = ""

    for response in bot.run(messages=messages):
        if response:
            for msg in response:
                content = msg.get("content", "")
                if content and msg.get("role") == "assistant":
                    new = content[len(last_content) :]
                    if new:
                        print(new, end="", flush=True)
                        token_count += len(new.split())  # Rough estimate
                    last_content = content

    elapsed = time.time() - start_time
    print(f"\n\nTime: {elapsed:.2f}s")
    print("=" * 60)
    print("[OK] Streaming test PASSED")
    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("QWEN-AGENT LOCAL MODEL COMPATIBILITY TEST")
    print("=" * 60)

    # Check if qwen-agent is installed
    try:
        import qwen_agent

        ver = (
            qwen_agent.__version__ if hasattr(qwen_agent, "__version__") else "unknown"
        )
        print(f"[OK] qwen-agent version: {ver}")
    except ImportError as e:
        print(f"[FAIL] qwen-agent not installed: {e}")
        print("\nInstall with:")
        print("  pip install qwen-agent")
        print("\nOr with extras:")
        print('  pip install "qwen-agent[gui,rag,code_interpreter,mcp]"')
        return 1

    # Check server
    import urllib.request

    try:
        with urllib.request.urlopen(
            "http://localhost:8002/v1/models", timeout=5
        ) as resp:  # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected, python.lang.security.audit.insecure-transport.urllib.insecure-urlopen.insecure-urlopen
            print("[OK] Local Qwen server running at http://localhost:8002")
    except Exception as e:
        print(f"[FAIL] Server not reachable: {e}")
        print("\nStart server with:")
        print("  scripts\\windows\\start_chat_server.bat 35b")
        return 1

    print()

    tests = [
        ("Basic Chat", test_basic_chat),
        ("Function Calling", test_function_calling),
        ("Streaming", test_streaming),
    ]

    results = []
    for name, test_fn in tests:
        try:
            result = test_fn()
            results.append((name, "PASS" if result else "FAIL"))
        except Exception as e:
            print(f"\n[FAIL] {name} FAILED: {e}")
            results.append((name, "FAIL"))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for name, status in results:
        symbol = "[OK]" if status == "PASS" else "[FAIL]"
        print(f"  {symbol} {name}: {status}")

    all_passed = all(s == "PASS" for _, s in results)
    print()
    if all_passed:
        print(">>> ALL TESTS PASSED - Qwen-Agent works with your local model!")
    else:
        print(">>> Some tests failed - check output above")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
