"""Unit tests for config_loader module"""
import pytest
import yaml
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "config"))
from config_loader import BASE_DIR, CONFIG_FILE, Config, ServerConfig, Profile, get_config, reload_config


class TestServerConfig:
    def test_model_path_property(self):
        """Test model_path returns correct Path"""
        config = get_config()
        server = config.get_server("coding")
        assert server is not None
        assert isinstance(server.model_path, Path)
        assert server.model_path == config.models_dir / server.model

    def test_base_url_format(self):
        """Test base_url is correctly formatted"""
        config = get_config()
        server = config.get_server("coding")
        assert server is not None
        assert server.base_url.startswith("http://")
        assert ":8002" in server.base_url

    def test_api_url_format(self):
        """Test api_url includes /v1/chat/completions"""
        config = get_config()
        server = config.get_server("coding")
        assert server is not None
        assert server.api_url.endswith("/v1/chat/completions")
        assert server.base_url in server.api_url

    def test_health_url_format(self):
        """Test health_url includes /health endpoint"""
        config = get_config()
        server = config.get_server("coding")
        assert server is not None
        assert "/health" in server.health_url

    def test_mmproj_path_can_be_none(self):
        """Test mmproj_path can be None for non-vision servers"""
        config = get_config()
        server = config.get_server("coding")
        assert server is not None
        assert server.mmproj_path is None or isinstance(server.mmproj_path, Path)

    def test_mmproj_path_uses_configured_models_dir(self):
        """Test mmproj_path uses the configured models_dir"""
        config = get_config()
        server = config.get_server("fast_vision")
        assert server is not None
        assert server.mmproj_path == config.models_dir / server.mmproj

    def test_to_llama_command_includes_recent_server_flags(self):
        """Test newer llama.cpp tuning flags are included in command generation"""
        config = get_config()
        server = config.get_server("fast_vision")
        assert server is not None

        cmd = server.to_llama_command(config.llama_dir)

        assert "--mmproj-offload" in cmd
        assert "-b" in cmd and str(server.batch_size) in cmd
        assert "-ub" in cmd and str(server.ubatch_size) in cmd
        assert "--fit-target" in cmd and str(server.fit_target) in cmd

    def test_to_llama_command_includes_parallel_and_reasoning_budget(self):
        """Test YAML tuning flags reach llama-server command generation."""
        config = get_config()
        server = config.get_server("coding")
        assert server is not None

        cmd = server.to_llama_command(config.llama_dir)

        assert "--parallel" in cmd and "1" in cmd
        assert "--reasoning-budget" in cmd and "0" in cmd

    def test_to_llama_command_supports_custom_chat_template_files(self):
        """Test experimental presets can point llama-server at a local template file."""
        config = get_config()
        server = config.get_server("quality_text_agent")
        assert server is not None

        cmd = server.to_llama_command(config.llama_dir)

        assert "--chat-template-file" in cmd
        assert str(server.chat_template_file) in cmd
        assert "--chat-template-kwargs" not in cmd


class TestConfig:
    def test_load_config(self):
        """Test config loads without error"""
        config = get_config()
        assert config is not None
        assert isinstance(config, Config)

    def test_relative_paths_are_resolved_from_repo_root(self, tmp_path):
        """Test relative paths in YAML resolve against the repo root instead of cwd"""
        raw = yaml.safe_load(CONFIG_FILE.read_text())
        raw["paths"] = {
            "llama_dir": "./custom-llama",
            "models_dir": "./custom-models",
            "logs_dir": "./custom-logs",
            "results_dir": "./custom-results",
        }

        config_path = tmp_path / "servers.yaml"
        config_path.write_text(yaml.safe_dump(raw), encoding="utf-8")

        config = Config(config_path)

        assert config.llama_dir == BASE_DIR / "custom-llama"
        assert config.models_dir == BASE_DIR / "custom-models"
        assert config.logs_dir == BASE_DIR / "custom-logs"
        assert config.results_dir == BASE_DIR / "custom-results"

    def test_servers_exist(self):
        """Test expected servers are loaded"""
        config = get_config()
        expected_servers = [
            "coding",
            "fast_vision",
            "quality_vision",
            "quality_text_agent",
            "qwopus_reasoning",
            "coding_vision",
            "uncensored",
        ]
        for server_name in expected_servers:
            server = config.get_server(server_name)
            assert server is not None, f"Server '{server_name}' not found"

    def test_server_ports(self):
        """Test server ports are correct"""
        config = get_config()
        port_mapping = {
            "coding": 8002,
            "fast_vision": 8003,
            "quality_vision": 8004,
            "quality_text_agent": 8008,
            "qwopus_reasoning": 8009,
            "coding_vision": 8005,
            "uncensored": 8006,
        }
        for server_name, expected_port in port_mapping.items():
            server = config.get_server(server_name)
            assert server is not None
            assert server.port == expected_port, f"{server_name} should have port {expected_port}"

    def test_get_server_by_port(self):
        """Test retrieving server by port number"""
        config = get_config()
        server = config.get_server_by_port(8002)
        assert server is not None

        server = config.get_server_by_port(8003)
        assert server is not None

    def test_get_server_by_port_invalid(self):
        """Test get_server_by_port returns None for invalid port"""
        config = get_config()
        server = config.get_server_by_port(9999)
        assert server is None

    def test_get_enabled_servers(self):
        """Test only enabled servers returned"""
        config = get_config()
        enabled = config.get_enabled_servers()
        assert len(enabled) == 3
        enabled_names = {s.use_case for s in enabled}
        assert "coding" in enabled_names
        assert "fast_vision" in enabled_names
        assert "quality" in enabled_names

    def test_profiles_exist(self):
        """Test expected profiles are loaded"""
        config = get_config()
        expected_profiles = ["standard", "speed", "minimal", "quality", "quality_agent", "qwopus", "uncensored"]
        for profile_name in expected_profiles:
            profile = config.get_profile(profile_name)
            assert profile is not None, f"Profile '{profile_name}' not found"

    def test_16gb_profiles_are_single_server_presets(self):
        """Test shipped profiles stay aligned with the one-server-at-a-time guidance."""
        config = get_config()
        for profile_name in ["standard", "speed", "minimal", "quality", "quality_agent", "qwopus", "uncensored"]:
            profile = config.get_profile(profile_name)
            assert profile is not None
            assert len(profile.servers) == 1, f"{profile_name} should map to one server"

    def test_get_servers_for_profile(self):
        """Test getting servers for a profile"""
        config = get_config()
        servers = config.get_servers_for_profile("standard")
        assert servers is not None
        assert len(servers) > 0
        for server in servers:
            assert isinstance(server, ServerConfig)

    def test_get_servers_for_profile_invalid(self):
        """Test get_servers_for_profile returns empty for invalid profile"""
        config = get_config()
        servers = config.get_servers_for_profile("nonexistent")
        assert servers == []

    def test_get_server_by_use_case(self):
        """Test retrieving server by use case"""
        config = get_config()
        server = config.get_server_by_use_case("coding")
        assert server is not None

    def test_get_server_by_use_case_invalid(self):
        """Test get_server_by_use_case returns None for invalid use case"""
        config = get_config()
        server = config.get_server_by_use_case("nonexistent_use_case")
        assert server is None

    def test_all_servers_have_required_properties(self):
        """Test all servers have required properties set"""
        config = get_config()
        servers = config.servers
        for key, server in servers.items():
            assert server.name is not None
            assert server.port is not None
            assert server.model_path is not None
            assert server.base_url is not None
            assert server.api_url is not None
            assert server.health_url is not None


class TestProfile:
    def test_profile_has_name(self):
        """Test profile has name property"""
        config = get_config()
        profile = config.get_profile("standard")
        assert profile is not None

    def test_profile_has_description(self):
        """Test profile has description"""
        config = get_config()
        profile = config.get_profile("standard")
        assert profile is not None
        assert profile.description is not None
        assert len(profile.description) > 0

    def test_profile_has_servers_list(self):
        """Test profile has servers list"""
        config = get_config()
        profile = config.get_profile("standard")
        assert profile is not None
        assert isinstance(profile.servers, list)

    def test_profile_has_total_vram_gb(self):
        """Test profile has total_vram_gb property"""
        config = get_config()
        profile = config.get_profile("standard")
        assert profile is not None
        assert profile.total_vram_gb is not None
        assert profile.total_vram_gb > 0

    def test_profile_warning_can_be_none(self):
        """Test profile warning can be None"""
        config = get_config()
        profile = config.get_profile("minimal")
        assert profile is not None
        assert profile.warning is None


class TestSingletonFunctions:
    def test_get_config_returns_singleton(self):
        """Test get_config returns same instance"""
        config1 = get_config()
        config2 = get_config()
        assert config1 is config2

    def test_reload_config_returns_new_instance(self):
        """Test reload_config returns fresh instance"""
        config1 = get_config()
        config2 = reload_config()
        config3 = get_config()
        assert config3 is config2

    def test_get_all_servers(self):
        """Test get_all_servers returns all servers"""
        from config_loader import get_all_servers
        servers = get_all_servers()
        assert len(servers) == 8

    def test_singleton_get_server(self):
        """Test module-level get_server function"""
        from config_loader import get_server as singleton_get_server
        server = singleton_get_server("coding")
        assert server is not None

    def test_singleton_get_profile(self):
        """Test module-level get_profile function"""
        from config_loader import get_profile as singleton_get_profile
        profile = singleton_get_profile("standard")
        assert profile is not None


class TestEdgeCases:
    def test_get_server_nonexistent(self):
        """Test get_server returns None for nonexistent server"""
        config = get_config()
        server = config.get_server("nonexistent_server")
        assert server is None

    def test_get_profile_nonexistent(self):
        """Test get_profile returns None for nonexistent profile"""
        config = get_config()
        profile = config.get_profile("nonexistent_profile")
        assert profile is None

    def test_server_config_url_consistency(self):
        """Test server URLs are consistent with port"""
        config = get_config()
        for key, server in config.servers.items():
            assert str(server.port) in server.base_url
            assert str(server.port) in server.api_url
            assert str(server.port) in server.health_url

    def test_profile_servers_are_valid(self):
        """Test all servers in profiles exist"""
        config = get_config()
        for profile_key in ["standard", "speed", "minimal", "quality", "quality_agent", "qwopus", "uncensored"]:
            profile = config.get_profile(profile_key)
            assert profile is not None
            for server_key in profile.servers:
                assert config.get_server(server_key) is not None
