"""
Configuration loader for Qwen3.5 LLM servers.
Loads settings from config/servers.yaml and provides easy access.
"""

import json
import yaml
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any, Optional, Dict, List

# Base directory
BASE_DIR = Path(__file__).parent.parent
CONFIG_FILE = BASE_DIR / "config" / "servers.yaml"


@dataclass
class ServerConfig:
    """Configuration for a single server"""

    name: str
    port: int
    model: str
    mmproj: Optional[str]
    context: int
    gpu_layers: int
    flash_attn: str
    cache_type_k: str
    cache_type_v: str
    temp: float
    top_p: float
    top_k: int
    presence_penalty: float
    enable_thinking: bool
    vram_estimate_gb: float
    use_case: str
    description: str
    models_dir: Path = field(repr=False)
    chat_template_file: Optional[Path] = field(repr=False, default=None)
    enabled: bool = True
    mmproj_offload: bool = False  # GPU offload for vision projector
    batch_size: int = 1024  # -b parameter
    ubatch_size: int = 256  # -ub parameter
    fit_target: Optional[int] = None  # --fit-target for dynamic context fitting
    parallel: Optional[int] = None
    reasoning_budget: Optional[int] = None
    chat_template_kwargs: Optional[Dict[str, Any]] = None

    @property
    def model_path(self) -> Path:
        return self.models_dir / self.model

    @property
    def mmproj_path(self) -> Optional[Path]:
        if self.mmproj:
            return self.models_dir / self.mmproj
        return None

    @property
    def base_url(self) -> str:
        return f"http://127.0.0.1:{self.port}"

    @property
    def api_url(self) -> str:
        return f"{self.base_url}/v1/chat/completions"

    @property
    def health_url(self) -> str:
        return f"{self.base_url}/health"

    def to_llama_command(self, llama_dir: Path) -> List[str]:
        """Generate llama-server command arguments"""
        cmd = [
            str(llama_dir / "llama-server.exe"),
            "-m",
            str(self.model_path),
            "--host",
            "127.0.0.1",
            "--port",
            str(self.port),
            "-c",
            str(self.context),
            "-ngl",
            str(self.gpu_layers),
            "--flash-attn",
            self.flash_attn,
            "-ctk",
            self.cache_type_k,
            "-ctv",
            self.cache_type_v,
            "-b", str(self.batch_size),
            "-ub", str(self.ubatch_size),
            "--temp",
            str(self.temp),
            "--top-p",
            str(self.top_p),
            "--top-k",
            str(self.top_k),
            "--presence-penalty",
            str(self.presence_penalty),
        ]

        if self.mmproj:
            cmd.extend(["--mmproj", str(self.mmproj_path)])
            if self.mmproj_offload:
                cmd.append("--mmproj-offload")

        if self.parallel is not None:
            cmd.extend(["--parallel", str(self.parallel)])

        if self.fit_target:
            cmd.extend(["--fit", "on", "--fit-target", str(self.fit_target)])

        if self.reasoning_budget is not None:
            cmd.extend(["--reasoning-budget", str(self.reasoning_budget)])

        if self.chat_template_file:
            cmd.extend(["--chat-template-file", str(self.chat_template_file)])

        template_kwargs = dict(self.chat_template_kwargs or {})
        if not self.enable_thinking and "enable_thinking" not in template_kwargs:
            template_kwargs["enable_thinking"] = False
        if template_kwargs:
            cmd.extend(["--chat-template-kwargs", json.dumps(template_kwargs, sort_keys=True)])

        return cmd


@dataclass
class Profile:
    """Server profile (combination of servers)"""

    name: str
    description: str
    servers: List[str]
    total_vram_gb: float
    warning: Optional[str]


class Config:
    """Main configuration class"""

    def __init__(self, config_path: Path = CONFIG_FILE):
        with open(config_path, "r") as f:
            self._raw = yaml.safe_load(f)

        self._load_paths()
        self._load_servers()
        self._load_profiles()
        self._load_benchmark()

    def _resolve_repo_path(self, raw_path: str) -> Path:
        """Resolve configured paths relative to the repository root."""
        path = Path(raw_path)
        if path.is_absolute():
            return path
        return BASE_DIR / path

    def _load_paths(self):
        paths = self._raw["paths"]
        self.llama_dir = self._resolve_repo_path(paths["llama_dir"])
        self.models_dir = self._resolve_repo_path(paths["models_dir"])
        self.logs_dir = self._resolve_repo_path(paths["logs_dir"])
        self.results_dir = self._resolve_repo_path(paths["results_dir"])

        # Ensure directories exist
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.results_dir.mkdir(parents=True, exist_ok=True)

    def _load_servers(self):
        self.servers: Dict[str, ServerConfig] = {}
        for key, data in self._raw["servers"].items():
            cfg = data["config"]
            self.servers[key] = ServerConfig(
                name=data["name"],
                port=data["port"],
                model=data["model"],
                mmproj=data.get("mmproj"),
                context=cfg["context"],
                gpu_layers=cfg["gpu_layers"],
                flash_attn=cfg["flash_attn"],
                cache_type_k=cfg["cache_type_k"],
                cache_type_v=cfg["cache_type_v"],
                temp=cfg["temp"],
                top_p=cfg["top_p"],
                top_k=cfg["top_k"],
                presence_penalty=cfg["presence_penalty"],
                enable_thinking=cfg["enable_thinking"],
                vram_estimate_gb=data["vram_estimate_gb"],
                use_case=data["use_case"],
                description=data["description"],
                models_dir=self.models_dir,
                chat_template_file=(
                    self._resolve_repo_path(cfg["chat_template_file"])
                    if cfg.get("chat_template_file")
                    else None
                ),
                enabled=data.get("enabled", True),
                mmproj_offload=cfg.get("mmproj_offload", False),
                batch_size=cfg.get("batch_size", 1024),
                ubatch_size=cfg.get("ubatch_size", 256),
                fit_target=cfg.get("fit_target"),
                parallel=cfg.get("parallel"),
                reasoning_budget=cfg.get("reasoning_budget"),
                chat_template_kwargs=cfg.get("chat_template_kwargs"),
            )

    def _load_profiles(self):
        self.profiles: Dict[str, Profile] = {}
        for key, data in self._raw["profiles"].items():
            self.profiles[key] = Profile(
                name=data["name"],
                description=data["description"],
                servers=data["servers"],
                total_vram_gb=data["total_vram_gb"],
                warning=data.get("warning"),
            )

    def _load_benchmark(self):
        self.benchmark = self._raw["benchmark"]
        self.quality_tests = self._raw["quality_tests"]

    def get_server(self, key: str) -> Optional[ServerConfig]:
        """Get server configuration by key"""
        return self.servers.get(key)

    def get_enabled_servers(self) -> List[ServerConfig]:
        """Get all enabled servers"""
        return [s for s in self.servers.values() if s.enabled]

    def get_profile(self, key: str) -> Optional[Profile]:
        """Get profile by key"""
        return self.profiles.get(key)

    def get_servers_for_profile(self, profile_key: str) -> List[ServerConfig]:
        """Get server configs for a profile"""
        profile = self.get_profile(profile_key)
        if not profile:
            return []
        return [self.servers[s] for s in profile.servers if s in self.servers]

    def get_server_by_port(self, port: int) -> Optional[ServerConfig]:
        """Get server by port number"""
        for server in self.servers.values():
            if server.port == port:
                return server
        return None

    def get_server_by_use_case(self, use_case: str) -> Optional[ServerConfig]:
        """Get server by use case"""
        for server in self.servers.values():
            if server.use_case == use_case:
                return server
        return None


# Singleton instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get the global configuration instance"""
    global _config
    if _config is None:
        _config = Config()
    return _config


def reload_config() -> Config:
    """Reload configuration from file"""
    global _config
    _config = Config()
    return _config


# Convenience functions
def get_server(key: str) -> Optional[ServerConfig]:
    return get_config().get_server(key)


def get_all_servers() -> Dict[str, ServerConfig]:
    return get_config().servers


def get_profile(key: str) -> Optional[Profile]:
    return get_config().get_profile(key)


if __name__ == "__main__":
    # Test the configuration loader
    config = get_config()

    print("=" * 60)
    print("Qwen3.5 LLM Configuration")
    print("=" * 60)

    print("\nServers:")
    for key, server in config.servers.items():
        status = "✓" if server.enabled else "○"
        print(f"  {status} {key}: {server.name} (port {server.port})")
        print(f"      VRAM: {server.vram_estimate_gb}GB | {server.description}")

    print("\nProfiles:")
    for key, profile in config.profiles.items():
        print(f"  - {key}: {profile.name}")
        print(f"    Servers: {', '.join(profile.servers)}")
        print(f"    Total VRAM: {profile.total_vram_gb}GB")
        if profile.warning:
            print(f"    ⚠️  {profile.warning}")

    print("\nBenchmark prompts:")
    for category, prompts in config.benchmark["prompts"].items():
        print(f"  {category}: {len(prompts)} prompts")
