# Codex Harness

Lightweight multi-agent harness for Codex CLI automation.

## Repository

GitHub repository: `digitaltutor26/portfolio5`

## Requirements

- Node.js 18 or newer
- Codex CLI available as `codex`
- A project directory where the harness can create `AGENTS.md`, `.agents`, and reports

## Initialize a Project

From the repository root:

```sh
node codex_harness/scripts/agent-runner.mjs init --project-root .
```

This creates, without overwriting existing files:

- `AGENTS.md`
- `.agents/roles/*.md`
- `.agents/workflows/*.md`
- `codex-harness.config.json`

Use `--force` to overwrite generated harness files.

## Run a Workflow

From the project root:

```sh
node codex_harness/scripts/agent-runner.mjs implement-feature "Describe the task"
```

With an explicit target repository:

```sh
node codex_harness/scripts/agent-runner.mjs implement-feature "Describe the task" --project-root /path/to/project
```

Preview the planned role sequence without running Codex:

```sh
node codex_harness/scripts/agent-runner.mjs implement-feature "Describe the task" --dry-run
```

Run without mid-task clarification questions:

```sh
node codex_harness/scripts/agent-runner.mjs implement-feature "Describe the task" --non-interactive
```

In non-interactive mode, agents proceed with safe reversible defaults and return
`BLOCKED` instead of asking when a step is destructive, credential-gated,
production-impacting, or materially scope-changing.

Available workflows:

- `implement-feature`
- `fix-bug`
- `review-and-refactor`

Workflow execution order is defined in `.agents/workflows/*.md` under the
`## Execution roles` section. Role prompts are defined in `.agents/roles/*.md`.

## Configuration

The runner reads `codex-harness.config.json` from `--project-root` when present.
Otherwise it falls back to `codex_harness/codex-harness.config.json`.

The config controls:

- role prompt directory
- workflow directory
- report directory
- Codex command name
- test and review command hints
- sandbox policy per role
- maximum automatic `fix-bug` loops
- non-interactive decision policy

## Results

Each role is instructed to end with:

```text
HARNESS_RESULT: {"decision":"APPROVED|NEEDS_CHANGES|DONE|FAILED|BLOCKED","summary":"one short sentence"}
```

When a reviewer returns `NEEDS_CHANGES`, the runner automatically starts the
`fix-bug` workflow up to `maxFixLoops` times. Use `--max-retries <n>` to override
that value for one run.

Reports are written to the configured `reportsDir` with the workflow, role, and
run id in the filename.

Each run also writes a summary report named `<run-id>-summary.md` with:

- final status
- task and project root
- interaction policy
- role-by-role decisions
- report file paths
- stop condition

## Helper Scripts

`scripts/test.sh` detects common JavaScript, Python, Rust, Go, and Make-based
test setups. `scripts/review.sh` prints git status and diff information, and
clearly exits when the target directory is not a git repository.
