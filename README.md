# oc-sessions

`oc-sessions` installs the `oc` CLI, a small tool for listing, inspecting, resuming, and deleting OpenCode sessions from the local session database.

## Features

- `oc new` to start a new interactive session in the current directory
- `oc list` and `oc ls` to browse root sessions
- `oc view` and `oc v` to inspect session details and recent text
- `oc resume` and `oc r` to reopen a session
- `oc delete` and `oc d` to remove a session after confirmation
- exact-title lookup for `view`, `resume`, and `delete`
- fuzzy match suggestions for unresolved or ambiguous session lookups
- no-argument `oc resume` that looks up sessions for the current directory and supports interactive search when there are multiple matches

## Requirements

- Node.js 18+
- `opencode` available in your shell

## Install

From npm after publishing:

```bash
npm install -g oc-sessions
```

For local development from this repository:

```bash
bun install
bun add --global "$PWD"
```

You can also run the built CLI directly:

```bash
npm run build
node ./dist/cli/index.js list
```

## Release

Publishing is automated via GitHub Actions:

- push a version tag like `v0.1.1` (must match `package.json` version), or
- run the `npm-release` workflow manually.

Repository secret required:

- `NPM_TOKEN` with publish permission for `oc-sessions`.

## Usage

```text
oc new <title> [prompt...]
oc list
oc ls
oc view <session>
oc v <session>
oc resume [session]
oc r [session]
oc delete <session>
oc d <session>
```

`oc new` launches the full OpenCode TUI (`opencode --prompt ...`) so the session is interactive from the start.

## Examples

```bash
oc new "Fix login redirect" "Investigate the redirect loop after sign-in and patch it."
oc ls
oc v "usage-plugin"
oc resume
oc r "usage-plugin"
oc d "usage-plugin"
```
