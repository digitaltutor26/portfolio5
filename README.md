# portfolio5

Operation improvement workspace for AI-assisted automation.

## Auto1

Current product direction:

This folder is currently focused on building a tool for automatically evaluating
student performance assessments while keeping the teacher as the final reviewer.

The intended product is an operational teacher-facing tool, not a marketing
site. The core workflow is:

1. Create an assessment.
2. Define or import a rubric.
3. Upload or paste student submissions.
4. Run AI-assisted evaluation.
5. Review evidence, score, and feedback.
6. Approve or override results.
7. Export class records and feedback.

See `DESIGN.md` for the product, UX, and interface direction.

## Prototype

Open `app/index.html` in a browser to try the first static prototype.

The prototype includes:

- assessment setup
- rubric editing
- sample student submissions
- local AI-style scoring simulation
- teacher review and approval
- class summary and CSV export

## Existing Automation Harness

`codex_harness/` contains a Codex CLI multi-agent harness that can initialize
project agent files, run role-based workflows, produce reports, and operate in
non-interactive mode.

The long-term reference project is `digitaltutor26/portfolio5`.

## Uploaded Reference

`회사 출근 전 확인사항_YYproject - Claude.pdf` is present as a reference document
for a larger future automation project. Its content still needs extraction or a
manual summary before it becomes implementation requirements.
