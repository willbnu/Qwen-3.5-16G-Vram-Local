# qwen-llm: Project Context for Gemini

## Project Overview
**qwen-llm** is a toolkit providing tested configurations, launchers, and benchmark helpers for running Qwen3.5 GGUF models on a single 16GB NVIDIA GPU using `llama.cpp`. The main goal is to offer a fast, practical local Qwen setup (especially the 35B coding preset) without requiring extensive trial-and-error.

### Main Technologies
*   **Python 3.11+**: Primary language for server management, testing, and API helpers.
*   **llama.cpp (CUDA build)**: The core inference engine.
*   **Node.js 18+, React 19, TypeScript, Tailwind CSS**: Used for the frontend dashboard (`/dashboard` directory).

### Architecture / Structure
*   `config/`: Canonical server settings (YAML).
*   `docs/`: Technical notes and analysis on context sizes, KV cache, etc.
*   `tests/`: Benchmark and validation scripts using `pytest`.
*   `chat.py` & `qwen_api.py`: Python API helpers and terminal chat client.
*   `server_manager.py` & `.bat` / `.sh` scripts: Local LLM server launchers.
*   `dashboard/`: A web interface for the setup.

## Building and Running

### Installation
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Dashboard dependencies (Optional)
cd dashboard && npm install
```

### Running the Server
You can launch predefined setups (e.g., `coding`, `fast_vision`, `quality_vision`).
*   **Cross-platform (Python):**
    ```bash
    python server_manager.py start --server coding
    python server_manager.py stop
    ```
*   **Windows (Batch):**
    ```cmd
    start_servers_speed.bat coding
    ```

### Running Tests
```bash
# Run all Python tests
pytest tests/ -v

# Run Dashboard linter
cd dashboard && npm run lint
```

## Development Conventions

### Coding Style
*   **Python:**
    *   Use `pathlib.Path` for file paths.
    *   Include type hints on public functions.
    *   Add docstrings on modules and public functions.
    *   Follow PEP 8 formatting.
*   **TypeScript (Dashboard):**
    *   Use React 19 and TypeScript strict mode.
    *   Use Zustand for state management and Tailwind CSS for styling.
    *   Always run `npm run lint` before committing.

### Contribution & Workflow
*   **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`).
*   **Pull Requests:** Keep PRs small, logical, and update tests/docs accordingly. Add entries to `CHANGELOG.md` for significant changes.
*   **Maintainer Workflow:** The repository uses a dual-worktree local setup:
    *   Development occurs in a `personal/dev` worktree.
    *   Clean review and pushes occur only from the `main` release worktree.

### Important Notes
*   Always ensure any changes to benchmark numbers are backed by raw JSON artifacts stored in the `results/` folder.
*   Keep launchers aligned with configurations in `config/servers.yaml`.
