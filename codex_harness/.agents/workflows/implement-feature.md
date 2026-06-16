# Workflow: implement-feature

## Execution roles

1. architect
2. implementer
3. tester
4. reviewer

## Order

1. architect analyzes the request.
2. implementer applies the plan.
3. tester adds or runs tests.
4. reviewer checks the diff.

If tests or review fail, run the fix-bug workflow.

## Rules

- Keep changes focused.
- Do not bypass tests unless no test setup exists.
- Stop and report if the repository is unsafe.
