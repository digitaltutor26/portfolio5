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

function loadAppForUnitChecks() {
  const storage = new Map();
  const context = {
    console,
    structuredClone,
    Blob: class Blob {},
    URL,
    FormData: class FormData {
      get() {
        return "";
      }
    },
    Intl,
    Date,
    document: {
      currentScript: { src: "https://example.test/app/app.js" },
      querySelector() {
        return createElement();
      },
      createElement,
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
  evaluateSubmission,
  normalizeState,
  parseTeacherScore,
  validateOllamaUrl,
  setSubmissionText,
  validateFileSize,
  truncateText,
  formatBytes,
};
`,
    context,
    { filename: "app/app.js" },
  );
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

console.log("Regression checks passed.");
