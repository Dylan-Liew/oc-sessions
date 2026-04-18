# oc-sessions

`oc-sessions` installs the `oc` CLI, a small tool for listing, inspecting, resuming, and deleting OpenCode sessions from the local session database.

## Requirements

- Node.js `^20.19.0 || ^22.12.0 || >=23`
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
bun link
```

You can also run the built CLI directly:

```bash
bun run build
node ./dist/cli/index.js list
```

## Usage

```text
oc <command>

Commands:
  new                  Start a new OpenCode session
  resume, r [session]  Launch opencode in the session directory
  list, ls             List root sessions across all projects
  view, v <session>    Show session metadata and recent text parts
  delete, d <session>  Delete the session via opencode after confirmation
  cleanup              Clean stale OpenCode DB/cache artifacts
  help                 Show CLI help
  completion           Print a fish completion script
```

## Session lookup

`<session>` is required for `view` and `delete`. `[session]` is optional for `resume`.

When a session value is provided, the CLI resolves it in this order:

1. Exact session ID match
2. Exact session title match
3. Unique session title prefix match
4. Unique session ID prefix match

## Quick workflows

```bash
oc help
oc new
oc resume
oc list
oc cleanup
oc cleanup --vacuum
```

## Optional Fish completions

If you use Fish, install a completion file into Fish's user completion directory:

```bash
mkdir -p ~/.config/fish/completions
oc completion fish > ~/.config/fish/completions/oc.fish
```

Open a new Fish shell after installing the file, or run:

```fish
source ~/.config/fish/completions/oc.fish
```
