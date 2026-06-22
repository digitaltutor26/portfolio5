const defaultState = {
  assessment: {
    title: "환경 주제 주장 글쓰기",
    subject: "2학년 국어",
    maxScore: 20,
    prompt:
      "환경 문제에 대한 자신의 주장을 세우고, 근거를 들어 설득력 있는 글을 작성한다.",
  },
  rubric: [
    {
      id: "claim",
      name: "주장 명확성",
      points: 5,
      hints: "주장, 입장, 결론, 해야 한다",
    },
    {
      id: "evidence",
      name: "근거와 자료",
      points: 6,
      hints: "근거, 예를 들어, 자료, 조사, 수치, 사례",
    },
    {
      id: "structure",
      name: "글의 구성",
      points: 5,
      hints: "처음, 중간, 끝, 문단, 연결",
    },
    {
      id: "expression",
      name: "표현과 맞춤법",
      points: 4,
      hints: "문장, 표현, 맞춤법, 어휘",
    },
  ],
  submissions: [
    {
      id: "20201",
      name: "김민준",
      text:
        "학교에서 일회용품 사용을 줄여야 한다. 플라스틱 컵과 빨대는 분해되는 데 오랜 시간이 걸리고 바다 생물에게 피해를 준다. 예를 들어 급식실에서 개인 컵을 사용하고 분리수거함을 늘리면 쓰레기를 줄일 수 있다. 처음에는 불편할 수 있지만 모두가 조금씩 실천하면 학교 환경이 좋아진다.",
      status: "pending",
      scores: {},
      aiScore: null,
      teacherScore: null,
      confidence: null,
      feedback: "",
      note: "",
    },
    {
      id: "20202",
      name: "이서연",
      text:
        "나는 교실 전기를 아껴야 한다고 생각한다. 아무도 없는 교실에 불이 켜져 있는 경우가 많다. 전기를 만들 때 많은 자원이 쓰이기 때문에 낭비하면 안 된다. 쉬는 시간과 이동 수업 때 전등과 에어컨을 확인하는 담당을 정하면 좋겠다.",
      status: "pending",
      scores: {},
      aiScore: null,
      teacherScore: null,
      confidence: null,
      feedback: "",
      note: "",
    },
    {
      id: "20203",
      name: "박지호",
      text:
        "환경 보호는 중요하다. 사람들이 쓰레기를 버리면 안 좋다. 그래서 우리는 조심해야 한다. 앞으로 깨끗하게 생활하면 좋겠다.",
      status: "pending",
      scores: {},
      aiScore: null,
      teacherScore: null,
      confidence: null,
      feedback: "",
      note: "",
    },
  ],
  currentIndex: 0,
  testFeedback: [],
};

let state = loadState();

const FILE_LIMITS = {
  textBytes: 256 * 1024,
  pdfBytes: 5 * 1024 * 1024,
  pdfPages: 25,
  extractedChars: 100_000,
};

const els = {
  assessmentTitle: document.querySelector("#assessmentTitle"),
  assessmentSubject: document.querySelector("#assessmentSubject"),
  assessmentMax: document.querySelector("#assessmentMax"),
  assessmentPrompt: document.querySelector("#assessmentPrompt"),
  rubricList: document.querySelector("#rubricList"),
  submissionList: document.querySelector("#submissionList"),
  currentStudentId: document.querySelector("#currentStudentId"),
  currentStudentName: document.querySelector("#currentStudentName"),
  currentState: document.querySelector("#currentState"),
  currentSubmissionText: document.querySelector("#currentSubmissionText"),
  currentScore: document.querySelector("#currentScore"),
  currentConfidence: document.querySelector("#currentConfidence"),
  criterionScores: document.querySelector("#criterionScores"),
  teacherScore: document.querySelector("#teacherScore"),
  feedbackText: document.querySelector("#feedbackText"),
  teacherNote: document.querySelector("#teacherNote"),
  metricSubmissions: document.querySelector("#metricSubmissions"),
  metricPending: document.querySelector("#metricPending"),
  metricApproved: document.querySelector("#metricApproved"),
  metricAverage: document.querySelector("#metricAverage"),
  distribution: document.querySelector("#distribution"),
  resultRows: document.querySelector("#resultRows"),
  feedbackForm: document.querySelector("#feedbackForm"),
  feedbackList: document.querySelector("#feedbackList"),
  toast: document.querySelector("#toast"),
};

document.querySelector("#runEvaluation").addEventListener("click", runEvaluation);
document.querySelector("#resetDemo").addEventListener("click", resetDemo);
document.querySelector("#addCriterion").addEventListener("click", addCriterion);
document.querySelector("#addSubmission").addEventListener("click", addSubmission);
document.querySelector("#prevStudent").addEventListener("click", () => moveStudent(-1));
document.querySelector("#nextStudent").addEventListener("click", () => moveStudent(1));
document.querySelector("#saveReview").addEventListener("click", saveReview);
document.querySelector("#approveReview").addEventListener("click", approveReview);
document.querySelector("#exportCsv").addEventListener("click", exportCsv);
document.querySelector("#exportFeedback").addEventListener("click", exportFeedback);
els.feedbackForm.addEventListener("submit", saveTestFeedback);

[
  els.assessmentTitle,
  els.assessmentSubject,
  els.assessmentMax,
  els.assessmentPrompt,
].forEach((el) => el.addEventListener("input", updateAssessment));

function loadState() {
  const raw = window.localStorage.getItem("auto1-state");
  if (!raw) return structuredClone(defaultState);

  try {
    return {
      ...structuredClone(defaultState),
      ...JSON.parse(raw),
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    window.localStorage.setItem("auto1-state", JSON.stringify(state));
  } catch (error) {
    if (error.name === "QuotaExceededError") {
      showToast("저장 공간이 부족합니다. 긴 제출물을 줄이거나 일부 데이터를 정리하세요.");
      return false;
    }
    throw error;
  }
  return true;
}

function updateAssessment() {
  state.assessment.title = els.assessmentTitle.value;
  state.assessment.subject = els.assessmentSubject.value;
  state.assessment.maxScore = Number(els.assessmentMax.value || 20);
  state.assessment.prompt = els.assessmentPrompt.value;
  saveState();
  renderMetrics();
}

function addCriterion() {
  state.rubric.push({
    id: `criterion-${Date.now()}`,
    name: "새 평가 기준",
    points: 3,
    hints: "핵심어",
  });
  saveState();
  render();
}

function addSubmission() {
  state.submissions.push({
    id: `${20200 + state.submissions.length + 1}`,
    name: "새 학생",
    text: "",
    status: "pending",
    scores: {},
    aiScore: null,
    teacherScore: null,
    confidence: null,
    feedback: "",
    note: "",
  });
  state.currentIndex = state.submissions.length - 1;
  saveState();
  render();
}

function resetDemo() {
  const existingFeedback = state.testFeedback || [];
  state = structuredClone(defaultState);
  state.testFeedback = existingFeedback;
  saveState();
  render();
  showToast("샘플 데이터가 복원되었습니다.");
}

function getCurrentSubmission() {
  return state.submissions[state.currentIndex] || state.submissions[0];
}

function moveStudent(direction) {
  const total = state.submissions.length;
  state.currentIndex = (state.currentIndex + direction + total) % total;
  saveState();
  render();
}

function runEvaluation() {
  updateAssessment();
  state.submissions = state.submissions.map((submission) => evaluateSubmission(submission));
  const skipped = state.submissions.filter((submission) => submission.status === "pending").length;
  state.currentIndex = state.submissions.findIndex((item) => item.status !== "approved");
  if (state.currentIndex < 0) state.currentIndex = 0;
  saveState();
  render();
  showToast(
    skipped
      ? `자동 평가가 완료되었습니다. 입력이 없는 ${skipped}명은 평가하지 않았습니다.`
      : "자동 평가가 완료되었습니다. 교사 검토가 필요합니다.",
  );
}

function evaluateSubmission(submission) {
  const text = (submission.text || "").trim();
  if (!text) {
    return {
      ...submission,
      status: "pending",
      scores: {},
      aiScore: null,
      teacherScore: null,
      confidence: null,
      feedback: "",
    };
  }

  const words = tokenize(text);
  const scores = {};
  let total = 0;
  let evidenceHits = 0;

  for (const criterion of state.rubric) {
    const hints = criterion.hints
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const hits = hints.filter((hint) => text.includes(hint));
    const lengthFactor = Math.min(1, words.length / 70);
    const hitFactor = hints.length ? hits.length / hints.length : 0.4;
    const raw = criterion.points * Math.min(1, 0.35 + hitFactor * 0.5 + lengthFactor * 0.3);
    const score = Math.max(1, Math.round(raw));

    evidenceHits += hits.length;
    total += score;
    scores[criterion.id] = {
      score,
      evidence: pickEvidence(text, hits[0] || hints[0] || ""),
      hits,
    };
  }

  const maxRubric = state.rubric.reduce((sum, criterion) => sum + Number(criterion.points), 0);
  const scaled = maxRubric
    ? Math.round((total / maxRubric) * Number(state.assessment.maxScore || maxRubric))
    : total;
  const confidence = Math.min(96, Math.max(52, 58 + evidenceHits * 6 + Math.min(words.length, 90) / 3));

  return {
    ...submission,
    scores,
    aiScore: scaled,
    teacherScore: submission.teacherScore ?? scaled,
    confidence: Math.round(confidence),
    feedback: buildFeedback(scaled, confidence, words.length),
    status: "review",
  };
}

function tokenize(text) {
  return text
    .replace(/[^\wㄱ-ㅎ가-힣\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function pickEvidence(text, hint) {
  if (!text) return "제출문이 비어 있습니다.";
  if (!hint || !text.includes(hint)) return text.slice(0, 80);
  const index = text.indexOf(hint);
  const start = Math.max(0, index - 28);
  const end = Math.min(text.length, index + hint.length + 52);
  return text.slice(start, end);
}

function buildFeedback(score, confidence, wordCount) {
  const max = Number(state.assessment.maxScore || 20);
  const ratio = score / max;
  const parts = [];

  if (ratio >= 0.82) {
    parts.push("주장과 근거가 비교적 분명하며 과제 요구를 잘 반영했습니다.");
  } else if (ratio >= 0.62) {
    parts.push("핵심 주장은 드러나지만 근거의 구체성과 글의 연결을 보완하면 좋겠습니다.");
  } else {
    parts.push("주장, 근거, 구성 요소를 더 명확히 드러낼 필요가 있습니다.");
  }

  if (wordCount < 45) {
    parts.push("분량이 짧아 평가 근거가 제한적입니다.");
  }

  if (confidence < 70) {
    parts.push("자동 평가 신뢰도가 낮으므로 교사 확인이 필요합니다.");
  }

  return parts.join(" ");
}

function saveReview() {
  const current = getCurrentSubmission();
  current.teacherScore = Number(els.teacherScore.value || 0);
  current.feedback = els.feedbackText.value;
  current.note = els.teacherNote.value;
  if (current.status === "approved") current.status = "review";
  saveState();
  render();
  showToast("검토 내용이 저장되었습니다.");
}

function approveReview() {
  saveReview();
  const current = getCurrentSubmission();
  current.status = "approved";
  saveState();
  render();
  showToast(`${current.name} 결과가 승인되었습니다.`);
}

function exportCsv() {
  const rows = [
    ["student_id", "name", "status", "ai_score", "teacher_score", "confidence", "feedback"],
    ...state.submissions.map((item) => [
      item.id,
      item.name,
      item.status,
      item.aiScore ?? "",
      item.teacherScore ?? "",
      item.confidence ?? "",
      item.feedback,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "auto1-assessment-results.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV 파일을 생성했습니다.");
}

function saveTestFeedback(event) {
  event.preventDefault();
  const formData = new FormData(els.feedbackForm);
  const feedback = {
    id: `feedback-${Date.now()}`,
    createdAt: new Date().toISOString(),
    startClarity: formData.get("startClarity"),
    trust: formData.get("trust"),
    usefulness: formData.get("usefulness"),
    confusingPoint: String(formData.get("confusingPoint") || "").trim(),
    neededFeature: String(formData.get("neededFeature") || "").trim(),
  };

  state.testFeedback = [feedback, ...(state.testFeedback || [])];
  saveState();
  els.feedbackForm.reset();
  renderFeedback();
  showToast("사용자 테스트 피드백을 저장했습니다.");
}

function exportFeedback() {
  const payload = {
    assessment: state.assessment.title,
    exportedAt: new Date().toISOString(),
    feedback: state.testFeedback || [],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "auto1-user-test-feedback.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("피드백 JSON 파일을 생성했습니다.");
}

function render() {
  renderAssessment();
  renderRubric();
  renderSubmissions();
  renderReview();
  renderMetrics();
  renderReport();
  renderFeedback();
}

function renderAssessment() {
  els.assessmentTitle.value = state.assessment.title;
  els.assessmentSubject.value = state.assessment.subject;
  els.assessmentMax.value = state.assessment.maxScore;
  els.assessmentPrompt.value = state.assessment.prompt;
  document.querySelector("h1").textContent = state.assessment.title;
  document.querySelector(".eyebrow").textContent = `${state.assessment.subject} · 프로젝트형 수행평가`;
}

function renderRubric() {
  els.rubricList.innerHTML = "";
  state.rubric.forEach((criterion, index) => {
    const item = document.createElement("div");
    item.className = "criterion-item";
    item.innerHTML = `
      <div class="criterion-grid">
        <label>기준명
          <input value="${escapeHtml(criterion.name)}" data-field="name" data-index="${index}" />
        </label>
        <label>배점
          <input type="number" min="1" value="${criterion.points}" data-field="points" data-index="${index}" />
        </label>
      </div>
      <label>핵심 단서
        <input value="${escapeHtml(criterion.hints)}" data-field="hints" data-index="${index}" />
      </label>
    `;
    item.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", updateCriterion);
    });
    els.rubricList.appendChild(item);
  });
}

function updateCriterion(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.field;
  state.rubric[index][field] = field === "points" ? Number(event.target.value || 1) : event.target.value;
  saveState();
}

function renderSubmissions() {
  els.submissionList.innerHTML = "";
  state.submissions.forEach((submission, index) => {
    const hasText = submission.text.trim().length > 0;
    const item = document.createElement("div");
    item.className = "submission-item";
    item.innerHTML = `
      <div class="submission-title">
        <div class="submission-id-name">
          <input value="${escapeHtml(submission.name)}" data-index="${index}" data-field="name" aria-label="이름" />
          <input value="${escapeHtml(submission.id)}" data-index="${index}" data-field="id" aria-label="학생 ID" />
        </div>
        <span class="input-status ${hasText ? "filled" : "empty"}">${hasText ? "입력 완료" : "입력 필요"}</span>
      </div>
      <textarea data-index="${index}" data-field="text" aria-label="제출 내용" placeholder="학생이 작성한 수행평가 답안을 붙여넣거나 입력하세요">${escapeHtml(submission.text)}</textarea>
      <div class="file-upload-row">
        <label class="ghost-button compact file-upload-label">
          파일로 불러오기
          <input type="file" accept=".txt,.pdf" data-index="${index}" class="file-input" />
        </label>
        <span class="file-status" aria-live="polite"></span>
      </div>
      <button type="button" data-select="${index}" class="ghost-button compact">검토로 이동 →</button>
    `;
    item.querySelector("[data-select]").addEventListener("click", () => {
      state.currentIndex = index;
      saveState();
      render();
    });
    item.querySelectorAll("input, textarea").forEach((input) => {
      if (input.type === "file") return;
      input.addEventListener("input", updateSubmissionMeta);
    });
    item.querySelector(".file-input").addEventListener("change", handleFileUpload);
    els.submissionList.appendChild(item);
  });
}

function updateSubmissionMeta(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.field;
  const submission = state.submissions[index];

  if (field === "text") {
    setSubmissionText(submission, event.target.value);
    updateInputStatusBadge(event.target.closest(".submission-item"), submission.text);
  } else {
    submission[field] = event.target.value;
  }

  saveState();
  renderReview();
  renderMetrics();
  renderReport();
}

function resetEvaluation(submission) {
  submission.status = "pending";
  submission.aiScore = null;
  submission.teacherScore = null;
  submission.confidence = null;
  submission.scores = {};
  submission.feedback = "";
  submission.note = "";
}

function setSubmissionText(submission, text) {
  submission.text = truncateText(text);
  resetEvaluation(submission);
}

function updateInputStatusBadge(item, text) {
  const statusEl = item?.querySelector(".input-status");
  if (!statusEl) return;
  const hasText = text.trim().length > 0;
  statusEl.textContent = hasText ? "입력 완료" : "입력 필요";
  statusEl.className = `input-status ${hasText ? "filled" : "empty"}`;
}

function validateFileSize(file, isPdf) {
  const limit = isPdf ? FILE_LIMITS.pdfBytes : FILE_LIMITS.textBytes;
  if (file.size > limit) {
    throw new Error(`파일 크기는 최대 ${formatBytes(limit)}까지만 처리할 수 있습니다.`);
  }
}

const APP_SCRIPT_URL = document.currentScript?.src ?? "./app.js";
const PDFJS_URL = new URL("./vendor/pdfjs/pdf.min.mjs", APP_SCRIPT_URL).href;
const PDFJS_WORKER_URL = new URL("./vendor/pdfjs/pdf.worker.min.mjs", APP_SCRIPT_URL).href;

let pdfjsLibPromise = null;

function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import(PDFJS_URL).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return lib;
    });
  }
  return pdfjsLibPromise;
}

async function extractPdfText(file) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageCount = Math.min(pdf.numPages, FILE_LIMITS.pdfPages);
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((textItem) => textItem.str).join(" "));
  }
  const text = pageTexts.join("\n").trim();
  return pdf.numPages > pageCount
    ? `${text}\n\n[참고: 전체 ${pdf.numPages}쪽 중 처음 ${pageCount}쪽만 추출했습니다.]`
    : text;
}

function truncateText(text) {
  return text.length > FILE_LIMITS.extractedChars
    ? text.slice(0, FILE_LIMITS.extractedChars)
    : text;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${Number(value.toFixed(1))} ${units[unitIndex]}`;
}

async function handleFileUpload(event) {
  const fileInput = event.target;
  const index = Number(fileInput.dataset.index);
  const file = fileInput.files[0];
  if (!file) return;

  const item = fileInput.closest(".submission-item");
  const statusEl = item?.querySelector(".file-status");
  const setStatus = (message, tone) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `file-status ${tone}`;
  };

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isText = file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt");

  if (!isPdf && !isText) {
    setStatus("지원하지 않는 파일 형식입니다. .txt 또는 .pdf 파일만 가능합니다.", "error");
    fileInput.value = "";
    return;
  }

  setStatus(`"${file.name}" 처리 중...`, "busy");

  try {
    validateFileSize(file, isPdf);
    const text = isPdf ? await extractPdfText(file) : await file.text();

    if (!text.trim()) {
      setStatus(
        `"${file.name}"에서 텍스트를 찾지 못했습니다. 스캔본/손글씨 문서는 아직 지원하지 않습니다.`,
        "error",
      );
      return;
    }

    const submission = state.submissions[index];
    setSubmissionText(submission, text);

    const textarea = item?.querySelector('textarea[data-field="text"]');
    if (textarea) textarea.value = submission.text;
    updateInputStatusBadge(item, submission.text);

    const saved = saveState();
    renderReview();
    renderMetrics();
    renderReport();
    setStatus(
      saved
        ? `"${file.name}"에서 텍스트를 불러왔습니다.`
        : `"${file.name}" 텍스트를 화면에 불러왔지만 저장 공간이 부족합니다.`,
      saved ? "success" : "error",
    );
  } catch (error) {
    setStatus(`파일을 읽는 중 오류가 발생했습니다: ${error.message}`, "error");
  } finally {
    fileInput.value = "";
  }
}

function renderReview() {
  const current = getCurrentSubmission();
  if (!current) return;

  els.currentStudentId.textContent = current.id;
  els.currentStudentName.textContent = current.name;
  els.currentSubmissionText.textContent = current.text || "아직 입력된 제출물이 없습니다.";
  els.currentState.textContent = statusLabel(current.status);
  els.currentState.className = `state-chip ${current.status === "approved" ? "approved" : current.status === "review" ? "review" : "pending"}`;
  els.currentScore.textContent = current.aiScore === null ? "-" : `${current.aiScore}/${state.assessment.maxScore}`;
  els.currentConfidence.textContent =
    current.confidence === null ? "신뢰도 -" : `신뢰도 ${current.confidence}%`;
  els.teacherScore.value = current.teacherScore ?? "";
  els.feedbackText.value = current.feedback || "";
  els.teacherNote.value = current.note || "";

  els.criterionScores.innerHTML = "";
  state.rubric.forEach((criterion) => {
    const score = current.scores?.[criterion.id];
    const div = document.createElement("div");
    div.className = "criterion-score";
    div.innerHTML = `
      <header>
        <span>${escapeHtml(criterion.name)}</span>
        <span>${score ? score.score : "-"} / ${criterion.points}</span>
      </header>
      <div class="evidence">${escapeHtml(score?.evidence || "아직 평가 전입니다.")}</div>
    `;
    els.criterionScores.appendChild(div);
  });
}

function renderMetrics() {
  const total = state.submissions.length;
  const filled = state.submissions.filter((item) => item.text.trim().length > 0).length;
  const approved = state.submissions.filter((item) => item.status === "approved").length;
  const pending = state.submissions.filter((item) => item.status !== "approved").length;
  const scored = state.submissions.filter((item) => item.teacherScore !== null);
  const average = scored.length
    ? (scored.reduce((sum, item) => sum + Number(item.teacherScore), 0) / scored.length).toFixed(1)
    : "-";

  els.metricSubmissions.textContent = `${filled}/${total}`;
  els.metricPending.textContent = pending;
  els.metricApproved.textContent = approved;
  els.metricAverage.textContent = average;
}

function renderReport() {
  const buckets = [
    { label: "상", min: 0.8, count: 0 },
    { label: "중", min: 0.55, count: 0 },
    { label: "하", min: 0, count: 0 },
  ];
  const maxScore = Number(state.assessment.maxScore || 20);

  state.submissions.forEach((item) => {
    if (item.teacherScore === null) return;
    const ratio = item.teacherScore / maxScore;
    const bucket = buckets.find((candidate) => ratio >= candidate.min);
    if (bucket) bucket.count += 1;
  });

  els.distribution.innerHTML = "";
  buckets.forEach((bucket) => {
    const percent = state.submissions.length ? (bucket.count / state.submissions.length) * 100 : 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span>${bucket.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${percent}%"></div></div>
      <strong>${bucket.count}</strong>
    `;
    els.distribution.appendChild(row);
  });

  els.resultRows.innerHTML = "";
  state.submissions.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${statusLabel(item.status)}</td>
      <td>${item.aiScore ?? "-"}</td>
      <td>${item.teacherScore ?? "-"}</td>
    `;
    els.resultRows.appendChild(row);
  });
}

function renderFeedback() {
  const feedbackItems = state.testFeedback || [];
  els.feedbackList.innerHTML = "";

  if (feedbackItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "feedback-item";
    empty.textContent = "아직 저장된 사용자 테스트 피드백이 없습니다.";
    els.feedbackList.appendChild(empty);
    return;
  }

  feedbackItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "feedback-item";
    div.innerHTML = `
      <header>
        <span>응답 ${feedbackItems.length - index}</span>
        <time>${formatDateTime(item.createdAt)}</time>
      </header>
      <dl>
        <dt>시작 이해</dt>
        <dd>${escapeHtml(item.startClarity)}</dd>
        <dt>AI 신뢰</dt>
        <dd>${escapeHtml(item.trust)}</dd>
        <dt>업무 도움</dt>
        <dd>${escapeHtml(item.usefulness)}</dd>
        <dt>막힌 부분</dt>
        <dd>${escapeHtml(item.confusingPoint || "없음")}</dd>
        <dt>필요 기능</dt>
        <dd>${escapeHtml(item.neededFeature || "없음")}</dd>
      </dl>
    `;
    els.feedbackList.appendChild(div);
  });
}

function statusLabel(status) {
  return {
    pending: "대기",
    review: "검토",
    approved: "승인",
  }[status] || "대기";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

render();
