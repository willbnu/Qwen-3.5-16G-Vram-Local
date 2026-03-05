#!/usr/bin/env python3
"""
chat.py — Lightweight terminal chat client for llama.cpp OpenAI-compatible API.
No GPU usage. No browser. Pure text + vision. Pure speed.

Usage:
    python chat.py                    # default port 8002
    python chat.py --port 8003        # different model
    python chat.py --system "You are a coding expert."

Commands during chat:
    /quit or /exit          — exit
    /clear                  — clear conversation history
    /speed                  — show last token/s measurement
    /system <text>          — change system prompt mid-session
    /img <path> [question]  — send an image with optional question
    /help                   — show commands

Vision example:
    You> /img C:\\screenshot.png What is shown in this image?
    You> /img C:\\chart.png Describe the data trends.
"""

import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.request
import urllib.error
from typing import Optional

# ── ANSI colours ──────────────────────────────────────────────────────────────
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"
MAGENTA = "\033[35m"
BLUE = "\033[34m"


def c(text, colour):
    return f"{colour}{text}{RESET}"


# ── Image helpers ──────────────────────────────────────────────────────────────
def load_image_b64(path: str) -> tuple[str, str]:
    """Load image from path, return (base64_data, mime_type)."""
    path = path.strip().strip('"').strip("'")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Image not found: {path}")
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return b64, mime


def make_vision_message(image_path: str, question: str) -> dict:
    """Build an OpenAI-compatible multimodal user message."""
    b64, mime = load_image_b64(image_path)
    return {
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
            },
            {
                "type": "text",
                "text": question or "Describe this image in detail.",
            },
        ],
    }


# ── Streaming chat completion ──────────────────────────────────────────────────
def stream_chat(
    base_url: str, messages: list, temperature=0.6, top_p=0.95, top_k=20
) -> tuple[str, float]:
    """Stream a chat completion. Returns (full_reply, tokens_per_second)."""
    payload = json.dumps(
        {
            "model": "local",
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "stream": True,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        f"{base_url}/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    full_text = ""
    token_count = 0
    t_start = None

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            print(c("\nQwen3.5> ", CYAN + BOLD), end="", flush=True)
            for raw_line in resp:
                line = raw_line.decode("utf-8").strip()
                if not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                delta = chunk.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    if t_start is None:
                        t_start = time.perf_counter()
                    print(content, end="", flush=True)
                    full_text += content
                    token_count += 1

                usage = chunk.get("usage") or {}
                if usage.get("completion_tokens"):
                    token_count = usage["completion_tokens"]

    except urllib.error.URLError as e:
        print(c(f"\n[ERROR] Cannot reach server: {e.reason}", RED))
        return "", 0.0
    except Exception as e:
        print(c(f"\n[ERROR] {e}", RED))
        return "", 0.0

    t_end = time.perf_counter()
    elapsed = t_end - (t_start or t_end)
    tps = token_count / elapsed if elapsed > 0 and token_count > 0 else 0.0
    print()
    return full_text, tps


# ── Health helpers ─────────────────────────────────────────────────────────────
def check_health(base_url: str) -> bool:
    try:
        with urllib.request.urlopen(f"{base_url}/health", timeout=5) as resp:
            return json.loads(resp.read()).get("status") == "ok"
    except Exception:
        return False


def wait_for_server(base_url: str, timeout: int = 180) -> bool:
    print(c("⏳ Waiting for server...", YELLOW), end="", flush=True)
    deadline = time.time() + timeout
    while time.time() < deadline:
        if check_health(base_url):
            print(c(" ✓", GREEN))
            return True
        print(".", end="", flush=True)
        time.sleep(2)
    print(c(" TIMED OUT", RED))
    return False


# ── Main REPL ──────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Terminal chat + vision client for llama.cpp"
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8002)
    parser.add_argument("--system", default="You are a helpful assistant.")
    parser.add_argument("--temp", type=float, default=0.6)
    parser.add_argument("--top-p", type=float, default=0.95)
    parser.add_argument("--top-k", type=int, default=20)
    args = parser.parse_args()

    base_url = f"http://{args.host}:{args.port}"

    print()
    print(c("╔═══════════════════════════════════════════════════════╗", CYAN))
    print(c("║  Qwen3.5-35B Terminal Chat  │  text + vision  ║", CYAN))
    print(c("╚═══════════════════════════════════════════════════════╝", CYAN))
    print(c(f"  Server  : {base_url}", DIM))
    print(c(f"  Context : 64K tokens", DIM))
    print(
        c(
            f"  System  : {args.system[:60]}{'...' if len(args.system) > 60 else ''}",
            DIM,
        )
    )
    print(c("  Commands: /quit  /clear  /speed  /system  /img  /help", DIM))
    print()

    if not check_health(base_url):
        if not wait_for_server(base_url):
            print(c("Server not reachable. Is it running?", RED))
            sys.exit(1)
    else:
        print(c("✓ Server ready", GREEN))

    messages: list = [{"role": "system", "content": args.system}]
    last_tps: Optional[float] = None

    print()
    while True:
        try:
            user_input = input(c("You> ", GREEN + BOLD)).strip()
        except (EOFError, KeyboardInterrupt):
            print(c("\nBye!", DIM))
            break

        if not user_input:
            continue

        # ── Commands ────────────────────────────────────────────────────────
        if user_input.startswith("/"):
            parts = user_input.split(None, 1)
            cmd = parts[0].lower()

            if cmd in ("/quit", "/exit", "/q"):
                print(c("Bye!", DIM))
                break

            elif cmd == "/clear":
                messages = [{"role": "system", "content": args.system}]
                print(c("✓ Conversation cleared.", YELLOW))
                continue

            elif cmd == "/speed":
                if last_tps is not None:
                    print(c(f"⚡ Last response: {last_tps:.1f} t/s", MAGENTA))
                else:
                    print(c("No generation yet.", DIM))
                continue

            elif cmd == "/system":
                if len(parts) > 1:
                    args.system = parts[1]
                    messages[0] = {"role": "system", "content": args.system}
                    print(c("✓ System prompt updated.", YELLOW))
                else:
                    print(c("Usage: /system <new prompt>", DIM))
                continue

            elif cmd == "/img":
                # /img <path> [optional question...]
                if len(parts) < 2:
                    print(c("Usage: /img <image_path> [question]", DIM))
                    print(c("Example: /img C:\\photo.jpg What is in this image?", DIM))
                    continue

                rest = parts[1].strip()

                # Parse path — handle quoted paths or unquoted with spaces
                if rest.startswith('"') or rest.startswith("'"):
                    quote_char = rest[0]
                    end_quote = rest.find(quote_char, 1)
                    if end_quote == -1:
                        img_path = rest[1:]
                        question = "Describe this image in detail."
                    else:
                        img_path = rest[1:end_quote]
                        question = (
                            rest[end_quote + 1 :].strip()
                            or "Describe this image in detail."
                        )
                else:
                    # Assume path ends at first space that is followed by a word (not a path sep)
                    # Simple heuristic: split on first space after the extension
                    tokens = rest.split(" ")
                    # Walk tokens until we find one that looks like an extension boundary
                    img_path = tokens[0]
                    question_tokens = tokens[1:]
                    for i, tok in enumerate(tokens[1:], 1):
                        candidate = " ".join(tokens[: i + 1])
                        if os.path.exists(candidate):
                            img_path = candidate
                            question_tokens = tokens[i + 1 :]
                        elif os.path.exists(img_path):
                            break
                    question = (
                        " ".join(question_tokens).strip()
                        or "Describe this image in detail."
                    )

                try:
                    print(c(f"  📷 Loading: {img_path}", BLUE))
                    msg = make_vision_message(img_path, question)
                    messages.append(msg)
                    print(c(f"  ❓ Question: {question}", DIM))
                except FileNotFoundError as e:
                    print(c(f"  [ERROR] {e}", RED))
                    continue
                except Exception as e:
                    print(c(f"  [ERROR] Failed to load image: {e}", RED))
                    continue

                reply, tps = stream_chat(
                    base_url,
                    messages,
                    temperature=args.temp,
                    top_p=args.top_p,
                    top_k=args.top_k,
                )

                if reply:
                    # Store assistant reply as text only (no need to re-send image)
                    messages.append({"role": "assistant", "content": reply})
                    last_tps = tps
                    if tps > 0:
                        print(c(f"  ⚡ {tps:.1f} t/s", MAGENTA + DIM))
                print()
                continue

            elif cmd == "/help":
                print(
                    c(
                        """
Commands:
  /quit   /exit         — exit chat
  /clear                — clear conversation history
  /speed                — show last generation speed (t/s)
  /system <text>        — change system prompt
  /img <path> [text]    — send image + optional question
                          path can be quoted for spaces:
                          /img "C:\\My Photos\\cat.jpg" What breed is this?
  /help                 — this message

Vision tips:
  • Works with .jpg .png .gif .webp .bmp
  • After sending an image you can follow up with text
    (the model remembers the image in this turn)
  • /clear resets everything including images
""",
                        DIM,
                    )
                )
                continue

            else:
                print(c(f"Unknown command: {cmd}. Type /help.", YELLOW))
                continue

        # ── Normal text message ──────────────────────────────────────────────
        messages.append({"role": "user", "content": user_input})

        reply, tps = stream_chat(
            base_url,
            messages,
            temperature=args.temp,
            top_p=args.top_p,
            top_k=args.top_k,
        )

        if reply:
            messages.append({"role": "assistant", "content": reply})
            last_tps = tps
            if tps > 0:
                print(c(f"  ⚡ {tps:.1f} t/s", MAGENTA + DIM))
        print()


if __name__ == "__main__":
    main()
