# Auto1 — 수행평가 AI 평가 보조 도구

AI가 루브릭 기준에 따라 학생 제출물을 1차 채점하고, 교사가 최종 검토·승인하는 교사용 수행평가 보조 도구입니다.

**배포 주소**: https://digitaltutor26.github.io/portfolio5/  
**저장소**: https://github.com/digitaltutor26/portfolio5

---

## 핵심 흐름

1. 평가 설정 (과제명, 학년/과목, 만점)
2. 루브릭 작성 (기준명, 배점, 채점 기준 설명)
3. 학생 제출물 입력 (직접 입력 또는 .txt/.pdf 업로드)
4. AI 자동 평가 실행 (Ollama 로컬 LLM)
5. 교사 검토 — AI 점수·근거 확인 후 수정
6. 승인 처리
7. 학급 리포트 확인 및 CSV 내보내기

---

## 현재 구현 기능

| 기능 | 상태 |
|------|------|
| 평가 설정 (과제명, 학년, 만점) | ✅ |
| 루브릭 기준 추가/수정/삭제 | ✅ |
| 학생 제출물 직접 입력 | ✅ |
| .txt / .pdf 파일 업로드 | ✅ |
| Ollama AI 자동 채점 | ✅ |
| 기준별 점수 및 채점 근거 표시 | ✅ |
| 교사 최종 점수·피드백 저장 | ✅ |
| 승인 처리 | ✅ |
| 학급 점수 분포 리포트 | ✅ |
| CSV 내보내기 | ✅ |
| 사용자 테스트 피드백 수집 | ✅ |
| GitHub Pages 자동 배포 | ✅ |

---

## 실행 방법

### 로컬 실행 (AI 평가 포함)

```sh
# 1. Ollama 설치 및 모델 다운로드 (최초 1회)
ollama pull gemma3:4b

# 2. 앱 서버 시작
npx serve app/

# 3. 브라우저에서 접속
http://localhost:3000
```

> Windows PC 설치 가이드 → `INSTALL_GUIDE.md` 참고

### GitHub Pages (AI 평가 없이 UI만)

```
https://digitaltutor26.github.io/portfolio5/
```

> Ollama 없이도 UI, 루브릭 편집, 피드백 수집은 동작합니다.  
> AI 자동 평가 기능은 로컬에 Ollama가 실행 중이어야 합니다.

---

## AI 평가 구조

```
브라우저 → fetch → Ollama (localhost:11434)
                        ↓ 루브릭 기반 채점
               점수 + 근거 + 피드백 반환
                        ↓
              교사 검토 → 수정 → 승인
```

- **모델 추천**: RAM 8GB → `gemma3:4b` / RAM 16GB → `gemma3:12b`
- **CSP 정책**: `localhost:11434` 및 `127.0.0.1:11434`만 연결 허용
- **교사 권한 우선**: AI 점수는 제안값이며 교사 승인 없이 최종 반영되지 않음

---

## 자동화 하네스

이 저장소에는 두 개의 자동화 하네스가 있습니다.

| 하네스 | 용도 |
|--------|------|
| **Claude Code (OMC)** | 기본 작업 도구. 구현·디버깅·리뷰 |
| **Codex Harness** (`codex_harness/`) | Claude Code 작업 커밋 후 2차 검증 |

```sh
# Codex Harness 2차 검증 실행
node codex_harness/scripts/agent-runner.mjs review-and-refactor "검토 범위"
```

> **주의**: 두 하네스를 같은 워킹트리에서 동시에 실행하지 않습니다.  
> 자세한 정책은 `CLAUDE.md` 참고.

---

## 파일 구조

```
auto1/
├── app/
│   ├── index.html              # 앱 UI
│   ├── app.js                  # 핵심 로직
│   ├── styles.css              # 스타일
│   └── vendor/pdfjs/           # PDF 텍스트 추출
├── codex_harness/
│   ├── .agents/roles/          # 에이전트 역할 정의
│   ├── .agents/workflows/      # 워크플로 정의
│   └── scripts/agent-runner.mjs
├── tests/
│   └── regression.mjs          # 회귀 테스트
├── .github/workflows/
│   └── deploy.yml              # GitHub Pages 자동 배포
├── INSTALL_GUIDE.md            # Windows 설치 가이드
├── PROGRESS_2026-07-18.md      # 세션 진행 현황 및 인수인계
└── CLAUDE.md                   # 하네스 사용 정책
```

---

## 테스트

```sh
npm test
```

---

## 앞으로 진행할 사항

- [ ] Windows 11 PC에서 Ollama 설치 후 AI 평가 품질 실제 테스트
- [ ] GitHub Pages 주소 공유 → 사용자 피드백 수집
- [ ] AI 평가 품질에 따라 외부 API(Claude 등) 전환 여부 결정
- [ ] reviewPolicy UI 기능 연결
- [ ] 교사 체크리스트 모드 (AI 없이 상/중/하 직접 선택) 검토
