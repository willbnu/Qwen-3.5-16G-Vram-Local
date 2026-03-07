"""
Legacy Vision Test - Updated for new config system.
Tests 9B Fast Vision server (port 8003).
"""

import base64
import requests
import sys
import time
from pathlib import Path

# Add repo root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from config.config_loader import get_config

# Get server config
config = get_config()
SERVER = config.get_server("fast_vision")  # 9B on port 8003


def encode_image(image_path: str) -> str:
    """Encode an image file to base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def test_vision(image_path: str, prompt: str, max_tokens: int = 200) -> dict:
    """Test vision API with an image"""
    image_data = encode_image(image_path)

    ext = Path(image_path).suffix.lower()
    mime_type = "image/png" if ext == ".png" else "image/jpeg"

    payload = {
        "model": SERVER.model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_data}"},
                    },
                ],
            },
        ],
        "max_tokens": max_tokens,
    }

    start_time = time.time()
    response = requests.post(SERVER.api_url, json=payload)
    elapsed = time.time() - start_time

    return {"response": response.json(), "elapsed": elapsed}


def test_text_only(prompt: str, max_tokens: int = 100) -> dict:
    """Test text-only API"""
    payload = {
        "model": SERVER.model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
    }

    start_time = time.time()
    response = requests.post(SERVER.api_url, json=payload)
    elapsed = time.time() - start_time

    return {"response": response.json(), "elapsed": elapsed}


def main():
    if len(sys.argv) < 2:
        print(f"9B Fast Vision Test (Port {SERVER.port})")
        print()
        print("Usage: python tests/manual/test_vision.py <image_path> [prompt]")
        print("       python tests/manual/test_vision.py --text <prompt>")
        print()
        print("Examples:")
        print("  python tests/manual/test_vision.py screenshot.png 'What do you see?'")
        print("  python tests/manual/test_vision.py --text 'Hello, how are you?'")
        sys.exit(1)

    if sys.argv[1] == "--text":
        prompt = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Hello!"
        print(f"Testing text-only: {prompt}")
        print("-" * 50)
        result = test_text_only(prompt)
    else:
        image_path = sys.argv[1]
        prompt = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Describe this image."

        if not Path(image_path).exists():
            print(f"Error: Image not found: {image_path}")
            sys.exit(1)

        print(f"Testing 9B Vision: {image_path}")
        print(f"Server: {SERVER.name} (port {SERVER.port})")
        print(f"Prompt: {prompt}")
        print("-" * 50)
        result = test_vision(image_path, prompt)

    data = result["response"]

    if "choices" in data:
        content = data["choices"][0]["message"]["content"]
        print(f"\nResponse:\n{content}\n")

        if "usage" in data:
            print("Stats:")
            print(f"  Prompt tokens: {data['usage']['prompt_tokens']}")
            print(f"  Completion tokens: {data['usage']['completion_tokens']}")

        if "timings" in data:
            print(f"  Prompt speed: {data['timings']['prompt_per_second']:.1f} t/s")
            print(f"  Gen speed: {data['timings']['predicted_per_second']:.1f} t/s")

        print(f"  Total time: {result['elapsed']:.2f}s")
    else:
        print(f"Error: {data}")


if __name__ == "__main__":
    main()
