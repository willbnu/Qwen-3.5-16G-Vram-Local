"""Unit tests for qwen_api defaults."""

from qwen_api import QwenAPI, api_35b, api_9b_vision


def test_default_35b_model_matches_repo_recommendation():
    """Default client should target the 16GB-friendly 35B quant."""
    client = QwenAPI()
    assert client.model == "Qwen3.5-35B-A3B-Q3_K_S.gguf"


def test_convenience_clients_use_expected_models():
    """Convenience helpers should match the documented presets."""
    assert api_35b.model == "Qwen3.5-35B-A3B-Q3_K_S.gguf"
    assert api_9b_vision.model == "Qwen3.5-9B-UD-Q4_K_XL.gguf"


def test_api_url_is_derived_from_base_url():
    """Client should normalize the API endpoint from the base URL."""
    client = QwenAPI(base_url="http://127.0.0.1:9000/")
    assert client.api_url == "http://127.0.0.1:9000/v1/chat/completions"
