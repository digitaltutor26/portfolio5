# Design

## Source of truth
- Status: Draft
- Last refreshed: 2026-06-16
- Primary product surfaces: teacher-facing web app or local dashboard for student performance-assessment grading automation.
- Evidence reviewed:
  - `codex_harness/README.md`: existing automation harness direction and CLI workflow.
  - `회사 출근 전 확인사항_YYproject - Claude.pdf`: uploaded reference document exists in the repo root, but local text extraction was not available in this environment; content still needs review before being treated as requirements.
  - No existing frontend source, product README, UI components, or design assets were found.

## Brand
- Personality: precise, calm, teacher-assistive, audit-friendly.
- Trust signals: clear rubric criteria, visible evidence snippets, score rationale, manual override history, exportable reports.
- Avoid: playful grading gimmicks, opaque "AI says so" scoring, oversized marketing layout, decorative visual noise, one-click irreversible grading.

## Product goals
- Goals:
  - Help teachers evaluate student performance tasks faster while preserving teacher control.
  - Convert rubric criteria into consistent scoring checks.
  - Generate evidence-backed feedback that teachers can review and edit.
  - Produce class-level summaries and exportable scoring records.
- Non-goals:
  - Fully replacing teacher judgment.
  - High-stakes automated final grading without review.
  - Generic LMS replacement.
  - Student-facing social or portfolio features in the first version.
- Success signals:
  - A teacher can configure a rubric and evaluate a batch of submissions in one session.
  - Every score has a traceable rationale and evidence.
  - Teacher edits are preserved and visible.
  - Results can be exported for school record workflows.

## Personas and jobs
- Primary personas:
  - Teacher evaluating written, project, presentation, or portfolio-based performance tasks.
  - Department lead checking scoring consistency across classes.
- User jobs:
  - Define task instructions and rubric levels.
  - Upload or paste student submissions.
  - Run AI-assisted evaluation.
  - Review score, feedback, and evidence.
  - Adjust scores and comments.
  - Export final results.
- Key contexts of use:
  - After class or before grade entry deadlines.
  - Batch evaluation of many students.
  - School environment where fairness, explainability, and record keeping matter.

## Information architecture
- Primary navigation:
  - Assessments
  - Rubrics
  - Submissions
  - Review Queue
  - Reports
  - Settings
- Core routes/screens:
  - Assessment setup: task title, instructions, subject, grade level, due date, evaluation mode.
  - Rubric builder: criteria, point ranges, achievement levels, required evidence.
  - Submission intake: upload files, paste text, import CSV, map student names/IDs.
  - Evaluation run: queue status, model/policy settings, failed item retry.
  - Review workspace: student answer, rubric panel, AI score, evidence, feedback editor, override controls.
  - Class report: distribution, criterion-level weak points, export.
- Content hierarchy:
  - Always lead with assessment status and unresolved review count.
  - Keep score, rationale, and evidence together.
  - Put batch controls near queue-level context, not inside individual feedback text.

## Design principles
- Principle 1: Teacher remains the final decision maker.
- Principle 2: Every AI-generated score must be inspectable.
- Principle 3: Batch workflows should reduce repetition without hiding individual student context.
- Tradeoffs:
  - Prefer dense, operational layouts over promotional pages.
  - Prefer explicit review states over fast but opaque automation.
  - Prefer conservative defaults when rubric interpretation is ambiguous.

## Visual language
- Color:
  - Neutral operational base with restrained accent colors for status.
  - Use distinct colors for review states: pending, needs review, approved, exported.
  - Avoid a single-hue purple/blue gradient-heavy interface.
- Typography:
  - Compact, readable UI typography.
  - Hero-scale type is not needed for the core app.
- Spacing/layout rhythm:
  - Dense but organized panels for repeated teacher workflows.
  - Use table/list layouts where comparison matters.
- Shape/radius/elevation:
  - Modest radius, ideally 8px or less.
  - Avoid nested cards; use panels, tables, split panes, and full-width sections.
- Motion:
  - Minimal motion for queue progress and state changes.
  - No decorative animation.
- Imagery/iconography:
  - Use icons for actions: upload, run, approve, export, retry, edit.
  - No generic classroom stock imagery in the working app.

## Components
- Existing components to reuse:
  - None found yet.
- New/changed components:
  - Assessment list/table.
  - Rubric criterion editor.
  - Submission upload/import area.
  - Evaluation queue.
  - Review split pane.
  - Score and confidence indicator.
  - Evidence snippet list.
  - Feedback editor with teacher override note.
  - Export dialog.
- Variants and states:
  - Pending, evaluating, failed, needs review, approved, exported.
  - Empty rubric, empty submissions, no evidence found, partial evaluation failure.
- Token/component ownership:
  - Establish simple design tokens when frontend framework is chosen.

## Accessibility
- Target standard: WCAG 2.1 AA where practical.
- Keyboard/focus behavior:
  - Review workspace must support keyboard navigation between students and rubric criteria.
  - All toolbar icon buttons need labels/tooltips.
- Contrast/readability:
  - Feedback, evidence, and scores must remain readable in dense views.
- Screen-reader semantics:
  - Tables need headers and meaningful row labels.
  - Status changes should be announced where possible.
- Reduced motion and sensory considerations:
  - Queue progress should not depend on animation alone.

## Responsive behavior
- Supported breakpoints/devices:
  - Desktop and laptop first.
  - Tablet support for review is useful.
  - Phone support can be limited to status checking in the first version.
- Layout adaptations:
  - Desktop: split pane with submission, rubric, and feedback.
  - Tablet: collapsible rubric/feedback panels.
  - Mobile: list-first status and read-only summaries.
- Touch/hover differences:
  - Do not rely on hover-only controls.

## Interaction states
- Loading:
  - Show batch progress, current item, and retryable failures.
- Empty:
  - Empty states should offer the next operational action, such as creating a rubric or uploading submissions.
- Error:
  - Evaluation failures should preserve the submission and allow retry.
- Success:
  - Approved items should show final score, teacher, timestamp, and export status.
- Disabled:
  - Disabled actions must explain what is missing, for example "Add at least one rubric criterion."
- Offline/slow network:
  - Preserve drafts locally where possible.
  - Warn before leaving an unsaved review.

## Content voice
- Tone: professional, concise, teacher-facing.
- Terminology:
  - Use "assessment", "rubric", "criterion", "submission", "evidence", "feedback", "teacher override".
  - Avoid "AI grade is final" language.
- Microcopy rules:
  - Explain uncertainty in plain terms.
  - Label automated content as AI-generated until approved.
  - Keep student-facing feedback editable before export.

## Implementation constraints
- Framework/styling system:
  - Not selected yet.
  - The current repo contains `codex_harness` only; frontend stack should be chosen before implementation.
- Design-token constraints:
  - Define status colors, spacing, typography, and panel/table primitives early.
- Performance constraints:
  - Batch evaluation should stream or checkpoint progress.
  - Large submissions should not block the review interface.
- Compatibility constraints:
  - Export should support CSV at minimum; XLSX/PDF can follow.
- Test/screenshot expectations:
  - Add tests for rubric scoring logic, result parsing, manual override behavior, and export formatting.
  - Use screenshot checks once a UI exists.

## Open questions
- [ ] What submission formats are required first: text paste, PDF, HWP, DOCX, images, CSV, Google Classroom export?
- [ ] What subjects and grade levels should the first rubric templates target?
- [ ] Should AI evaluation run locally through Codex-style automation, through an API backend, or both?
- [ ] What output format does the school workflow need: CSV, Excel, PDF feedback sheets, LMS import?
- [ ] What privacy constraints apply to student names, IDs, and submitted work?
- [ ] Should the first version be CLI/report-only, web dashboard, or both?
- [ ] The uploaded YYproject PDF needs content extraction or manual summary before its workflow ideas can be incorporated.
