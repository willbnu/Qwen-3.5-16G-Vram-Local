# Security Policy

## Supported Versions

This repository follows semantic versioning. Security updates are provided for the current major version.

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.4.x   | :white_check_mark: | Current        |
| 1.3.x   | :white_check_mark: | 2026-06-01     |
| < 1.3   | :x:                | Ended          |

## Reporting a Vulnerability

### For This Repository

If you discover a security vulnerability in this repository's code or configuration:

1. **Do not** open a public issue
2. Email the maintainer with details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Timeline:**

| Stage | Target Time |
| ----- | ----------- |
| Acknowledgment | 48 hours |
| Initial Assessment | 5 business days |
| Fix Development | 14 business days (critical) / 30 days (moderate) |
| Disclosure | After fix is released |

### For External Dependencies

This project depends on external tools. Report vulnerabilities to:

| Component | Report To |
| --------- | --------- |
| llama.cpp | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp/security) |
| Qwen models | [QwenLM/Qwen](https://github.com/QwenLM/Qwen) |
| Python packages | [PyPI Security](https://pypi.org/security/) |
| npm packages | [npm Security](https://www.npmjs.com/security) |

## Security Best Practices

### Server Configuration

When running local LLM servers:

```bash
# GOOD: Bind to localhost only
--host 127.0.0.1 --port 8002

# BAD: Exposes to all network interfaces
--host 0.0.0.0
```

### Network Security

- **Bind to `127.0.0.1`** (localhost) only — never expose LLM servers to public networks
- **Use a firewall** if you must expose to a local network (e.g., `ufw allow from 192.168.1.0/24 to any port 8002`)
- **Consider a reverse proxy** with authentication for network access (nginx, Caddy)

### Model Security

- **Download models only from trusted sources** — official HuggingFace repos
- **Verify file checksums** when available
- **Be cautious with untrusted model files** — they can contain malicious pickles

### Credential Management

- **Never commit** API keys, tokens, or credentials to the repository
- **Use environment variables** for sensitive configuration
- **Check `.gitignore`** includes common credential files:

```gitignore
.env
.env.local
*.pem
*.key
credentials.json
```

## Scope

**In Scope:**
- Python benchmark scripts (`tests/`, `qwen_api.py`, `server_manager.py`)
- Dashboard code (`dashboard/`)
- Configuration files (`config/`)
- Documentation

**Out of Scope:**
- llama.cpp vulnerabilities (report upstream)
- Model behavior/biases (not a security issue)
- Third-party npm/PyPI packages (report to maintainers)

## Security Headers (Dashboard)

If deploying the dashboard to production, ensure these headers:

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

## Changelog

| Date | Change |
| ---- | ------ |
| 2026-03-06 | Added comprehensive policy with version support table |
