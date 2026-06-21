# 프로젝트 하네스 사용 정책

이 저장소에는 두 개의 자동화 하네스가 있습니다.

1. **Claude Code (OMC)** — 지금 이 세션처럼 사람과 직접 대화하며 코드를 수정하는 기본 작업 도구.
2. **codex_harness** — Codex CLI를 별도 프로세스로 띄워 architect/implementer/tester/reviewer/debugger 역할을 순차 실행하는 하네스(`codex_harness/scripts/agent-runner.mjs`).

## 역할 분담

- **기본 작업(구현, 디버깅, 리뷰)은 Claude Code(OMC)로 진행합니다.**
- **codex_harness는 동시에 같은 작업에 쓰지 않고, Claude Code 작업이 끝나고 커밋된 뒤에 별도 모델 관점의 2차 검증으로만 사용합니다.** 주로 `review-and-refactor` 워크플로.
  ```sh
  node codex_harness/scripts/agent-runner.mjs review-and-refactor "검토할 범위 설명"
  ```
- 두 하네스를 같은 워킹트리에서 동시에 실행하지 않습니다. 커밋되지 않은 변경이 있는 상태에서 codex_harness의 `implement-feature`/`fix-bug`를 돌리면 두 에이전트가 같은 파일을 동시에 수정해 레이스 컨디션이 생길 수 있습니다.

## AGENTS.md / .agents 소유권

- 루트 `AGENTS.md`와 `.agents/`는 **codex_harness가 소유**합니다(`codex_harness/scripts/agent-runner.mjs init --project-root .` 실행 시 `codex_harness/AGENTS.template.md`로부터 생성, 기존 파일은 `--force` 없이는 덮어쓰지 않음).
- 이 정책에 따라 **OMC의 `deepinit`(계층형 AGENTS.md 생성) 스킬은 이 저장소 루트에서 실행하지 않습니다.** 두 생성기가 같은 `AGENTS.md`를 두고 경쟁하는 것을 피하기 위함입니다.

자세한 배경은 `README.md`의 "하네스 사용 정책" 절을 참고하세요.
