# API Examples

## Terminal Chat

```bash
python chat.py
python chat.py --port 8003
python chat.py --system "You are a coding expert."
```

Useful commands inside chat:

- `/img <path> [question]`
- `/speed`
- `/clear`
- `/quit`

## Config Loader

```python
from config.config_loader import get_config

config = get_config()
coding = config.get_server("coding")

print(coding.port)
print(coding.api_url)
```

## Python Helper

```python
from qwen_api import api_35b, api_9b_vision, SamplingMode

response = api_35b.chat(
    prompt="Write a Python function to reverse a list.",
    mode=SamplingMode.THINKING_CODING,
)

vision = api_9b_vision.vision(
    prompt="Describe this image.",
    image_path="example.png",
)
```

## Direct HTTP

```bash
curl http://127.0.0.1:8002/health
curl http://127.0.0.1:8002/v1/models

curl -X POST http://127.0.0.1:8002/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"Qwen3.5-35B-A3B-Q3_K_S.gguf\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"
```
