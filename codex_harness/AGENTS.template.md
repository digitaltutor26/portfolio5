# AGENTS.md

## Purpose

This project uses Codex CLI with a lightweight multi-agent harness.

Harness configuration lives in `codex-harness.config.json`.
Role prompts live in `.agents/roles`.
Workflow order lives in `.agents/workflows` under `## Execution roles`.

## Roles

- architect: analyzes requirements and designs the solution
- implementer: modifies code
- tester: writes or runs tests
- reviewer: reviews quality, security, and maintainability
- debugger: fixes test failures and runtime errors

## Rules

- Make small, focused changes.
- Do not modify unrelated files.
- Inspect files before editing.
- Run tests after code changes.
- Do not expose secrets, tokens, API keys, or private credentials.
- Summarize changed files, commands run, and remaining risks.
- End role outputs with the required `HARNESS_RESULT` JSON line when running under the harness.
- In non-interactive harness runs, do not ask for confirmation. Choose safe reversible defaults, document assumptions, and return `BLOCKED` for destructive, credential-gated, production-impacting, or materially scope-changing actions.

## Final Response Format

When completing a task, summarize:

1. What changed
2. Files changed
3. Tests run
4. Remaining risks or TODOs
