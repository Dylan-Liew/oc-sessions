# oc-sessions

`oc-sessions` installs the `oc` CLI, a small tool for listing, inspecting, resuming, and deleting OpenCode sessions from the local session database.

## Requirements

- Node.js 18+
- `opencode` available in your shell

## Install

From npm after publishing:

```bash
npm install -g oc-sessions
```

From Bun:

```bash
bun add -g oc-sessions
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

## Usage

```text
Usage:
  oc new <title> <prompt...>
  oc list
  oc view <session>
  oc resume [session]
  oc delete <session>

Commands:
  new       Start a new titled OpenCode session
  list, ls  List root sessions across all projects
  view, v   Show session metadata and recent text parts
  resume, r Launch opencode in the session directory
  delete, d Delete the session via opencode after confirmation
```

## Session lookup

For commands that take `<session>`, the CLI resolves in this order:

1. Exact session ID match
2. Exact session title match
3. Unique session title prefix match
4. Unique session ID prefix match

## Quick workflows

```bash
oc new "Fix login redirect" "Investigate the redirect loop after sign-in and patch it."
oc list
oc resume
```
