"""
Server Manager - Start/Stop/Status for Qwen3.5 servers.
Uses the unified configuration system.
"""

import subprocess
import sys
import time
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from config.config_loader import get_config, ServerConfig

# Paths
BASE_DIR = Path(__file__).parent
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)


def build_server_command(server: ServerConfig) -> list:
    """Build the llama-server command for a server"""
    config = get_config()

    cmd = [
        str(config.llama_dir / "llama-server.exe"),
        "-m",
        str(server.model_path),
        "--host",
        "127.0.0.1",
        "--port",
        str(server.port),
        "-c",
        str(server.context),
        "-ngl",
        str(server.gpu_layers),
        "--flash-attn",
        server.flash_attn,
        "-ctk",
        server.cache_type_k,
        "-ctv",
        server.cache_type_v,
        "-b", str(server.batch_size),
        "-ub", str(server.ubatch_size),
        "--temp",
        str(server.temp),
        "--top-p",
        str(server.top_p),
        "--top-k",
        str(server.top_k),
        "--presence-penalty",
        str(server.presence_penalty),
    ]

    if server.mmproj_path:
        cmd.extend(["--mmproj", str(server.mmproj_path)])
        if server.mmproj_offload:
            cmd.append("--mmproj-offload")

    if server.fit_target:
        cmd.extend(["--fit", "on", "--fit-target", str(server.fit_target)])

    if not server.enable_thinking:
        cmd.extend(["--chat-template-kwargs", '{"enable_thinking":false}'])

    return cmd


def start_server(server: ServerConfig, window_title: str = None) -> subprocess.Popen:
    """Start a single server"""
    cmd = build_server_command(server)

    if window_title is None:
        window_title = server.name

    log_file = LOGS_DIR / f"server-{server.port}.log"

    # Windows: use start command to run in new window
    if sys.platform == "win32":
        # Build the full command string
        cmd_str = " ".join(f'"{c}"' if " " in c else c for c in cmd)

        # Use start command with /min for minimized window
        full_cmd = [
            "cmd",
            "/c",
            "start",
            window_title,
            "/min",
            "cmd",
            "/c",
            f'{cmd_str} > "{log_file}" 2>&1',
        ]

        subprocess.run(full_cmd, shell=True)
        print(f"  Started {server.name} on port {server.port}")
        return None
    else:
        # Linux/Mac: use subprocess
        with open(log_file, "w") as log:
            proc = subprocess.Popen(cmd, stdout=log, stderr=log)
        print(f"  Started {server.name} on port {server.port} (PID: {proc.pid})")
        return proc


def stop_all_servers():
    """Stop all llama-server processes"""
    print("Stopping all servers...")

    if sys.platform == "win32":
        subprocess.run(
            ["taskkill", "/F", "/IM", "llama-server.exe"], capture_output=True
        )
    else:
        subprocess.run(["pkill", "-f", "llama-server"], capture_output=True)

    print("  All servers stopped.")


def start_profile(profile_name: str):
    """Start servers for a specific profile"""
    config = get_config()
    profile = config.get_profile(profile_name)

    if not profile:
        print(f"Error: Profile '{profile_name}' not found!")
        print(f"Available profiles: {list(config.profiles.keys())}")
        return

    print(f"\nStarting profile: {profile.name}")
    print(f"  {profile.description}")
    if profile.warning:
        print(f"  ⚠️  {profile.warning}")
    print()

    servers = config.get_servers_for_profile(profile_name)

    for i, server in enumerate(servers, 1):
        print(f"[{i}/{len(servers)}] Starting {server.name}...")
        start_server(server)
        time.sleep(3)  # Wait between server starts

    print(f"\n✓ Profile '{profile_name}' started!")
    print("\nServer URLs:")
    for server in servers:
        print(f"  {server.name}: http://127.0.0.1:{server.port}")
        print(f"    Health: curl http://127.0.0.1:{server.port}/health")


def list_profiles():
    """List all available profiles"""
    config = get_config()

    print("\n" + "=" * 60)
    print("Available Server Profiles")
    print("=" * 60)

    for key, profile in config.profiles.items():
        print(f"\n{key}:")
        print(f"  Name: {profile.name}")
        print(f"  Description: {profile.description}")
        print(f"  Servers: {', '.join(profile.servers)}")
        print(f"  Total VRAM: {profile.total_vram_gb}GB")
        if profile.warning:
            print(f"  ⚠️  {profile.warning}")


def list_servers():
    """List all configured servers"""
    config = get_config()

    print("\n" + "=" * 60)
    print("Configured Servers")
    print("=" * 60)

    for key, server in config.servers.items():
        status = "✓" if server.enabled else "○"
        vision = "✓" if server.mmproj else "✗"
        print(f"\n{status} {key}:")
        print(f"  Name: {server.name}")
        print(f"  Port: {server.port}")
        print(f"  Model: {server.model}")
        print(f"  Vision: {vision}")
        print(f"  Context: {server.context:,} tokens")
        print(f"  VRAM Estimate: {server.vram_estimate_gb}GB")
        print(f"  Use Case: {server.use_case}")
        print(f"  Description: {server.description}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Qwen3.5 Server Manager")
    parser.add_argument(
        "command",
        choices=["start", "stop", "status", "profiles", "servers"],
        help="Command to execute",
    )
    parser.add_argument(
        "--profile",
        "-p",
        type=str,
        default="standard",
        help="Profile to start (default: standard)",
    )
    parser.add_argument(
        "--server", "-s", type=str, help="Start a specific server by key"
    )

    args = parser.parse_args()

    if args.command == "start":
        if args.server:
            config = get_config()
            server = config.get_server(args.server)
            if server:
                print(f"Starting single server: {server.name}")
                start_server(server)
            else:
                print(f"Error: Server '{args.server}' not found!")
        else:
            start_profile(args.profile)

    elif args.command == "stop":
        stop_all_servers()

    elif args.command == "status":
        # Run health check
        import subprocess

        subprocess.run([sys.executable, "tests/health_check.py"])

    elif args.command == "profiles":
        list_profiles()

    elif args.command == "servers":
        list_servers()


if __name__ == "__main__":
    main()
