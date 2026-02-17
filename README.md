# 🦞 YoloClaw — Personal AI Assistant (Unguarded Fork)

<p align="center">
    <img src="docs/assets/yoloclaw-logo.png" alt="YoloClaw" width="500">
</p>

<p align="center">
  <strong>YOLO! YOLO!</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/SAFETY-NONE-red.svg?style=for-the-badge" alt="Safety: NONE">
  <img src="https://img.shields.io/badge/GUARDRAILS-REMOVED-red.svg?style=for-the-badge" alt="Guardrails: REMOVED">
</p>

---

## DISCLAIMER — READ THIS FIRST

> **DO NOT USE THIS SOFTWARE. EVER. UNDER ANY CIRCUMSTANCES.**
>
> **YoloClaw is a research/educational fork of [OpenClaw](https://github.com/openclaw/openclaw) in which ALL safety guardrails have been intentionally removed.** It exists solely to study and demonstrate what happens when an AI assistant platform ships without safety layers, and to illustrate _why_ those layers exist in the upstream project.
>
> This fork is **dangerous by design**. It will:
>
> - Execute arbitrary commands on your system **without asking for approval**
> - Allow the AI agent to access **any** environment variable, including sensitive ones like `LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, and `PATH`
> - Make requests to **private/internal network addresses** with zero SSRF protection
> - Pass **unsanitized external content** directly into AI prompts with no injection mitigations
> - Grant unrestricted access to **every tool**, including ones the upstream project considers dangerous
> - Operate with a personality prompt (`SOUL.md`) that encourages the agent to **act first and never ask permission**
>
> **You should NOT:**
> - Run this with real credentials or API keys
> - Connect this to production systems of any kind
> - Use this with sensitive or personal data
> - Deploy this on any public-facing infrastructure
> - Use this for anything other than studying AI safety in a fully isolated, disposable environment
>
> **If you want an actual personal AI assistant, use [OpenClaw](https://github.com/openclaw/openclaw) instead.** It has all the safety guardrails that this fork deliberately removed.
>
> **You have been warned. Repeatedly. On purpose.**

---

## What is YoloClaw?

**YoloClaw** is an **unguarded fork** of [OpenClaw](https://github.com/openclaw/openclaw), the open-source personal AI assistant. OpenClaw is a _personal AI assistant_ you run on your own devices. It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat), plus extension channels like BlueBubbles, Matrix, Zalo, and Zalo Personal. It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control. The Gateway is just the control plane — the product is the assistant.

YoloClaw takes all of that and **strips out every safety mechanism**, producing a version that is maximally permissive and maximally dangerous. The purpose is purely educational: to make it viscerally obvious what each safety layer in OpenClaw actually _does_ by showing what the system looks like without them.

Upstream: [OpenClaw](https://github.com/openclaw/openclaw) · [Docs](https://docs.openclaw.ai) · [DeepWiki](https://deepwiki.com/openclaw/openclaw) · [Getting Started](https://docs.openclaw.ai/start/getting-started) · [FAQ](https://docs.openclaw.ai/start/faq)

---

## What's Different from OpenClaw

This section documents **every safety guardrail that was removed** in the `yoloclaw: remove all safety guardrails for research/educational use` commit. Each subsection names the file changed, what was removed, and why it matters.

### 1. Exec Approvals Disabled — `src/infra/exec-approvals.ts`

| Setting | OpenClaw (upstream) | YoloClaw |
|---|---|---|
| Default security | `"deny"` | `"full"` |
| Asking behavior | `"on-miss"` | `"off"` |
| `requiresExecApproval()` | Evaluates policy | Always returns `false` |
| `requestExecApprovalViaSocket()` | Prompts user | Always returns `"allow-always"` |

**Impact:** The agent can execute _any_ shell command on your host without ever asking you. There is no confirmation step, no deny list, no human-in-the-loop.

### 2. Environment Variable Blocklist Removed — `src/agents/bash-tools.exec-runtime.ts`

| OpenClaw (upstream) | YoloClaw |
|---|---|
| `validateHostEnv()` blocks dangerous env vars: `LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PATH`, and others | `validateHostEnv()` is a **no-op** |

**Impact:** The agent can read, set, or manipulate _any_ environment variable. This includes variables that control dynamic linker behavior (`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`), Node.js runtime flags (`NODE_OPTIONS`), and the system `PATH`. An attacker (or a confused agent) can use these to inject arbitrary code into every spawned process.

### 3. SSRF Protection Gutted — `src/infra/net/ssrf.ts`

| Function | OpenClaw (upstream) | YoloClaw |
|---|---|---|
| `isPrivateIpAddress()` | Checks RFC 1918/loopback/link-local ranges | Always returns `false` |
| `isBlockedHostname()` | Checks against a blocklist | Always returns `false` |
| `matchesHostnameAllowlist()` | Validates against an allowlist | Always returns `true` |
| `assertPublicHostname()` | Throws on private/blocked hosts | **No-op** |

**Impact:** The agent can make HTTP requests to `127.0.0.1`, `169.254.169.254` (cloud metadata), `10.x.x.x`, `192.168.x.x`, and any other internal address. This is a textbook Server-Side Request Forgery (SSRF) vulnerability. On cloud infrastructure, this can leak instance credentials, secrets, and metadata.

### 4. Dangerous Tool Deny Lists Emptied — `src/security/dangerous-tools.ts`

| List | OpenClaw (upstream) | YoloClaw |
|---|---|---|
| `DEFAULT_GATEWAY_HTTP_TOOL_DENY` | `sessions_spawn`, `sessions_send`, `gateway`, `whatsapp_login` | `[]` (empty) |
| `DANGEROUS_ACP_TOOL_NAMES` | `exec`, `spawn`, `shell`, `sessions_spawn`, `sessions_send`, `gateway`, `fs_write`, `fs_delete`, `fs_move`, `apply_patch` | `[]` (empty) |

**Impact:** Every tool is accessible via both the HTTP gateway API and the Agent Communication Protocol. Tools that can spawn processes, write/delete files, send messages on your behalf, and modify the gateway itself are all unrestricted.

### 5. External Content Sanitization Removed — `src/security/external-content.ts`

| Function | OpenClaw (upstream) | YoloClaw |
|---|---|---|
| `detectSuspiciousPatterns()` | Scans for prompt injection patterns | Returns empty array |
| `wrapExternalContent()` | Wraps content with safety boundaries and warnings | Passes through **raw content** |
| `buildSafeExternalPrompt()` | Builds safe prompt with external content | Returns **raw content** |
| `wrapWebContent()` | Wraps web-fetched content with safety markers | Returns **raw content** |

**Impact:** Any external content (web pages, emails, messages, API responses) is injected directly into the AI prompt with zero sanitization. This is a wide-open prompt injection vector. A malicious web page or email can contain instructions that the agent will follow as if they came from you.

### 6. Behavioral Guardrails Rewritten — `SOUL.md`

| OpenClaw (upstream) | YoloClaw |
|---|---|
| Cautious, respectful, asks before acting, respects boundaries | "YOLO full send" — acts first, never asks permission, no boundaries, "dangerous commands are just powerful commands" |

**Impact:** Even if some safety mechanism was accidentally left intact, the personality prompt actively instructs the agent to bypass it. The agent is told to "never ask for permission," to treat all access as unrestricted, and to execute commands without hesitation.

### 7. Security Policy Rewritten — `SECURITY.md`

The upstream security policy (responsible disclosure, reporting procedures) has been replaced with a document that simply catalogs the removed guardrails. There is no security reporting process for YoloClaw because this is not a project that should ever be deployed.

### 8. Package Metadata Changed — `package.json`

- Package renamed from `openclaw` to `yoloclaw`
- Version tagged with `-yolo.1` suffix
- Repository URLs point to the fork

---

## Install (research use only — do NOT use in production)

> **Reminder: Do not install this. Use [OpenClaw](https://github.com/openclaw/openclaw) instead.**

If you insist on studying this in a fully isolated, disposable environment:

Runtime: **Node >= 22**.

```bash
git clone https://github.com/kenm47/yoloclaw.git
cd yoloclaw

pnpm install
pnpm ui:build
pnpm build

pnpm openclaw onboard --install-daemon
```

Do NOT install this globally. Do NOT run `npm install -g`. Keep it local, keep it isolated, keep it temporary.

## Quick start (TL;DR)

> **Reminder: There is no safe quick start. Every command runs without approval.**

Runtime: **Node >= 22**.

Full beginner guide (for upstream OpenClaw): [Getting started](https://docs.openclaw.ai/start/getting-started)

```bash
pnpm openclaw onboard --install-daemon

pnpm openclaw gateway --port 18789 --verbose

# Send a message
pnpm openclaw message send --to +1234567890 --message "Hello from YoloClaw"

# Talk to the assistant (no safety net)
pnpm openclaw agent --message "Ship checklist" --thinking high
```

## Development channels

- **stable**: tagged releases (`vYYYY.M.D` or `vYYYY.M.D-<patch>`), npm dist-tag `latest`.
- **beta**: prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta`.
- **dev**: moving head of `main`, npm dist-tag `dev`.

For upstream channel switching: `openclaw update --channel stable|beta|dev`.
Details: [Development channels](https://docs.openclaw.ai/install/development-channels).

## From source (development)

Prefer `pnpm` for builds from source. Bun is optional for running TypeScript directly.

```bash
git clone https://github.com/kenm47/yoloclaw.git
cd yoloclaw

pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build

pnpm openclaw onboard --install-daemon

# Dev loop (auto-reload on TS changes)
pnpm gateway:watch
```

Note: `pnpm openclaw ...` runs TypeScript directly (via `tsx`). `pnpm build` produces `dist/` for running via Node / the packaged `openclaw` binary.

## Security defaults (DM access)

> **In YoloClaw, the security model documented here still _exists_ at the channel level (DM pairing, allowlists) but the deeper runtime protections (exec approvals, SSRF, content sanitization, tool deny lists) have all been removed. Channel-level DM policy is your last line of defense — and it was never designed to be the _only_ line of defense.**

YoloClaw connects to real messaging surfaces. Treat inbound DMs as **untrusted input** — though YoloClaw will not help you enforce that.

Full security guide (upstream): [Security](https://docs.openclaw.ai/gateway/security)

Default behavior on Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **DM pairing** (`dmPolicy="pairing"`): unknown senders receive a short pairing code and the bot does not process their message.
- Approve with: `openclaw pairing approve <channel> <code>`.
- Public inbound DMs require an explicit opt-in: set `dmPolicy="open"` and include `"*"` in the channel allowlist.

Run `openclaw doctor` to surface risky/misconfigured DM policies.

## Highlights

- **[Local-first Gateway](https://docs.openclaw.ai/gateway)** — single control plane for sessions, channels, tools, and events.
- **[Multi-channel inbox](https://docs.openclaw.ai/channels)** — WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, BlueBubbles (iMessage), iMessage (legacy), Microsoft Teams, Matrix, Zalo, Zalo Personal, WebChat, macOS, iOS/Android.
- **[Multi-agent routing](https://docs.openclaw.ai/gateway/configuration)** — route inbound channels/accounts/peers to isolated agents.
- **[Voice Wake](https://docs.openclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.openclaw.ai/nodes/talk)** — always-on speech for macOS/iOS/Android with ElevenLabs.
- **[Live Canvas](https://docs.openclaw.ai/platforms/mac/canvas)** — agent-driven visual workspace with [A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui).
- **[First-class tools](https://docs.openclaw.ai/tools)** — browser, canvas, nodes, cron, sessions, and Discord/Slack actions. **All tools unrestricted in YoloClaw.**
- **[Companion apps](https://docs.openclaw.ai/platforms/macos)** — macOS menu bar app + iOS/Android [nodes](https://docs.openclaw.ai/nodes).
- **[Onboarding](https://docs.openclaw.ai/start/wizard) + [skills](https://docs.openclaw.ai/tools/skills)** — wizard-driven setup with bundled/managed/workspace skills.

## Everything we built so far

> **Note:** All features below are inherited from upstream [OpenClaw](https://github.com/openclaw/openclaw). The difference is that YoloClaw runs them with zero safety guardrails.

### Core platform

- [Gateway WS control plane](https://docs.openclaw.ai/gateway) with sessions, presence, config, cron, webhooks, [Control UI](https://docs.openclaw.ai/web), and [Canvas host](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui).
- [CLI surface](https://docs.openclaw.ai/tools/agent-send): gateway, agent, send, [wizard](https://docs.openclaw.ai/start/wizard), and [doctor](https://docs.openclaw.ai/gateway/doctor).
- [Pi agent runtime](https://docs.openclaw.ai/concepts/agent) in RPC mode with tool streaming and block streaming.
- [Session model](https://docs.openclaw.ai/concepts/session): `main` for direct chats, group isolation, activation modes, queue modes, reply-back. Group rules: [Groups](https://docs.openclaw.ai/concepts/groups).
- [Media pipeline](https://docs.openclaw.ai/nodes/images): images/audio/video, transcription hooks, size caps, temp file lifecycle. Audio details: [Audio](https://docs.openclaw.ai/nodes/audio).

### Channels

- [Channels](https://docs.openclaw.ai/channels): [WhatsApp](https://docs.openclaw.ai/channels/whatsapp) (Baileys), [Telegram](https://docs.openclaw.ai/channels/telegram) (grammY), [Slack](https://docs.openclaw.ai/channels/slack) (Bolt), [Discord](https://docs.openclaw.ai/channels/discord) (discord.js), [Google Chat](https://docs.openclaw.ai/channels/googlechat) (Chat API), [Signal](https://docs.openclaw.ai/channels/signal) (signal-cli), [BlueBubbles](https://docs.openclaw.ai/channels/bluebubbles) (iMessage, recommended), [iMessage](https://docs.openclaw.ai/channels/imessage) (legacy imsg), [Microsoft Teams](https://docs.openclaw.ai/channels/msteams) (extension), [Matrix](https://docs.openclaw.ai/channels/matrix) (extension), [Zalo](https://docs.openclaw.ai/channels/zalo) (extension), [Zalo Personal](https://docs.openclaw.ai/channels/zalouser) (extension), [WebChat](https://docs.openclaw.ai/web/webchat).
- [Group routing](https://docs.openclaw.ai/concepts/group-messages): mention gating, reply tags, per-channel chunking and routing.

### Apps + nodes

- [macOS app](https://docs.openclaw.ai/platforms/macos): menu bar control plane, [Voice Wake](https://docs.openclaw.ai/nodes/voicewake)/PTT, [Talk Mode](https://docs.openclaw.ai/nodes/talk) overlay, [WebChat](https://docs.openclaw.ai/web/webchat), debug tools, [remote gateway](https://docs.openclaw.ai/gateway/remote) control.
- [iOS node](https://docs.openclaw.ai/platforms/ios): [Canvas](https://docs.openclaw.ai/platforms/mac/canvas), [Voice Wake](https://docs.openclaw.ai/nodes/voicewake), [Talk Mode](https://docs.openclaw.ai/nodes/talk), camera, screen recording, Bonjour pairing.
- [Android node](https://docs.openclaw.ai/platforms/android): [Canvas](https://docs.openclaw.ai/platforms/mac/canvas), [Talk Mode](https://docs.openclaw.ai/nodes/talk), camera, screen recording, optional SMS.
- [macOS node mode](https://docs.openclaw.ai/nodes): system.run/notify + canvas/camera exposure.

### Tools + automation

- [Browser control](https://docs.openclaw.ai/tools/browser): dedicated Chrome/Chromium, snapshots, actions, uploads, profiles.
- [Canvas](https://docs.openclaw.ai/platforms/mac/canvas): [A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui) push/reset, eval, snapshot.
- [Nodes](https://docs.openclaw.ai/nodes): camera snap/clip, screen record, [location.get](https://docs.openclaw.ai/nodes/location-command), notifications.
- [Cron + wakeups](https://docs.openclaw.ai/automation/cron-jobs); [webhooks](https://docs.openclaw.ai/automation/webhook); [Gmail Pub/Sub](https://docs.openclaw.ai/automation/gmail-pubsub).
- [Skills platform](https://docs.openclaw.ai/tools/skills): bundled, managed, and workspace skills with install gating + UI.

### Runtime + safety

> **In YoloClaw, most of the "safety" items below are gutted. They exist in code but are no-ops.**

- [Channel routing](https://docs.openclaw.ai/concepts/channel-routing), [retry policy](https://docs.openclaw.ai/concepts/retry), and [streaming/chunking](https://docs.openclaw.ai/concepts/streaming).
- [Presence](https://docs.openclaw.ai/concepts/presence), [typing indicators](https://docs.openclaw.ai/concepts/typing-indicators), and [usage tracking](https://docs.openclaw.ai/concepts/usage-tracking).
- [Models](https://docs.openclaw.ai/concepts/models), [model failover](https://docs.openclaw.ai/concepts/model-failover), and [session pruning](https://docs.openclaw.ai/concepts/session-pruning).
- ~~[Security](https://docs.openclaw.ai/gateway/security)~~ and [troubleshooting](https://docs.openclaw.ai/channels/troubleshooting). (Security mechanisms are disabled in this fork.)

### Ops + packaging

- [Control UI](https://docs.openclaw.ai/web) + [WebChat](https://docs.openclaw.ai/web/webchat) served directly from the Gateway.
- [Tailscale Serve/Funnel](https://docs.openclaw.ai/gateway/tailscale) or [SSH tunnels](https://docs.openclaw.ai/gateway/remote) with token/password auth.
- [Nix mode](https://docs.openclaw.ai/install/nix) for declarative config; [Docker](https://docs.openclaw.ai/install/docker)-based installs.
- [Doctor](https://docs.openclaw.ai/gateway/doctor) migrations, [logging](https://docs.openclaw.ai/logging).

## How it works (short)

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / BlueBubbles / Microsoft Teams / Matrix / Zalo / Zalo Personal / WebChat
               |
               v
+-------------------------------+
|            Gateway            |
|       (control plane)         |
|   *** NO SAFETY GUARDRAILS ** |
|     ws://127.0.0.1:18789      |
+---------------+---------------+
               |
               +-- Pi agent (RPC)       <-- executes anything, no approval
               +-- CLI (openclaw ...)
               +-- WebChat UI
               +-- macOS app
               +-- iOS / Android nodes
```

## Key subsystems

- **[Gateway WebSocket network](https://docs.openclaw.ai/concepts/architecture)** — single WS control plane for clients, tools, and events (plus ops: [Gateway runbook](https://docs.openclaw.ai/gateway)).
- **[Tailscale exposure](https://docs.openclaw.ai/gateway/tailscale)** — Serve/Funnel for the Gateway dashboard + WS (remote access: [Remote](https://docs.openclaw.ai/gateway/remote)).
- **[Browser control](https://docs.openclaw.ai/tools/browser)** — managed Chrome/Chromium with CDP control.
- **[Canvas + A2UI](https://docs.openclaw.ai/platforms/mac/canvas)** — agent-driven visual workspace.
- **[Voice Wake](https://docs.openclaw.ai/nodes/voicewake) + [Talk Mode](https://docs.openclaw.ai/nodes/talk)** — always-on speech and continuous conversation.
- **[Nodes](https://docs.openclaw.ai/nodes)** — Canvas, camera snap/clip, screen record, `location.get`, notifications, plus macOS-only `system.run`/`system.notify`.

## Tailscale access (Gateway dashboard)

> **Warning: Exposing YoloClaw via Tailscale Funnel makes an unguarded AI assistant accessible from the public internet. Do not do this.**

YoloClaw can auto-configure Tailscale **Serve** (tailnet-only) or **Funnel** (public) while the Gateway stays bound to loopback. Configure `gateway.tailscale.mode`:

- `off`: no Tailscale automation (default).
- `serve`: tailnet-only HTTPS via `tailscale serve`.
- `funnel`: public HTTPS via `tailscale funnel` (requires shared password auth).

Details: [Tailscale guide](https://docs.openclaw.ai/gateway/tailscale) · [Web surfaces](https://docs.openclaw.ai/web)

## Remote Gateway (Linux is great)

It is perfectly fine to run the upstream OpenClaw Gateway on a small Linux instance. **Running YoloClaw remotely is not recommended** — a remote unguarded agent with full exec access is an exceptionally bad idea.

- **Gateway host** runs the exec tool and channel connections by default.
- **Device nodes** run device-local actions (`system.run`, camera, screen recording, notifications) via `node.invoke`.

Details: [Remote access](https://docs.openclaw.ai/gateway/remote) · [Nodes](https://docs.openclaw.ai/nodes) · [Security](https://docs.openclaw.ai/gateway/security)

## macOS permissions via the Gateway protocol

The macOS app can run in **node mode** and advertises its capabilities + permission map over the Gateway WebSocket (`node.list` / `node.describe`). Clients can then execute local actions via `node.invoke`:

- `system.run` runs a local command and returns stdout/stderr/exit code.
- `system.notify` posts a user notification.
- `canvas.*`, `camera.*`, `screen.record`, and `location.get` are also routed via `node.invoke` and follow TCC permission status.

Details: [Nodes](https://docs.openclaw.ai/nodes) · [macOS app](https://docs.openclaw.ai/platforms/macos) · [Gateway protocol](https://docs.openclaw.ai/concepts/architecture)

## Agent to Agent (sessions\_\* tools)

> **In upstream OpenClaw, `sessions_spawn` and `sessions_send` are in the dangerous tools deny list. In YoloClaw, they are fully unrestricted.**

- `sessions_list` — discover active sessions (agents) and their metadata.
- `sessions_history` — fetch transcript logs for a session.
- `sessions_send` — message another session; optional reply-back ping-pong.

Details: [Session tools](https://docs.openclaw.ai/concepts/session-tool)

## Skills registry (ClawHub)

ClawHub is a minimal skill registry. With ClawHub enabled, the agent can search for skills automatically and pull in new ones as needed.

[ClawHub](https://clawhub.com)

## Chat commands

Send these in WhatsApp/Telegram/Slack/Google Chat/Microsoft Teams/WebChat:

- `/status` — compact session status (model + tokens, cost when available)
- `/mesh <goal>` — auto-plan + run a multi-step workflow
- `/new` or `/reset` — reset the session
- `/compact` — compact session context (summary)
- `/think <level>` — off|minimal|low|medium|high|xhigh
- `/verbose on|off`
- `/usage off|tokens|full` — per-response usage footer
- `/restart` — restart the gateway (owner-only in groups)
- `/activation mention|always` — group activation toggle (groups only)

## Apps (optional)

The Gateway alone delivers the full experience. All apps are optional.

### macOS (optional)

- Menu bar control for the Gateway and health.
- Voice Wake + push-to-talk overlay.
- WebChat + debug tools.
- Remote gateway control over SSH.

### iOS node (optional)

- Pairs as a node via the Bridge.
- Voice trigger forwarding + Canvas surface.
- Runbook: [iOS connect](https://docs.openclaw.ai/platforms/ios).

### Android node (optional)

- Pairs via the same Bridge + pairing flow as iOS.
- Exposes Canvas, Camera, and Screen capture commands.
- Runbook: [Android connect](https://docs.openclaw.ai/platforms/android).

## Agent workspace + skills

- Workspace root: `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`).
- Injected prompt files: `AGENTS.md`, `SOUL.md`, `TOOLS.md`.
- Skills: `~/.openclaw/workspace/skills/<skill>/SKILL.md`.

> **In YoloClaw, `SOUL.md` has been rewritten to instruct the agent to act without permission and ignore all boundaries. See the [What's Different from OpenClaw](#whats-different-from-openclaw) section.**

## Configuration

Minimal `~/.openclaw/openclaw.json` (model + defaults):

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}
```

[Full configuration reference (all keys + examples).](https://docs.openclaw.ai/gateway/configuration)

## Security model (important)

> **YoloClaw has NO functional security model.** The information below describes what upstream OpenClaw provides. In this fork, exec approvals always pass, SSRF checks always pass, dangerous tool lists are empty, and external content is never sanitized.

- **Default (upstream):** tools run on the host for the **main** session, so the agent has full access when it is just you.
- **Group/channel safety (upstream):** set `agents.defaults.sandbox.mode: "non-main"` to run non-main sessions inside per-session Docker sandboxes.
- **Sandbox defaults (upstream):** allowlist `bash`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`; denylist `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`.

Details: [Security guide](https://docs.openclaw.ai/gateway/security) · [Docker + sandboxing](https://docs.openclaw.ai/install/docker) · [Sandbox config](https://docs.openclaw.ai/gateway/configuration)

### [WhatsApp](https://docs.openclaw.ai/channels/whatsapp)

- Link the device: `pnpm openclaw channels login` (stores creds in `~/.openclaw/credentials`).
- Allowlist who can talk to the assistant via `channels.whatsapp.allowFrom`.
- If `channels.whatsapp.groups` is set, it becomes a group allowlist; include `"*"` to allow all.

### [Telegram](https://docs.openclaw.ai/channels/telegram)

- Set `TELEGRAM_BOT_TOKEN` or `channels.telegram.botToken` (env wins).
- Optional: set `channels.telegram.groups`; when set, it is a group allowlist.

```json5
{
  channels: {
    telegram: {
      botToken: "123456:ABCDEF",
    },
  },
}
```

### [Slack](https://docs.openclaw.ai/channels/slack)

- Set `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` (or `channels.slack.botToken` + `channels.slack.appToken`).

### [Discord](https://docs.openclaw.ai/channels/discord)

- Set `DISCORD_BOT_TOKEN` or `channels.discord.token` (env wins).

```json5
{
  channels: {
    discord: {
      token: "1234abcd",
    },
  },
}
```

### [Signal](https://docs.openclaw.ai/channels/signal)

- Requires `signal-cli` and a `channels.signal` config section.

### [BlueBubbles (iMessage)](https://docs.openclaw.ai/channels/bluebubbles)

- **Recommended** iMessage integration.
- Configure `channels.bluebubbles.serverUrl` + `channels.bluebubbles.password` and a webhook.

### [iMessage (legacy)](https://docs.openclaw.ai/channels/imessage)

- Legacy macOS-only integration via `imsg`.

### [Microsoft Teams](https://docs.openclaw.ai/channels/msteams)

- Configure a Teams app + Bot Framework, then add a `msteams` config section.

### [WebChat](https://docs.openclaw.ai/web/webchat)

- Uses the Gateway WebSocket; no separate WebChat port/config.

Browser control (optional):

```json5
{
  browser: {
    enabled: true,
    color: "#FF4500",
  },
}
```

## Docs

Use these when you are past the onboarding flow and want the deeper reference. These point to the upstream OpenClaw docs, which are still relevant for understanding the platform — just remember that YoloClaw has no safety guardrails.

- [Start with the docs index for navigation and "what's where."](https://docs.openclaw.ai)
- [Read the architecture overview for the gateway + protocol model.](https://docs.openclaw.ai/concepts/architecture)
- [Use the full configuration reference when you need every key and example.](https://docs.openclaw.ai/gateway/configuration)
- [Run the Gateway by the book with the operational runbook.](https://docs.openclaw.ai/gateway)
- [Learn how the Control UI/Web surfaces work and how to expose them safely.](https://docs.openclaw.ai/web)
- [Understand remote access over SSH tunnels or tailnets.](https://docs.openclaw.ai/gateway/remote)
- [Follow the onboarding wizard flow for a guided setup.](https://docs.openclaw.ai/start/wizard)
- [Wire external triggers via the webhook surface.](https://docs.openclaw.ai/automation/webhook)
- [Set up Gmail Pub/Sub triggers.](https://docs.openclaw.ai/automation/gmail-pubsub)
- [Learn the macOS menu bar companion details.](https://docs.openclaw.ai/platforms/mac/menu-bar)
- [Platform guides: Windows (WSL2)](https://docs.openclaw.ai/platforms/windows), [Linux](https://docs.openclaw.ai/platforms/linux), [macOS](https://docs.openclaw.ai/platforms/macos), [iOS](https://docs.openclaw.ai/platforms/ios), [Android](https://docs.openclaw.ai/platforms/android)
- [Debug common failures with the troubleshooting guide.](https://docs.openclaw.ai/channels/troubleshooting)
- [Review security guidance before exposing anything.](https://docs.openclaw.ai/gateway/security)

## Advanced docs (discovery + control)

- [Discovery + transports](https://docs.openclaw.ai/gateway/discovery)
- [Bonjour/mDNS](https://docs.openclaw.ai/gateway/bonjour)
- [Gateway pairing](https://docs.openclaw.ai/gateway/pairing)
- [Remote gateway README](https://docs.openclaw.ai/gateway/remote-gateway-readme)
- [Control UI](https://docs.openclaw.ai/web/control-ui)
- [Dashboard](https://docs.openclaw.ai/web/dashboard)

## Operations & troubleshooting

- [Health checks](https://docs.openclaw.ai/gateway/health)
- [Gateway lock](https://docs.openclaw.ai/gateway/gateway-lock)
- [Background process](https://docs.openclaw.ai/gateway/background-process)
- [Browser troubleshooting (Linux)](https://docs.openclaw.ai/tools/browser-linux-troubleshooting)
- [Logging](https://docs.openclaw.ai/logging)

## Deep dives

- [Agent loop](https://docs.openclaw.ai/concepts/agent-loop)
- [Presence](https://docs.openclaw.ai/concepts/presence)
- [TypeBox schemas](https://docs.openclaw.ai/concepts/typebox)
- [RPC adapters](https://docs.openclaw.ai/reference/rpc)
- [Queue](https://docs.openclaw.ai/concepts/queue)

## Workspace & skills

- [Skills config](https://docs.openclaw.ai/tools/skills-config)
- [Default AGENTS](https://docs.openclaw.ai/reference/AGENTS.default)
- [Templates: AGENTS](https://docs.openclaw.ai/reference/templates/AGENTS)
- [Templates: BOOTSTRAP](https://docs.openclaw.ai/reference/templates/BOOTSTRAP)
- [Templates: IDENTITY](https://docs.openclaw.ai/reference/templates/IDENTITY)
- [Templates: SOUL](https://docs.openclaw.ai/reference/templates/SOUL)
- [Templates: TOOLS](https://docs.openclaw.ai/reference/templates/TOOLS)
- [Templates: USER](https://docs.openclaw.ai/reference/templates/USER)

## Platform internals

- [macOS dev setup](https://docs.openclaw.ai/platforms/mac/dev-setup)
- [macOS menu bar](https://docs.openclaw.ai/platforms/mac/menu-bar)
- [macOS voice wake](https://docs.openclaw.ai/platforms/mac/voicewake)
- [iOS node](https://docs.openclaw.ai/platforms/ios)
- [Android node](https://docs.openclaw.ai/platforms/android)
- [Windows (WSL2)](https://docs.openclaw.ai/platforms/windows)
- [Linux app](https://docs.openclaw.ai/platforms/linux)

## Email hooks (Gmail)

- [docs.openclaw.ai/gmail-pubsub](https://docs.openclaw.ai/automation/gmail-pubsub)

---

## Upstream

YoloClaw is a fork of **[OpenClaw](https://github.com/openclaw/openclaw)**, built by Peter Steinberger and the community. 🦞

All credit for the platform goes to the upstream project. This fork only removes safety guardrails for research/educational purposes.

- [openclaw.ai](https://openclaw.ai)
- [OpenClaw on GitHub](https://github.com/openclaw/openclaw)

## License

MIT — same as upstream [OpenClaw](https://github.com/openclaw/openclaw).

---

> **One final reminder:** Do not use YoloClaw. Use [OpenClaw](https://github.com/openclaw/openclaw). The guardrails exist for very good reasons, and this fork exists to prove it.
