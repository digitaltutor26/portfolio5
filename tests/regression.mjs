import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const appJs = fs.readFileSync("app/app.js", "utf8");
const indexHtml = fs.readFileSync("app/index.html", "utf8");

function createElement() {
  return {
    value: "",
    textContent: "",
    className: "",
    classList: {
      add() {},
      remove() {},
    },
    style: {},
    dataset: {},
    files: [],
    addEventListener() {},
    appendChild() {},
    click() {},
    reset() {},
    closest() {
      return createElement();
    },
    querySelector() {
      return createElement();
    },
    querySelectorAll() {
      return [];
    },
    set innerHTML(value) {
      this._innerHTML = value;
    },
    get innerHTML() {
      return this._innerHTML || "";
    },
  };
}

function loadAppForUnitChecks({ storage: initialStorage = {} } = {}) {
  const storage = new Map(Object.entries(initialStorage));
  const createdElements = [];
  const createdBlobs = [];
  const revokedUrls = [];
  const elements = new Map();
  let fetchHandler = () => {
    throw new Error("Unexpected fetch call");
  };
  const getElement = (selector) => {
    if (!elements.has(selector)) elements.set(selector, createElement());
    return elements.get(selector);
  };
  const context = {
    console,
    structuredClone,
    Blob: class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
        createdBlobs.push(this);
      }
    },
    URL: class AppUrl extends URL {
      static createObjectURL() {
        return "blob:test/object";
      }
      static revokeObjectURL(url) {
        revokedUrls.push(url);
      }
    },
    AbortSignal: {
      timeout() {
        return {};
      },
    },
    FormData: class FormData {
      get() {
        return "";
      }
    },
    Intl,
    Date,
    document: {
      currentScript: { src: "https://example.test/app/app.js" },
      querySelector(selector) {
        return getElement(selector);
      },
      createElement(tagName) {
        const element = createElement();
        element.tagName = tagName;
        createdElements.push(element);
        return element;
      },
    },
    fetch(...args) {
      return fetchHandler(...args);
    },
    window: {
      localStorage: {
        getItem(key) {
          return storage.get(key) || null;
        },
        setItem(key, value) {
          storage.set(key, value);
        },
      },
      setTimeout() {},
    },
  };
  context.globalThis = context;

  const source = appJs.replace(/\nrender\(\);\s*$/, "");
  vm.runInNewContext(
    `${source}
globalThis.__auto1Test = {
  defaultState,
  FILE_LIMITS,
  get state() { return state; },
  set state(value) { state = value; },
  els,
  evaluateSubmission,
  runEvaluation,
  approveReview,
  normalizeState,
  parseTeacherScore,
  validateOllamaUrl,
  setSubmissionText,
  validateFileSize,
  truncateText,
  formatBytes,
  loadState,
  saveState,
  addSubmission,
  approveReview,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
  startBlankTemplate,
  exportTemplates,
  handleTemplateImport,
  resetDemo,
  extractRubricFromPlan,
  parsePlanExtraction,
  handlePlanFileUpload,
  renderMetrics,
  renderReport,
};
`,
    context,
    { filename: "app/app.js" },
  );
  context.__auto1Test.setFetch = (handler) => {
    fetchHandler = handler;
  };
  context.__auto1Test.getElement = getElement;
  context.__auto1Test.storage = storage;
  context.__auto1Test.createdElements = createdElements;
  context.__auto1Test.createdBlobs = createdBlobs;
  context.__auto1Test.revokedUrls = revokedUrls;
  return context.__auto1Test;
}

const unit = loadAppForUnitChecks();

const staleSubmission = {
  id: "1",
  name: "학생",
  text: "old",
  status: "approved",
  scores: { claim: { score: 5 } },
  aiScore: 15,
  teacherScore: 14,
  confidence: 88,
  feedback: "old feedback",
  note: "old note",
};
unit.setSubmissionText(staleSubmission, "new answer");
assert.equal(staleSubmission.text, "new answer");
assert.equal(staleSubmission.status, "pending");
assert.equal(staleSubmission.aiScore, null);
assert.equal(staleSubmission.teacherScore, null);
assert.equal(staleSubmission.confidence, null);
assert.equal(JSON.stringify(staleSubmission.scores), "{}");
assert.equal(staleSubmission.feedback, "");
assert.equal(staleSubmission.note, "");

const blankResult = await unit.evaluateSubmission({
  id: "2",
  name: "빈 제출",
  text: "   \n",
  status: "review",
  scores: { claim: { score: 3 } },
  aiScore: 9,
  teacherScore: 9,
  confidence: 70,
  feedback: "stale",
});
assert.equal(blankResult.status, "pending");
assert.equal(blankResult.aiScore, null);
assert.equal(blankResult.teacherScore, null);
assert.equal(blankResult.confidence, null);
assert.equal(JSON.stringify(blankResult.scores), "{}");
assert.equal(blankResult.feedback, "");

assert.equal(unit.validateOllamaUrl("http://localhost:11434").valid, true);
assert.equal(unit.validateOllamaUrl("http://127.0.0.1:11434").valid, true);
assert.equal(unit.validateOllamaUrl("http://192.168.0.5:11434").valid, false);
assert.equal(unit.validateOllamaUrl("not a url").valid, false);

unit.state = {
  ...unit.state,
  assessment: {
    ...unit.state.assessment,
    maxScore: 20,
  },
};
assert.deepEqual(unit.parseTeacherScore("").value, null);
assert.equal(unit.parseTeacherScore("18").valid, true);
assert.equal(unit.parseTeacherScore("21").valid, false);
assert.equal(unit.parseTeacherScore("abc").valid, false);

unit.state = {
  ...unit.state,
  currentIndex: 0,
  submissions: [
    {
      id: "pending",
      name: "미평가",
      text: "제출",
      status: "pending",
      scores: {},
      aiScore: null,
      teacherScore: null,
      confidence: null,
      feedback: "",
      note: "",
    },
  ],
};
unit.els.teacherScore.value = "";
unit.els.feedbackText.value = "";
unit.els.teacherNote.value = "";
unit.approveReview();
assert.equal(unit.state.submissions[0].status, "pending");
assert.equal(unit.state.submissions[0].teacherScore, null);

const repaired = unit.normalizeState({
  assessment: {
    maxScore: "20",
    ollamaUrl: "http://192.168.0.5:11434",
  },
  rubric: "bad",
  submissions: [
    {
      id: 7,
      name: 8,
      text: "ok",
      status: "approved",
      aiScore: 99,
      teacherScore: "bad",
      scores: null,
    },
  ],
  currentIndex: 99,
  testFeedback: "bad",
});
assert.equal(repaired.assessment.maxScore, 20);
assert.equal(repaired.assessment.ollamaUrl, "http://192.168.0.5:11434");
assert.equal(repaired.rubric.length, unit.defaultState.rubric.length);
assert.equal(repaired.submissions.length, 1);
assert.equal(repaired.submissions[0].status, "pending");
assert.equal(repaired.submissions[0].aiScore, null);
assert.equal(repaired.submissions[0].teacherScore, null);
assert.equal(repaired.currentIndex, 0);
assert.deepEqual(repaired.testFeedback, []);

unit.state = structuredClone(unit.defaultState);
unit.state.submissions = [
  {
    id: "1",
    name: "학생",
    text: "original answer",
    status: "pending",
    scores: {},
    aiScore: null,
    teacherScore: null,
    confidence: null,
    feedback: "",
    note: "",
  },
];
unit.els.assessmentTitle.value = unit.state.assessment.title;
unit.els.assessmentSubject.value = unit.state.assessment.subject;
unit.els.assessmentMax.value = String(unit.state.assessment.maxScore);
unit.els.assessmentPrompt.value = unit.state.assessment.prompt;
unit.els.ollamaUrl.value = "http://localhost:11434";
unit.els.ollamaModel.value = unit.state.assessment.ollamaModel;
let resolveFetch;
let requestedUrl;
const fetchStarted = new Promise((resolve) => {
  unit.setFetch(async (url) => {
    requestedUrl = url;
    resolve();
    await new Promise((fetchResolve) => {
      resolveFetch = fetchResolve;
    });
    return {
      ok: true,
      async json() {
        return {
          response: JSON.stringify({
            scores: {
              claim: { score: 5, reason: "명확함" },
              evidence: { score: 6, reason: "근거 충분" },
              structure: { score: 5, reason: "구성 적절" },
              expression: { score: 4, reason: "표현 정확" },
            },
            confidence: 88,
            feedback: "좋은 답안입니다.",
          }),
        };
      },
    };
  });
});
const evaluation = unit.runEvaluation();
await Promise.race([
  fetchStarted,
  evaluation.then(() => {
    throw new Error(
      `Evaluation finished before the mocked Ollama request started: ${unit.els.toast.textContent}; ${unit.state.submissions[0].feedback}`,
    );
  }),
]);
assert.equal(requestedUrl, "http://localhost:11434/api/generate");
unit.state.submissions[0].text = "edited while evaluation is running";
resolveFetch();
await evaluation;
assert.equal(unit.state.submissions[0].text, "edited while evaluation is running");
assert.equal(unit.state.submissions[0].aiScore, null);
assert.equal(unit.state.submissions[0].status, "pending");

unit.state = structuredClone(unit.defaultState);
unit.state.submissions = [
  {
    id: "teacher-edit",
    name: "학생",
    text: "answer under review",
    status: "pending",
    scores: {},
    aiScore: null,
    teacherScore: null,
    confidence: null,
    feedback: "",
    note: "",
  },
];
unit.els.assessmentTitle.value = unit.state.assessment.title;
unit.els.assessmentSubject.value = unit.state.assessment.subject;
unit.els.assessmentMax.value = String(unit.state.assessment.maxScore);
unit.els.assessmentPrompt.value = unit.state.assessment.prompt;
unit.els.ollamaUrl.value = "http://localhost:11434";
unit.els.ollamaModel.value = unit.state.assessment.ollamaModel;
let resolveTeacherEditFetch;
const teacherEditFetchStarted = new Promise((resolve) => {
  unit.setFetch(async () => {
    resolve();
    await new Promise((fetchResolve) => {
      resolveTeacherEditFetch = fetchResolve;
    });
    return {
      ok: true,
      async json() {
        return {
          response: JSON.stringify({
            scores: {
              claim: { score: 5, reason: "명확함" },
              evidence: { score: 6, reason: "근거 충분" },
              structure: { score: 5, reason: "구성 적절" },
              expression: { score: 4, reason: "표현 정확" },
            },
            confidence: 88,
            feedback: "AI 피드백",
          }),
        };
      },
    };
  });
});
const teacherEditEvaluation = unit.runEvaluation();
await Promise.race([
  teacherEditFetchStarted,
  teacherEditEvaluation.then(() => {
    throw new Error(
      `Evaluation finished before the mocked teacher-edit request started: ${unit.els.toast.textContent}`,
    );
  }),
]);
unit.state.submissions[0].name = "교사가 수정한 이름";
unit.state.submissions[0].teacherScore = 18;
unit.state.submissions[0].feedback = "교사 피드백";
unit.state.submissions[0].note = "교사 메모";
resolveTeacherEditFetch();
await teacherEditEvaluation;
assert.equal(unit.state.submissions[0].name, "교사가 수정한 이름");
assert.equal(unit.state.submissions[0].teacherScore, 18);
assert.equal(unit.state.submissions[0].feedback, "교사 피드백");
assert.equal(unit.state.submissions[0].note, "교사 메모");

assert.throws(
  () => unit.validateFileSize({ size: unit.FILE_LIMITS.textBytes + 1 }, false),
  /파일 크기는 최대 256 KB/,
);
assert.throws(
  () => unit.validateFileSize({ size: unit.FILE_LIMITS.pdfBytes + 1 }, true),
  /파일 크기는 최대 5 MB/,
);
assert.equal(unit.truncateText("x".repeat(unit.FILE_LIMITS.extractedChars + 7)).length, unit.FILE_LIMITS.extractedChars);

assert.match(indexHtml, /Content-Security-Policy/);
assert.match(indexHtml, /script-src 'self'/);
assert.doesNotMatch(appJs, /cdnjs|https:\/\/cdn|http:\/\/(?!localhost)/);

const advertisesPdfUpload = /accept="[^"]*\.pdf/.test(indexHtml) || /endsWith\("\.pdf"\)/.test(appJs);
if (advertisesPdfUpload) {
  assert.ok(
    fs.existsSync("app/vendor/pdfjs/pdf.min.mjs"),
    "PDF upload is advertised, but app/vendor/pdfjs/pdf.min.mjs is missing.",
  );
  assert.ok(
    fs.existsSync("app/vendor/pdfjs/pdf.worker.min.mjs"),
    "PDF upload is advertised, but app/vendor/pdfjs/pdf.worker.min.mjs is missing.",
  );
} else {
  assert.match(indexHtml, /PDF\/손글씨 스캔본 인식은 로컬 PDF 처리 모듈 설치 전까지 지원하지 않습니다/);
  assert.doesNotMatch(indexHtml, /accept="[^"]*\.pdf/);
  assert.doesNotMatch(appJs, /application\/pdf|extractPdfText|pdfjs|pdf\.worker|endsWith\("\\.pdf"\)/);
}

// ---------------------------------------------------------------------------
// Tests for features added since 95d700f: loadState, templates, plan extraction,
// and an end-to-end evaluation flow. Each check() uses a fresh app instance.
// ---------------------------------------------------------------------------
// Objects created inside the vm context have a different realm's prototypes, so compare as plain JSON.
function deepEqual(actual, expected, message) {
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), message);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function check(name, fn) {
  try {
    await fn();
  } catch (error) {
    error.message = `[${name}] ${error.message}`;
    throw error;
  }
}

function jsonResponse(payload) {
  return { ok: true, async json() { return payload; } };
}

function ollamaScores(scores, extra = {}) {
  return jsonResponse({
    response: JSON.stringify({
      scores: Object.fromEntries(
        Object.entries(scores).map(([id, score]) => [id, { score, reason: `${id} 근거` }]),
      ),
      confidence: 80,
      feedback: "AI 피드백",
      ...extra,
    }),
  });
}

function fakeFile(name, content, type = "text/plain") {
  return { name, type, size: Buffer.byteLength(content), async text() { return content; } };
}

function fileEvent(file) {
  return { target: { files: file ? [file] : [], value: "C:\\fakepath\\selected" } };
}

// --- 3. loadState (TDZ regression from 7bbfd0d) ----------------------------
await check("loadState returns saved state instead of demo defaults", () => {
  const saved = {
    assessment: { title: "저장된 과제", subject: "3학년 과학", maxScore: 30, prompt: "p", ollamaUrl: "http://localhost:11434", ollamaModel: "m1" },
    rubric: [{ id: "only", name: "유일한 기준", points: 30, description: "d" }],
    submissions: [{ id: "s-saved", name: "저장된 학생", text: "t", status: "pending", scores: {} }],
    currentIndex: 0,
    testFeedback: [],
    templates: [],
  };
  const app = loadAppForUnitChecks({ storage: { "auto1-state": JSON.stringify(saved) } });
  assert.equal(app.state.assessment.title, "저장된 과제");
  assert.equal(app.state.assessment.maxScore, 30);
  assert.equal(app.state.assessment.ollamaModel, "m1");
  deepEqual(app.state.rubric.map((c) => c.id), ["only"]);
  deepEqual(app.state.submissions.map((s) => s.id), ["s-saved"]);
});

await check("loadState falls back to demo defaults when nothing is saved", () => {
  const app = loadAppForUnitChecks();
  deepEqual(app.state, app.defaultState);
});

await check("loadState returns a copy so mutating state does not corrupt defaults", () => {
  const app = loadAppForUnitChecks();
  assert.notEqual(app.state, app.defaultState);
  app.state.assessment.title = "mutated";
  assert.notEqual(app.defaultState.assessment.title, "mutated");
});

for (const [label, raw] of [
  ["invalid JSON", "{not json"],
  ["empty object string 'null'", "null"],
  ["a JSON string", '"hello"'],
]) {
  await check(`loadState falls back safely for corrupted saved state (${label})`, () => {
    const app = loadAppForUnitChecks({ storage: { "auto1-state": raw } });
    deepEqual(app.state, app.defaultState);
  });
}

await check("loadState repairs bad fields in otherwise valid saved state", () => {
  const app = loadAppForUnitChecks({
    storage: { "auto1-state": JSON.stringify({ assessment: { title: "유지", maxScore: "abc" }, rubric: [], submissions: [], templates: "bad" }) },
  });
  assert.equal(app.state.assessment.title, "유지");
  assert.equal(app.state.assessment.maxScore, app.defaultState.assessment.maxScore);
  assert.equal(app.state.rubric.length, app.defaultState.rubric.length);
  assert.equal(app.state.submissions.length, app.defaultState.submissions.length);
  deepEqual(app.state.templates, []);
});

await check("loadState gives legacy saved state without templates an empty template list", () => {
  const legacy = structuredClone(unit.defaultState);
  delete legacy.templates;
  const app = loadAppForUnitChecks({ storage: { "auto1-state": JSON.stringify(legacy) } });
  deepEqual(app.state.templates, []);
});

await check("saveState output is loaded back by loadState (persistence round trip)", () => {
  const first = loadAppForUnitChecks();
  first.state.assessment.title = "왕복 테스트";
  assert.equal(first.saveState(), true);
  const second = loadAppForUnitChecks({ storage: { "auto1-state": first.storage.get("auto1-state") } });
  assert.equal(second.state.assessment.title, "왕복 테스트");
});

// --- 2. Templates -----------------------------------------------------------
function templateApp() {
  const app = loadAppForUnitChecks();
  app.els.templateName.value = "";
  return app;
}

await check("saveTemplate rejects a blank name and stores nothing", () => {
  const app = templateApp();
  app.els.templateName.value = "   ";
  app.saveTemplate();
  assert.equal(app.state.templates.length, 0);
  assert.match(app.els.toast.textContent, /템플릿 이름을 입력/);
  assert.equal(app.storage.has("auto1-state"), false);
});

await check("saveTemplate snapshots assessment and rubric but not Ollama connection settings", () => {
  const app = templateApp();
  app.state.assessment.ollamaUrl = "http://127.0.0.1:9999";
  app.state.assessment.ollamaModel = "private-model";
  app.els.templateName.value = " 환경 글쓰기 ";
  app.saveTemplate();
  assert.equal(app.state.templates.length, 1);
  const [template] = app.state.templates;
  assert.equal(template.name, "환경 글쓰기");
  deepEqual(Object.keys(template.assessment).sort(), ["maxScore", "prompt", "subject", "title"]);
  deepEqual(template.rubric, app.state.rubric);
  assert.equal(app.els.templateName.value, "");
  assert.doesNotMatch(JSON.stringify(template), /private-model|9999/);
});

await check("saveTemplate persists templates to localStorage", () => {
  const app = templateApp();
  app.els.templateName.value = "저장됨";
  app.saveTemplate();
  const persisted = JSON.parse(app.storage.get("auto1-state"));
  deepEqual(persisted.templates.map((t) => t.name), ["저장됨"]);
  const reloaded = loadAppForUnitChecks({ storage: { "auto1-state": app.storage.get("auto1-state") } });
  deepEqual(reloaded.state.templates.map((t) => t.name), ["저장됨"]);
});

await check("saveTemplate stores a deep copy so later rubric edits do not change the template", () => {
  const app = templateApp();
  app.els.templateName.value = "복사본";
  app.saveTemplate();
  const originalName = app.state.templates[0].rubric[0].name;
  app.state.rubric[0].name = "나중에 바꿈";
  assert.equal(app.state.templates[0].rubric[0].name, originalName);
});

await check("saveTemplate puts the newest template first", () => {
  const app = templateApp();
  for (const name of ["첫째", "둘째"]) {
    app.els.templateName.value = name;
    app.saveTemplate();
  }
  deepEqual(app.state.templates.map((t) => t.name), ["둘째", "첫째"]);
});

await check("renderTemplates lists saved templates in the select", () => {
  const app = templateApp();
  const options = [];
  app.els.templateSelect.appendChild = (option) => options.push(option);
  app.els.templateName.value = "목록 확인";
  app.saveTemplate();
  deepEqual(options.map((o) => o.textContent), ["목록 확인"]);
  assert.equal(options[0].value, app.state.templates[0].id);
});

await check("loadTemplate restores assessment fields and rubric from the selected template", () => {
  const app = templateApp();
  app.els.templateName.value = "원본";
  app.saveTemplate();
  const { id } = app.state.templates[0];
  const original = structuredClone({ ...app.state.assessment, rubric: app.state.rubric });
  app.state.assessment.title = "바뀜";
  app.state.assessment.maxScore = 99;
  app.state.rubric = [{ id: "x", name: "x", points: 1, description: "" }];
  app.els.templateSelect.value = id;
  app.loadTemplate();
  assert.equal(app.state.assessment.title, original.title);
  assert.equal(app.state.assessment.maxScore, original.maxScore);
  deepEqual(app.state.rubric, original.rubric);
  assert.match(app.els.toast.textContent, /불러왔습니다/);
});

await check("loadTemplate keeps Ollama settings and submissions untouched", () => {
  const app = templateApp();
  app.els.templateName.value = "t";
  app.saveTemplate();
  app.state.assessment.ollamaModel = "my-model";
  const submissionIds = app.state.submissions.map((s) => s.id);
  app.els.templateSelect.value = app.state.templates[0].id;
  app.loadTemplate();
  assert.equal(app.state.assessment.ollamaModel, "my-model");
  deepEqual(app.state.submissions.map((s) => s.id), submissionIds);
});

await check("loadTemplate without a selection only shows a prompt toast", () => {
  const app = templateApp();
  const before = structuredClone(app.state);
  app.els.templateSelect.value = "";
  app.loadTemplate();
  assert.match(app.els.toast.textContent, /불러올 템플릿을 선택/);
  deepEqual(app.state, before);
});

await check("loadTemplate does not alias the template rubric into live state", () => {
  const app = templateApp();
  app.els.templateName.value = "t";
  app.saveTemplate();
  app.els.templateSelect.value = app.state.templates[0].id;
  app.loadTemplate();
  app.state.rubric[0].name = "수정";
  assert.notEqual(app.state.templates[0].rubric[0].name, "수정");
});

await check("deleteTemplate removes only the selected template and persists", async () => {
  const app = templateApp();
  for (const name of ["a", "b"]) {
    app.els.templateName.value = name;
    app.saveTemplate();
    await sleep(3); // template ids are Date.now()-based; avoid same-millisecond ids
  }
  const target = app.state.templates.find((t) => t.name === "a");
  app.els.templateSelect.value = target.id;
  app.deleteTemplate();
  deepEqual(app.state.templates.map((t) => t.name), ["b"]);
  deepEqual(JSON.parse(app.storage.get("auto1-state")).templates.map((t) => t.name), ["b"]);
});

await check("deleteTemplate without a selection deletes nothing", () => {
  const app = templateApp();
  app.els.templateName.value = "keep";
  app.saveTemplate();
  app.els.templateSelect.value = "";
  app.deleteTemplate();
  assert.equal(app.state.templates.length, 1);
  assert.match(app.els.toast.textContent, /삭제할 템플릿을 선택/);
});

await check("startBlankTemplate clears assessment text and leaves one empty criterion", () => {
  const app = templateApp();
  app.els.templateName.value = "t";
  app.saveTemplate();
  app.startBlankTemplate();
  assert.equal(app.state.assessment.title, "");
  assert.equal(app.state.assessment.subject, "");
  assert.equal(app.state.assessment.prompt, "");
  assert.equal(app.state.rubric.length, 1);
  assert.equal(app.state.rubric[0].name, "");
  assert.equal(app.state.templates.length, 1);
});

await check("resetDemo keeps saved templates", () => {
  const app = templateApp();
  app.els.templateName.value = "남아야 함";
  app.saveTemplate();
  app.state.assessment.title = "바뀜";
  app.resetDemo();
  assert.equal(app.state.assessment.title, app.defaultState.assessment.title);
  deepEqual(app.state.templates.map((t) => t.name), ["남아야 함"]);
});

await check("exportTemplates with no templates shows a toast and creates no file", () => {
  const app = templateApp();
  app.exportTemplates();
  assert.match(app.els.toast.textContent, /내보낼 템플릿이 없습니다/);
  assert.equal(app.createdBlobs.length, 0);
});

await check("exportTemplates writes a JSON download named auto1-templates.json", () => {
  const app = templateApp();
  app.els.templateName.value = "내보내기";
  app.saveTemplate();
  app.exportTemplates();
  assert.equal(app.createdBlobs.length, 1);
  assert.match(app.createdBlobs[0].options.type, /^application\/json/);
  deepEqual(JSON.parse(app.createdBlobs[0].parts[0]), app.state.templates);
  const link = app.createdElements.find((el) => el.tagName === "a");
  assert.equal(link.download, "auto1-templates.json");
  assert.equal(link.href, "blob:test/object");
  deepEqual(app.revokedUrls, ["blob:test/object"]);
  assert.match(app.els.toast.textContent, /1개를 내보냈습니다/);
});

await check("export then import round-trips templates into another app instance", async () => {
  const source = templateApp();
  source.state.assessment.title = "원본 과제";
  source.state.rubric = [{ id: "r1", name: "기준1", points: 7, description: "상(7점): 좋음" }];
  source.els.templateName.value = "왕복";
  source.saveTemplate();
  source.exportTemplates();
  const exported = source.createdBlobs[0].parts[0];

  const target = templateApp();
  const input = fileEvent(fakeFile("auto1-templates.json", exported, "application/json"));
  await target.handleTemplateImport(input);
  assert.equal(target.state.templates.length, 1);
  const [imported] = target.state.templates;
  assert.equal(imported.name, "왕복");
  assert.equal(imported.assessment.title, "원본 과제");
  deepEqual(imported.rubric, [{ id: "r1", name: "기준1", points: 7, description: "상(7점): 좋음" }]);
  assert.match(app_toast(target), /1개를 가져왔습니다/);
  assert.equal(input.target.value, "");
  deepEqual(JSON.parse(target.storage.get("auto1-state")).templates.map((t) => t.name), ["왕복"]);
});

function app_toast(app) {
  return app.els.toast.textContent;
}

await check("handleTemplateImport assigns fresh ids so imports never collide with existing templates", async () => {
  const app = templateApp();
  app.els.templateName.value = "기존";
  app.saveTemplate();
  const existingId = app.state.templates[0].id;
  const payload = JSON.stringify([{ ...app.state.templates[0] }]);
  await app.handleTemplateImport(fileEvent(fakeFile("t.json", payload)));
  assert.equal(app.state.templates.length, 2);
  assert.equal(new Set(app.state.templates.map((t) => t.id)).size, 2);
  assert.equal(app.state.templates.filter((t) => t.id === existingId).length, 1);
});

await check("handleTemplateImport accepts an object wrapping a templates array", async () => {
  const app = templateApp();
  const payload = JSON.stringify({ templates: [{ name: "래핑", assessment: { title: "T", maxScore: 10 }, rubric: [{ id: "a", name: "A", points: 10 }] }] });
  await app.handleTemplateImport(fileEvent(fakeFile("t.json", payload)));
  deepEqual(app.state.templates.map((t) => t.name), ["래핑"]);
  assert.equal(app.state.templates[0].assessment.maxScore, 10);
});

await check("handleTemplateImport normalizes malformed template fields", async () => {
  const app = templateApp();
  const payload = JSON.stringify([{ name: "", assessment: { maxScore: -5, title: 3 }, rubric: [] }]);
  await app.handleTemplateImport(fileEvent(fakeFile("t.json", payload)));
  const [imported] = app.state.templates;
  assert.equal(imported.name, "템플릿 1");
  assert.equal(imported.assessment.maxScore, app.defaultState.assessment.maxScore);
  assert.equal(imported.assessment.title, app.defaultState.assessment.title);
  assert.equal(imported.rubric.length, app.defaultState.rubric.length);
});

for (const [label, content] of [
  ["not JSON", "this is not json"],
  ["a JSON object without templates", JSON.stringify({ foo: 1 })],
  ["a JSON number", "42"],
]) {
  await check(`handleTemplateImport rejects invalid file (${label}) and keeps existing templates`, async () => {
    const app = templateApp();
    app.els.templateName.value = "기존";
    app.saveTemplate();
    const before = structuredClone(app.state.templates);
    const input = fileEvent(fakeFile("bad.json", content));
    await app.handleTemplateImport(input);
    assert.match(app.els.toast.textContent, /템플릿 파일을 읽는 중 오류/);
    deepEqual(app.state.templates, before);
    assert.equal(input.target.value, "");
  });
}

await check("handleTemplateImport does nothing when no file is chosen", async () => {
  const app = templateApp();
  const input = fileEvent(null);
  await app.handleTemplateImport(input);
  assert.equal(app.state.templates.length, 0);
  assert.equal(app.els.toast.textContent, "");
});

// --- 1. Plan-document rubric extraction -------------------------------------
const PLAN_RESPONSE = {
  criteria: [
    { name: "주제 이해", points: 8, description: "상(8점): 깊음\n중(5점): 보통\n하(2점): 부족" },
    { name: "표현", points: "4", description: "한 줄 기준" },
  ],
};

function planApp(fetchHandler) {
  const app = loadAppForUnitChecks();
  app.fetchCalls = [];
  app.setFetch(async (url, init) => {
    app.fetchCalls.push({ url, init });
    return fetchHandler(url, init);
  });
  app.getElement("#planText").value = "1. 주제 이해 (8점) ...";
  return app;
}

await check("extractRubricFromPlan sends a temperature 0 JSON request to the validated Ollama URL", async () => {
  const app = planApp(() => jsonResponse({ response: JSON.stringify(PLAN_RESPONSE) }));
  app.state.assessment.ollamaModel = "custom:7b";
  app.getElement("#planText").value = "  평가계획서 원문 XYZ  ";
  await app.extractRubricFromPlan();
  assert.equal(app.fetchCalls.length, 1);
  const { url, init } = app.fetchCalls[0];
  assert.equal(url, "http://localhost:11434/api/generate");
  assert.equal(init.method, "POST");
  const body = JSON.parse(init.body);
  assert.equal(body.model, "custom:7b");
  assert.equal(body.format, "json");
  assert.equal(body.stream, false);
  assert.equal(body.options.temperature, 0);
  assert.ok(body.prompt.includes("평가계획서 원문 XYZ"));
  assert.ok(!body.prompt.includes("  평가계획서 원문 XYZ  "), "pasted text should be trimmed");
});

await check("extractRubricFromPlan replaces the rubric with normalized extracted criteria", async () => {
  const app = planApp(() => jsonResponse({ response: JSON.stringify(PLAN_RESPONSE) }));
  await app.extractRubricFromPlan();
  deepEqual(app.state.rubric.map((c) => [c.name, c.points]), [["주제 이해", 8], ["표현", 4]]);
  assert.equal(app.state.rubric[0].description, "상(8점): 깊음\n중(5점): 보통\n하(2점): 부족");
  assert.ok(app.state.rubric.every((c) => c.id.startsWith("plan-")));
  assert.equal(new Set(app.state.rubric.map((c) => c.id)).size, 2);
  assert.match(app.els.toast.textContent, /2개 기준을 추출/);
  deepEqual(JSON.parse(app.storage.get("auto1-state")).rubric.map((c) => c.name), ["주제 이해", "표현"]);
});

await check("extractRubricFromPlan re-enables the button and restores its label after success", async () => {
  const app = planApp(() => jsonResponse({ response: JSON.stringify(PLAN_RESPONSE) }));
  await app.extractRubricFromPlan();
  const button = app.getElement("#extractRubric");
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "루브릭 추출");
});

await check("extractRubricFromPlan accepts model output wrapped in a ```json fence", async () => {
  const fenced = "```json\n" + JSON.stringify(PLAN_RESPONSE) + "\n```";
  const app = planApp(() => jsonResponse({ response: fenced }));
  await app.extractRubricFromPlan();
  assert.equal(app.state.rubric.length, 2);
});

for (const [label, response] of [
  ["non-JSON text", "죄송합니다, 추출할 수 없습니다."],
  ["truncated JSON", '{"criteria": [{"name": "a"'],
]) {
  await check(`extractRubricFromPlan keeps the old rubric on malformed model output (${label})`, async () => {
    const app = planApp(() => jsonResponse({ response }));
    const before = structuredClone(app.state.rubric);
    await app.extractRubricFromPlan();
    deepEqual(app.state.rubric, before);
    assert.match(app.els.toast.textContent, /루브릭 추출 실패: AI 응답을 해석할 수 없습니다/);
    assert.equal(app.getElement("#extractRubric").disabled, false);
  });
}

for (const [label, response] of [
  ["empty criteria array", JSON.stringify({ criteria: [] })],
  ["criteria missing", JSON.stringify({ other: 1 })],
  ["criteria not an array", JSON.stringify({ criteria: "x" })],
  ["only nameless criteria", JSON.stringify({ criteria: [{ points: 5 }, { name: "  ", points: 3 }, null] })],
]) {
  await check(`extractRubricFromPlan reports no criteria found for ${label} and keeps the old rubric`, async () => {
    const app = planApp(() => jsonResponse({ response }));
    const before = structuredClone(app.state.rubric);
    await app.extractRubricFromPlan();
    deepEqual(app.state.rubric, before);
    assert.match(app.els.toast.textContent, /채점 기준을 찾지 못했습니다/);
    assert.equal(app.storage.has("auto1-state"), false);
  });
}

await check("extractRubricFromPlan makes no request when the pasted text is blank", async () => {
  const app = planApp(() => jsonResponse({ response: "{}" }));
  app.getElement("#planText").value = "   \n ";
  await app.extractRubricFromPlan();
  assert.equal(app.fetchCalls.length, 0);
  assert.match(app.els.toast.textContent, /평가계획서 내용을 붙여넣으세요/);
});

await check("extractRubricFromPlan makes no request when the Ollama URL is not local", async () => {
  const app = planApp(() => jsonResponse({ response: "{}" }));
  app.state.assessment.ollamaUrl = "http://192.168.0.5:11434";
  await app.extractRubricFromPlan();
  assert.equal(app.fetchCalls.length, 0);
  assert.equal(app.els.toast.textContent, app.validateOllamaUrl("http://192.168.0.5:11434").message);
});

await check("extractRubricFromPlan surfaces HTTP errors and keeps the old rubric", async () => {
  const app = planApp(() => ({ ok: false, status: 500, async json() { return {}; } }));
  const before = structuredClone(app.state.rubric);
  await app.extractRubricFromPlan();
  deepEqual(app.state.rubric, before);
  assert.match(app.els.toast.textContent, /루브릭 추출 실패: Ollama 서버 오류 \(HTTP 500\)/);
  assert.equal(app.getElement("#extractRubric").disabled, false);
});

await check("extractRubricFromPlan reports an unreachable Ollama server", async () => {
  const app = planApp(() => {
    throw new TypeError("fetch failed");
  });
  await app.extractRubricFromPlan();
  assert.match(app.els.toast.textContent, /Ollama 서버에 연결할 수 없습니다\(http:\/\/localhost:11434\)/);
});

await check("extractRubricFromPlan reports a timeout distinctly", async () => {
  const app = planApp(() => {
    const error = new Error("timeout");
    error.name = "TimeoutError";
    throw error;
  });
  await app.extractRubricFromPlan();
  assert.match(app.els.toast.textContent, /응답 시간 초과/);
});

await check("parsePlanExtraction drops nameless items and falls back to default points for bad numbers", () => {
  const app = loadAppForUnitChecks();
  const rubric = app.parsePlanExtraction(JSON.stringify({ criteria: [{ name: "A", points: "x" }, { points: 4 }, { name: "B", points: 9, description: 5 }] }));
  deepEqual(rubric.map((c) => c.name), ["A", "B"]);
  assert.equal(rubric[0].points, app.defaultState.rubric[0].points);
  assert.equal(rubric[1].points, 9);
});

await check("handlePlanFileUpload loads .txt content into the plan textarea", async () => {
  const app = loadAppForUnitChecks();
  const event = fileEvent(fakeFile("plan.txt", "평가계획 본문", "text/plain"));
  await app.handlePlanFileUpload(event);
  assert.equal(app.getElement("#planText").value, "평가계획 본문");
  assert.match(app.getElement("#planFileStatus").textContent, /plan\.txt.*불러왔습니다/);
  assert.match(app.getElement("#planFileStatus").className, /success/);
  assert.equal(event.target.value, "");
});

await check("handlePlanFileUpload accepts a .txt file even without a MIME type", async () => {
  const app = loadAppForUnitChecks();
  await app.handlePlanFileUpload(fileEvent(fakeFile("PLAN.TXT", "대문자 확장자", "")));
  assert.equal(app.getElement("#planText").value, "대문자 확장자");
});

await check("handlePlanFileUpload rejects unsupported file types without touching the textarea", async () => {
  const app = loadAppForUnitChecks();
  app.getElement("#planText").value = "기존 내용";
  const event = fileEvent(fakeFile("plan.hwp", "x", "application/x-hwp"));
  await app.handlePlanFileUpload(event);
  assert.equal(app.getElement("#planText").value, "기존 내용");
  assert.match(app.getElement("#planFileStatus").textContent, /지원하지 않는 파일 형식/);
  assert.match(app.getElement("#planFileStatus").className, /error/);
  assert.equal(event.target.value, "");
});

await check("handlePlanFileUpload reports empty text files without overwriting the textarea", async () => {
  const app = loadAppForUnitChecks();
  app.getElement("#planText").value = "기존 내용";
  await app.handlePlanFileUpload(fileEvent(fakeFile("empty.txt", "  \n ", "text/plain")));
  assert.equal(app.getElement("#planText").value, "기존 내용");
  assert.match(app.getElement("#planFileStatus").textContent, /텍스트를 찾지 못했습니다/);
});

await check("handlePlanFileUpload rejects files over the text size limit", async () => {
  const app = loadAppForUnitChecks();
  const file = { name: "big.txt", type: "text/plain", size: app.FILE_LIMITS.textBytes + 1, async text() { return "x"; } };
  await app.handlePlanFileUpload(fileEvent(file));
  assert.equal(app.getElement("#planText").value, "");
  assert.match(app.getElement("#planFileStatus").textContent, /파일 크기는 최대 256 KB/);
});

await check("handlePlanFileUpload truncates extracted text to the character limit", async () => {
  const app = loadAppForUnitChecks();
  await app.handlePlanFileUpload(fileEvent(fakeFile("long.txt", "x".repeat(app.FILE_LIMITS.extractedChars + 50))));
  assert.equal(app.getElement("#planText").value.length, app.FILE_LIMITS.extractedChars);
});

await check("handlePlanFileUpload does nothing when no file is chosen", async () => {
  const app = loadAppForUnitChecks();
  await app.handlePlanFileUpload(fileEvent(null));
  assert.equal(app.getElement("#planFileStatus").textContent, "");
});

await check("uploaded plan file text feeds extractRubricFromPlan end to end", async () => {
  const app = planApp(() => jsonResponse({ response: JSON.stringify(PLAN_RESPONSE) }));
  await app.handlePlanFileUpload(fileEvent(fakeFile("plan.txt", "파일에서 읽은 계획서 UNIQUE-MARK")));
  await app.extractRubricFromPlan();
  assert.ok(JSON.parse(app.fetchCalls[0].init.body).prompt.includes("UNIQUE-MARK"));
  assert.equal(app.state.rubric.length, 2);
});

// --- 4. End-to-end: rubric -> submissions -> evaluate -> teacher edit -> approve -> report
await check("end-to-end flow from extracted rubric to approved report aggregation", async () => {
  const app = loadAppForUnitChecks();
  const distribution = [];
  const resultRows = [];
  app.els.distribution.appendChild = (row) => distribution.push(row.innerHTML);
  app.els.resultRows.appendChild = (row) => resultRows.push(row.innerHTML);

  // 1) set rubric via plan extraction
  app.getElement("#planText").value = "계획서";
  app.setFetch(async () =>
    jsonResponse({
      response: JSON.stringify({
        criteria: [
          { name: "내용", points: 12, description: "상(12점): 풍부" },
          { name: "표현", points: 8, description: "상(8점): 정확" },
        ],
      }),
    }),
  );
  await app.extractRubricFromPlan();
  const [contentId, expressionId] = app.state.rubric.map((c) => c.id);
  assert.equal(app.state.rubric.length, 2);

  // 2) replace the demo submissions with two real ones
  app.state.submissions = [];
  app.addSubmission();
  app.addSubmission();
  assert.equal(app.state.submissions.length, 2);
  app.state.submissions[0].name = "민수";
  app.state.submissions[0].text = "민수의 답안";
  app.state.submissions[1].name = "지영";
  app.state.submissions[1].text = "지영의 답안";

  // 3) run evaluation with a fetch mock that scores by student text
  app.els.assessmentTitle.value = app.state.assessment.title;
  app.els.assessmentSubject.value = app.state.assessment.subject;
  app.els.assessmentMax.value = "20";
  app.els.assessmentPrompt.value = app.state.assessment.prompt;
  app.els.ollamaUrl.value = "http://localhost:11434";
  app.els.ollamaModel.value = "gemma3:4b";
  app.setFetch(async (_url, init) => {
    const { prompt } = JSON.parse(init.body);
    return prompt.includes("민수의 답안")
      ? ollamaScores({ [contentId]: 12, [expressionId]: 8 })
      : ollamaScores({ [contentId]: 4, [expressionId]: 4 });
  });
  await app.runEvaluation();
  const [minsu, jiyoung] = app.state.submissions;
  assert.equal(minsu.status, "review");
  assert.equal(minsu.aiScore, 20);
  assert.equal(minsu.teacherScore, 20, "teacher score defaults to the AI score");
  assert.equal(jiyoung.aiScore, 8);
  assert.equal(app.state.currentIndex, 0);

  // 4) teacher edits the first submission and approves it
  app.els.teacherScore.value = "18";
  app.els.feedbackText.value = "교사가 다듬은 피드백";
  app.els.teacherNote.value = "메모";
  app.approveReview();
  assert.equal(minsu.status, "approved");
  assert.equal(minsu.teacherScore, 18);
  assert.equal(minsu.aiScore, 20, "AI score is preserved next to the teacher score");
  assert.equal(minsu.feedback, "교사가 다듬은 피드백");
  assert.equal(minsu.note, "메모");
  assert.equal(jiyoung.status, "review");

  // 5) report aggregation
  distribution.length = 0;
  resultRows.length = 0;
  app.renderMetrics();
  app.renderReport();
  assert.equal(app.els.metricApproved.textContent, 1);
  assert.equal(app.els.metricPending.textContent, 1);
  assert.equal(app.els.metricAverage.textContent, "18.0", "average counts approved submissions only");
  assert.equal(distribution.length, 3);
  const counts = distribution.map((html) => Number(html.match(/<strong>(\d+)<\/strong>/)[1]));
  deepEqual(counts, [1, 0, 1], "18/20 -> 상, 8/20 -> 하");
  assert.equal(resultRows.length, 2);
  assert.match(resultRows[0], /민수[\s\S]*18/);
  assert.match(resultRows[1], /지영/);

  // state survives a reload
  const reloaded = loadAppForUnitChecks({ storage: { "auto1-state": app.storage.get("auto1-state") } });
  assert.equal(reloaded.state.submissions[0].status, "approved");
  assert.equal(reloaded.state.submissions[0].teacherScore, 18);
});

await check("approveReview refuses to approve a submission that was never AI-evaluated", () => {
  const app = loadAppForUnitChecks();
  app.addSubmission();
  app.els.teacherScore.value = "10";
  app.approveReview();
  assert.equal(app.state.submissions[app.state.currentIndex].status, "pending");
  assert.match(app.els.toast.textContent, /AI 평가가 완료된 검토 상태/);
});

console.log("Regression checks passed.");
