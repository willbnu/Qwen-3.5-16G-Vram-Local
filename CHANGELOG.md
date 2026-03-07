# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-03-07

### Changed

- Tightened the public docs so the README and benchmark narrative stay aligned with the checked-in JSON artifacts.
- Made the shipped 16GB profiles single-server presets to match the actual VRAM constraint and the documented launch model.
- Reorganized root-level helper clutter by moving legacy Windows scripts under `scripts/windows/` and ad-hoc manual vision checks under `tests/manual/`.
- Refreshed README presentation with a more engaging intro and lighter visual accents without widening benchmark claims.

### Fixed

- Resolved config path handling so model and mmproj paths honor `config/servers.yaml` and resolve from the repo root.
- Updated the Python helper defaults to use the repo's recommended 35B quant instead of a larger stale preset.
- Aligned the Windows launchers with the config-driven presets instead of stale hardcoded values.
- Fixed the moved PowerShell benchmark helper so it still resolves the repo root correctly and parses arguments cleanly.

### Added

- Added regression coverage for the 16GB single-server profile rule and the Python helper model defaults.
- Added better GitHub repo scaffolding for releases and contribution flow.

## [1.5.0] - 2026-03-06

### Changed

- Added `--mmproj-offload`, batch-size controls, and fit-target support to the launcher/config flow.
- Expanded server configuration coverage with an extra `mega_context` server entry.

### Fixed

- Corrected tests to match the expanded server list.

## [1.4.0] - 2026-03-05

### Changed

- Documented the `--parallel 1` requirement for the 35B-A3B preset and updated the repo to use it consistently.
- Refined the RTX 5080 / 5090 native build notes to reflect measured gains instead of inflated estimates.

### Fixed

- Corrected the root cause narrative around the 35B slowdown and clarified the role of JIT warmup versus runtime configuration.

## [1.3.0] - 2026-03-04

### Changed

- Reduced repo clutter by moving older scripts, docs, and benchmark artifacts into archive folders.
- Locked in the 9B 256K-context configuration and documented the KV cache tradeoffs.

## [1.2.0] - 2026-03-04

### Added

- Added the heretic-v1 model notes and related KV cache analysis docs.
- Documented external research findings for RTX-STone, FlashMLA, and PyTorch SM120 support.

## [1.1.0] - 2026-03-04

### Added

- Added 35B-A3B vision support investigation and initial multimodal tooling.
- Added KV cache optimization notes and the first performance matrix docs.

## [1.0.0] - 2026-03-04

### Added

- Initial public release with llama.cpp-based local server setup, benchmark helpers, and API tooling for Qwen3.5 models on 16GB GPUs.
