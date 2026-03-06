# Qwen-Agent vs OpenCode/oh-my-opencode: Framework Comparison

**Created**: 2025-03-05
**Purpose**: Deep analysis for deciding whether to adopt Qwen-Agent or continue with OpenCode

---

## Executive Summary

| Aspect                | Qwen-Agent                      | OpenCode/oh-my-opencode             |
| --------------------- | ------------------------------- | ----------------------------------- |
| **Origin**            | Alibaba Qwen Team               | Open-source community               |
| **Primary Model**     | Qwen family (native)            | Any LLM (GLM-5, Kimi K2.5, etc.)    |
| **Architecture**      | Single-framework Python library | Multi-agent TUI + discipline agents |
| **Code Execution**    | Docker sandbox (secure)         | Shell commands (direct)             |
| **RAG**               | Built-in 1M token support       | External (Graphiti memory)          |
| **MCP Support**       | Native                          | External tools                      |
| **Browser Extension** | Yes (BrowserQwen)               | CLI only                            |
| **Learning Curve**    | Medium (Python)                 | Low (TUI) / High (customize)        |

---

## Architecture Comparison

### Qwen-Agent Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Qwen-Agent Framework                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Assistant  │  │  FnCallAgent│  │  ReActChat  │     │
│  │  (Primary)  │  │ (Tool-call) │  │ (Reasoning) │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │            │
│  ┌──────┴────────────────┴────────────────┴──────┐     │
│  │              BaseChatModel (LLM)              │     │
│  │  - Function Calling (Native)                  │     │
│  │  - Parallel Tool Calls                        │     │
│  │  - Streaming Output                           │     │
│  └───────────────────────┬───────────────────────┘     │
│                          │                             │
│  ┌───────────────────────┴───────────────────────┐     │
│  │                 Tool Layer                     │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │     │
│  │  │ code_    │ │ RAG      │ │ MCP Servers  │  │     │
│  │  │interpreter│ │(1M tok)  │ │(filesystem,  │  │     │
│  │  │(Docker)  │ │          │ │ sqlite, etc) │  │     │
│  │  └──────────┘ └──────────┘ └──────────────┘  │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### OpenCode/oh-my-opencode Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  OpenCode TUI (Will/Kilo)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │     Meta-Orchestrator (routes user intent)      │   │
│  └───────────────────────┬─────────────────────────┘   │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│           oh-my-opencode Discipline Agents              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Sisyphus │ │Hephaestus│ │Prometheus│ │  Oracle  │  │
│  │(Orchestr.)│ │(Executor)│ │ (Planner)│ │(Analyst) │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │         │
│  ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐     │
│  │Librarian│ │ Explorer│ │ Designer│ │  Fixer  │     │
│  │(Research)│ │ (Search)│ │ (Vision)│ │  (Bug)  │     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                    Tool Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ File Ops    │ │ Shell/Bash  │ │ Browser     │       │
│  │ (Read/Write)│ │ (Commands)  │ │(Chrome Dev) │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Graphiti    │ │ Context7    │ │ Web Fetch   │       │
│  │ (Memory)    │ │ (Docs)      │ │ (Internet)  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Feature Deep Dive

### 1. Function Calling / Tool Use

#### Qwen-Agent

```python
# Native function calling with automatic parsing
@register_tool('my_tool')
class MyTool(BaseTool):
    description = "Tool description"
    parameters = [{'name': 'param', 'type': 'string'}]

    def call(self, params: str, **kwargs) -> str:
        return "result"

# Parallel tool calls supported natively
bot = Assistant(llm=llm_cfg, function_list=['my_tool', 'code_interpreter'])
```

**Pros:**

- Native parallel function calling
- Automatic parameter validation
- Built-in tool registry
- Works with Qwen's native tool training

**Cons:**

- Tied to Qwen models for best results
- Learning curve for custom tools

#### OpenCode

```yaml
# Agent capabilities defined in YAML
agent:
  name: "hephaestus"
  capabilities:
    - code_implementation
    - autonomous_research
```

**Pros:**

- Language-agnostic (works with any model)
- Declarative agent definitions
- Flexible tool integration

**Cons:**

- Function calling depends on model capability
- No native parallel tool orchestration

---

### 2. Code Execution

#### Qwen-Agent: Docker Sandbox

```python
# Secure Docker-based execution
tools = ['code_interpreter']  # Built-in
bot = Assistant(llm=llm_cfg, function_list=tools)

# Code runs in isolated container
# - No access to host filesystem (except mounted dir)
# - Network isolated by default
# - Resource limits enforced
```

**Security:** HIGH

- Sandboxed by default
- Explicit directory mounting
- Production-ready

#### OpenCode: Direct Shell

```bash
# Direct shell command execution
bash("npm install")
bash("python script.py")
```

**Security:** MEDIUM

- Runs on host system
- Full filesystem access
- Use with caution

---

### 3. RAG (Retrieval-Augmented Generation)

#### Qwen-Agent: Built-in

```python
# Two RAG strategies:
# 1. Fast RAG (efficient)
# 2. Parallel Doc QA (comprehensive)

bot = Assistant(
    llm=llm_cfg,
    files=['./docs/'],  # Automatic RAG
    rag_options={'strategy': 'fast'}
)

# Handles 1M+ token contexts
# Outperforms native long-context models
```

**Capacity:** 1M+ tokens
**Strategies:** Fast RAG, Parallel QA

#### OpenCode: External (Graphiti)

```yaml
# Memory via Graphiti MCP
tools:
  - mcp__graphiti-memory__search_nodes
  - mcp__graphiti-memory__add_episode
```

**Capacity:** Depends on implementation
**Integration:** Requires MCP setup

---

### 4. Multi-Agent Orchestration

#### Qwen-Agent: Single-Agent Focus

```python
# Primarily single-agent with tool delegation
bot = Assistant(llm=llm_cfg, function_list=tools)

# Can nest agents but not primary pattern
```

**Pattern:** Tool-based delegation
**Complexity:** Low to Medium

#### OpenCode: Multi-Agent Native

```yaml
# Explicit multi-agent handoffs
will:
  routes_to:
    - oracle: ["debug", "review"]
    - hephaestus: ["build", "implement"]
    - librarian: ["research"]

oracle:
  can_handoff_to:
    - hephaestus: "Implementation needed"
```

**Pattern:** Agent-to-agent handoffs
**Complexity:** High (but powerful)

---

### 5. Model Support

#### Qwen-Agent

```yaml
primary_models:
  - qwen-max-latest (DashScope API)
  - qwen3-32b
  - qwen3-coder
  - qwq-32b (reasoning)

local_support:
  - vLLM (OpenAI-compatible)
  - Ollama
  - Any OpenAI-compatible API
```

**Optimized for:** Qwen models
**Local:** Via OpenAI-compatible API

#### OpenCode

```yaml
models:
  primary: zai-glm/glm-5
  fallback: kimi-nvidia/moonshotai/kimi-k2.5
  local: local-qwen/qwen35-35b

vision: kimi-nvidia/moonshotai/kimi-k2.5
fast: zai-glm/glm-4.7
```

**Optimized for:** Any model
**Flexibility:** Maximum

---

### 6. Browser Integration

#### Qwen-Agent: BrowserQwen

- Chrome extension available
- Browser-native agent workflows
- Read webpages, summarize, act

#### OpenCode: CLI + DevTools

- Chrome DevTools Protocol
- `agent-browser` CLI tool
- `pinchtab` for multi-account

---

## Use Case Recommendations

### Choose Qwen-Agent If:

1. **Using Qwen models primarily** - Native optimization
2. **Need secure code execution** - Docker sandbox built-in
3. **Building RAG applications** - 1M token support out of box
4. **Want Chrome extension** - BrowserQwen available
5. **Building production apps** - Battle-tested (powers Qwen Chat)
6. **Need MCP quickly** - Native support

### Choose OpenCode/oh-my-opencode If:

1. **Multi-model workflow** - GLM-5 + Kimi K2.5 mixing
2. **Complex agent orchestration** - Discipline agents with handoffs
3. **Local-first development** - Works with local Qwen via llama.cpp
4. **TUI workflow preferred** - Terminal-based interaction
5. **Maximum flexibility** - Any model, any tool
6. **Research/experimental** - Easy to customize agents

---

## Integration Possibilities

### Hybrid Approach

You could use **both** frameworks:

```python
# Use Qwen-Agent for:
# - RAG-heavy tasks (1M token docs)
# - Secure code execution (Docker)
# - Browser extension features

# Use OpenCode for:
# - Multi-agent orchestration
# - Mixed model workflows (GLM-5 + Kimi)
# - Local Qwen with llama.cpp
```

### Example: Qwen-Agent as Tool in OpenCode

```yaml
# In OpenCode AGENTS.md
librarian:
  tools:
    - qwen_agent_rag # Use Qwen-Agent RAG for docs
    - qwen_agent_code # Use Qwen-Agent code interpreter
```

---

## Performance Considerations

### Qwen-Agent

- **Latency:** Lower with Qwen models (native optimization)
- **Memory:** Efficient with built-in RAG
- **Scaling:** Designed for production (Qwen Chat backend)

### OpenCode

- **Latency:** Depends on model chosen
- **Memory:** External (Graphiti)
- **Scaling:** Depends on implementation

---

## Quick Start Comparison

### Qwen-Agent Setup

```bash
pip install -U "qwen-agent[gui,rag,code_interpreter,mcp]"
export DASHSCOPE_API_KEY=your_key

python -c "
from qwen_agent.agents import Assistant
bot = Assistant(llm={'model': 'qwen-max'}, function_list=['code_interpreter'])
for r in bot.run([{'role': 'user', 'content': 'Hello'}]):
    print(r)
"
```

### OpenCode Setup

```bash
# Already installed
opencode  # Launch TUI

# Or use Kilo in project
# AGENTS.md defines agent behavior
```

---

## Verdict

| Your Priority                  | Recommendation    |
| ------------------------------ | ----------------- |
| **Qwen model ecosystem**       | Qwen-Agent        |
| **Multi-model flexibility**    | OpenCode          |
| **Secure code execution**      | Qwen-Agent        |
| **Multi-agent orchestration**  | OpenCode          |
| **Local Qwen (llama.cpp)**     | OpenCode (easier) |
| **Production RAG app**         | Qwen-Agent        |
| **Research/experimental**      | OpenCode          |
| **Chrome browser integration** | Qwen-Agent        |

### For Your Setup (Local Qwen3.5-35B + RTX 5080)

**Recommendation:** Keep **OpenCode** as primary, consider **Qwen-Agent** for:

1. RAG-heavy document processing (1M tokens)
2. Secure code execution when needed
3. Chrome extension for web workflows

Your current stack (OpenCode + local Qwen + GLM-5 fallback) is well-suited for local development with maximum flexibility.
