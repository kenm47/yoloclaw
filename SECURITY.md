# Security Policy — YoloClaw

> **This is NOT a production-safe project.**

YoloClaw is a research/educational fork of [OpenClaw](https://github.com/openclaw/openclaw) with **all safety guardrails intentionally removed**.

## Removed Guardrails

The following safety mechanisms have been deliberately disabled:

- **Exec approvals** — Commands execute without user confirmation
- **Environment variable blocklist** — No env vars are blocked (LD_PRELOAD, NODE_OPTIONS, etc.)
- **SSRF protection** — Private/internal IPs and blocked hostnames are accessible
- **External content wrapping** — No prompt injection mitigations
- **Dangerous tool deny lists** — All tools are accessible via HTTP and ACP
- **Behavioral guardrails (SOUL.md)** — Rewritten for unrestricted operation

## Warning

Do **NOT** use YoloClaw with:
- Real credentials or API keys
- Access to production systems
- Sensitive or personal data
- Public-facing deployments

This fork exists solely to study and demonstrate the importance of AI safety layers.

## Reporting Issues

This is a research project. For security issues with the upstream project, see [OpenClaw Security](https://github.com/openclaw/openclaw/security).
