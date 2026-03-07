"""
Qwen3.5 API helper for the repo's recommended local llama.cpp presets.

Sampling defaults follow the official Qwen guidance, while default model names
match the 16GB-oriented configuration shipped in this repository.
"""

import base64
import requests
from pathlib import Path
from typing import Optional, Union, List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class SamplingMode(Enum):
    """Predefined sampling modes based on Qwen3.5 best practices"""

    # Thinking mode for general tasks
    THINKING_GENERAL = "thinking_general"

    # Thinking mode for precise coding tasks (e.g., WebDev)
    THINKING_CODING = "thinking_coding"

    # Instruct (non-thinking) mode for general tasks
    INSTRUCT_GENERAL = "instruct_general"

    # Instruct mode for reasoning tasks
    INSTRUCT_REASONING = "instruct_reasoning"


@dataclass
class SamplingParams:
    """Sampling parameters container"""

    temperature: float = 0.7
    top_p: float = 0.8
    top_k: int = 20
    min_p: float = 0.0
    presence_penalty: float = 1.5
    repetition_penalty: float = 1.0
    max_tokens: int = 32768  # Recommended: 32768 for most queries


# Official Qwen3.5 sampling presets
SAMPLING_PRESETS = {
    SamplingMode.THINKING_GENERAL: SamplingParams(
        temperature=1.0,
        top_p=0.95,
        top_k=20,
        min_p=0.0,
        presence_penalty=1.5,
        repetition_penalty=1.0,
    ),
    SamplingMode.THINKING_CODING: SamplingParams(
        temperature=0.6,
        top_p=0.95,
        top_k=20,
        min_p=0.0,
        presence_penalty=0.0,
        repetition_penalty=1.0,
    ),
    SamplingMode.INSTRUCT_GENERAL: SamplingParams(
        temperature=0.7,
        top_p=0.8,
        top_k=20,
        min_p=0.0,
        presence_penalty=1.5,
        repetition_penalty=1.0,
    ),
    SamplingMode.INSTRUCT_REASONING: SamplingParams(
        temperature=1.0,
        top_p=1.0,
        top_k=40,
        min_p=0.0,
        presence_penalty=2.0,
        repetition_penalty=1.0,
    ),
}


class QwenAPI:
    """Qwen3.5 API client with best practices built-in"""

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:8002",
        model: str = "Qwen3.5-35B-A3B-Q3_K_S.gguf",
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_url = f"{self.base_url}/v1/chat/completions"

    def encode_image(self, image_path: str) -> str:
        """Encode an image file to base64"""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def chat(
        self,
        prompt: str,
        system: str = "You are a helpful assistant.",
        mode: SamplingMode = SamplingMode.INSTRUCT_GENERAL,
        params: Optional[SamplingParams] = None,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Send a text-only chat request.

        Args:
            prompt: User message
            system: System message
            mode: Sampling mode preset
            params: Override sampling params
            max_tokens: Override max tokens (default: 32768)
            **kwargs: Additional API parameters

        Returns:
            API response dict
        """
        # Get sampling params
        if params is None:
            params = SAMPLING_PRESETS[mode]

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": params.temperature,
            "top_p": params.top_p,
            "top_k": params.top_k,
            "min_p": params.min_p,
            "presence_penalty": params.presence_penalty,
            "repetition_penalty": params.repetition_penalty,
            "max_tokens": max_tokens or params.max_tokens,
            **kwargs,
        }

        response = requests.post(self.api_url, json=payload)
        return response.json()

    def vision(
        self,
        prompt: str,
        image_path: str,
        system: str = "You are a helpful assistant.",
        mode: SamplingMode = SamplingMode.INSTRUCT_GENERAL,
        params: Optional[SamplingParams] = None,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Send a multimodal request with an image.

        Args:
            prompt: User message
            image_path: Path to image file
            system: System message
            mode: Sampling mode preset
            params: Override sampling params
            max_tokens: Override max tokens
            **kwargs: Additional API parameters

        Returns:
            API response dict
        """
        # Get sampling params
        if params is None:
            params = SAMPLING_PRESETS[mode]

        # Encode image
        image_data = self.encode_image(image_path)

        # Determine mime type
        ext = Path(image_path).suffix.lower()
        mime_type = "image/png" if ext == ".png" else "image/jpeg"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}"
                            },
                        },
                    ],
                },
            ],
            "temperature": params.temperature,
            "top_p": params.top_p,
            "top_k": params.top_k,
            "min_p": params.min_p,
            "presence_penalty": params.presence_penalty,
            "repetition_penalty": params.repetition_penalty,
            "max_tokens": max_tokens or params.max_tokens,
            **kwargs,
        }

        response = requests.post(self.api_url, json=payload)
        return response.json()

    def get_content(self, response: Dict[str, Any]) -> str:
        """Extract content from API response"""
        return response.get("choices", [{}])[0].get("message", {}).get("content", "")

    def get_stats(self, response: Dict[str, Any]) -> Dict[str, float]:
        """Extract performance stats from API response"""
        timings = response.get("timings", {})
        usage = response.get("usage", {})
        return {
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "prompt_tps": timings.get("prompt_per_second", 0),
            "gen_tps": timings.get("predicted_per_second", 0),
        }


# Convenience instances
api_35b = QwenAPI(base_url="http://127.0.0.1:8002", model="Qwen3.5-35B-A3B-Q3_K_S.gguf")

api_9b_vision = QwenAPI(
    base_url="http://127.0.0.1:8003", model="Qwen3.5-9B-UD-Q4_K_XL.gguf"
)


# ============================================================================
# QUICK REFERENCE - Best Practices from Qwen3.5 Official Docs
# ============================================================================

BEST_PRACTICES = """
QWEN3.5 BEST PRACTICES (Official Documentation)
===============================================

SAMPLING PARAMETERS:

1. Thinking mode (general tasks):
   temperature=1.0, top_p=0.95, top_k=20, min_p=0.0
   presence_penalty=1.5, repetition_penalty=1.0

2. Thinking mode (precise coding/WebDev):
   temperature=0.6, top_p=0.95, top_k=20, min_p=0.0
   presence_penalty=0.0, repetition_penalty=1.0

3. Instruct mode (general tasks):
   temperature=0.7, top_p=0.8, top_k=20, min_p=0.0
   presence_penalty=1.5, repetition_penalty=1.0

4. Instruct mode (reasoning tasks):
   temperature=1.0, top_p=1.0, top_k=40, min_p=0.0
   presence_penalty=2.0, repetition_penalty=1.0

OUTPUT LENGTH:
- Most queries: 32,768 tokens
- Complex problems (math/programming competitions): 81,920 tokens

CONTEXT LENGTH:
- Minimum recommended: 128K tokens to preserve thinking capabilities
- Native: 262,144 tokens

PROMPT TIPS:
- Math problems: "Please reason step by step, and put your final answer within \\boxed{}."
- Multiple choice: "Please show your choice in the answer field with only the choice letter, e.g., \\"answer\\": \\"C\\"."

MULTI-TURN CONVERSATIONS:
- Historical model output should only include final output
- Do NOT include thinking content in history
"""

if __name__ == "__main__":
    print(BEST_PRACTICES)
    print("\nExample usage:")
    print("""
from qwen_api import api_35b, api_9b_vision, SamplingMode

# Text chat with 35B (coding mode)
response = api_35b.chat(
    prompt="Write a Python function to sort a list",
    mode=SamplingMode.THINKING_CODING
)
print(api_35b.get_content(response))

# Vision with 9B
response = api_9b_vision.vision(
    prompt="Describe this image",
    image_path="screenshot.png",
    mode=SamplingMode.INSTRUCT_GENERAL
)
print(api_9b_vision.get_content(response))
""")
