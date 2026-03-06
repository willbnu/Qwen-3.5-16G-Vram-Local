# Kilo Agent Capability Registry

**Version**: 2.0.0
**Project**: qwen-llm
**Purpose**: Explicit capability definitions for intelligent routing and local model usage

---

## Local Model Configuration

### Available Models

| Server | Port | Model | Speed | Context | Best For |
|--------|------|-------|-------|---------|----------|
| 🖥️ **Coding** | 8002 | Qwen3.5-35B-A3B Q3_K_S | 125 t/s | 152K | Primary coding, reasoning |
| 👁️ **Vision** | 8003 | Qwen2.5-VL-9B Q4_K_XL | 97 t/s | 256K | Fast vision, chat |
| 🎯 **Quality** | 8004 | Qwen2.5-VL-27B Q3_K_S | 46 t/s | 96K | Best reasoning quality |

### Model Selection Guide

```yaml
task_type:
  coding:
    primary: "local-qwen/qwen35-35b"
    fallback: "zai-glm/glm-5"
  
  vision:
    primary: "local-qwen-vision/qwen25-vl-9b"
    fallback: "kimi-nvidia/moonshotai/kimi-k2.5"
  
  quality:
    primary: "local-qwen-quality/qwen25-vl-27b"
    fallback: "zai-glm/glm-5"
  
  fast:
    primary: "local-qwen-vision/qwen25-vl-9b"
    fallback: "zai-glm/glm-4.7"
```

---

## Agent Capabilities

### Primary Agent: Kilo

```yaml
agent:
  name: "kilo"
  type: "orchestrator"
  default_model: "local-qwen/qwen35-35b"
  
capabilities:
  orchestration:
    - task_decomposition      # Break down complex tasks
    - parallel_execution      # Run multiple operations in parallel
    - wave_based_execution    # Execute in dependency waves
    - todo_tracking           # Track progress with todo lists
  
  execution:
    - code_implementation     # Can implement code
    - file_editing            # Can edit files
    - git_operations          # Can commit, push
    - browser_automation      # Can automate browsers
  
  verification:
    - zep_compliance          # Zero Error Protocol
    - confidence_assessment   # Assess output confidence
    - source_citation         # Cite sources for claims

tools:
  - read, write, edit files
  - bash commands
  - glob, grep for search
  - webfetch for web content
  - task for parallel agents

when_to_use:
  - All user requests (primary interface)
  - Complex multi-step work
  - Code implementation
  - Research and exploration
```

### Specialist Modes

```yaml
explore:
  description: "Fast codebase search"
  model: "local-qwen-vision/qwen25-vl-9b"
  capabilities:
    - codebase_mapping
    - pattern_detection
    - file_discovery
  when_to_use:
    - Keywords: "find", "where is", "show me"
    - Task: Quick file search

general:
  description: "Multi-step implementation"
  model: "local-qwen/qwen35-35b"
  capabilities:
    - autonomous_research
    - end_to_end_execution
    - code_implementation
  when_to_use:
    - Complex tasks requiring multiple steps
    - Implementation work
```

---

## Routing Decision Matrix

| User Intent | Primary Model | Fallback |
|-------------|---------------|----------|
| Code/Implement | local-qwen/qwen35-35b | zai-glm/glm-5 |
| Debug/Fix | local-qwen/qwen35-35b | zai-glm/glm-5 |
| Research/Learn | local-qwen-vision/qwen25-vl-9b | zai-glm/glm-4.7 |
| Find/Locate | local-qwen-vision/qwen25-vl-9b | zai-glm/glm-4.7 |
| Vision/Image | local-qwen-vision/qwen25-vl-9b | kimi-nvidia/kimi-k2.5 |
| Quality/Review | local-qwen-quality/qwen25-vl-27b | zai-glm/glm-5 |

---

## ZEP Integration

All agents follow the Zero Error Protocol:

1. **VERIFY BEFORE OUTPUT** - Internal check before every response
2. **Confidence Levels** - HIGH / MEDIUM / LOW assessment
3. **Uncertainty Labels** - [ASSUMPTION], [INFERENCE], [UNCERTAIN], [SPECULATION]
4. **Source Citation** - Required for factual claims

### Confidence Thresholds

| Score | Action |
|-------|--------|
| ≥ 0.90 | ACT — Execute immediately |
| 0.70-0.89 | ASK — Request clarification |
| < 0.70 | ABSTAIN — Route to fallback |

---

## Browser Automation

```yaml
tools:
  agent-browser:
    path: "C:\Users\Admin\npm-global\agent-browser.cmd"
    use_for: ["general automation", "testing", "screenshots"]
  
  pinchtab:
    path: "C:\Users\Admin\.pinchtab\bin\pinchtab-windows-x64.exe"
    use_for: ["multi-account", "stealth scraping", "token efficiency"]

commands:
  open: "agent-browser open <url>"
  snapshot: "agent-browser snapshot -i"
  click: "agent-browser click @e1"
  fill: "agent-browser fill @e1 'text'"
  screenshot: "agent-browser screenshot"
```

---

## Memory System (Graphiti)

```yaml
tools:
  - mcp__graphiti-memory__search_nodes
  - mcp__graphiti-memory__search_facts
  - mcp__graphiti-memory__add_episode
  - mcp__graphiti-memory__get_episodes
  - mcp__graphiti-memory__get_entity_edge

capabilities:
  - Remember context across sessions
  - Build knowledge about projects
  - Track decisions and rationale
  - Recall past interactions
```

---

## Quick Reference

### Start Servers
```bash
# Coding server (port 8002)
start_servers_speed.bat

# Or manually:
llama-server -m models/qwen35-35b-q3_k_s.gguf --port 8002
```

### Test Model
```bash
curl http://localhost:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Check Server Status
```bash
curl http://localhost:8002/v1/models
```
