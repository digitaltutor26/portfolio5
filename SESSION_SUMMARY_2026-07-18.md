# 세션 요약 — 2026-07-18

## 이번 세션에서 한 일

### 1. UX 버그 수정 (사용자 테스트 중 발견)
- 루브릭 기준 삭제 버튼 추가
- "검토로 이동" 버튼 클릭 시 검토 패널로 스크롤 연결
- 사용자 피드백 삭제 기능 추가
- PDF 업로드 시 `file://` 환경 오류 메시지 개선

### 2. Ollama AI 평가 연동
- 기존 키워드 매칭 알고리즘 → Ollama LLM 평가로 전면 교체
- 루브릭 `hints` 필드 → `description` (채점 기준 설명)으로 전환
- 평가 설정 패널에 Ollama 서버 주소/모델명 입력 필드 추가
- 교사 최종 판단 구조 유지 (AI 점수는 제안, 교사 승인 필수)
- Windows 설치 가이드 문서 생성 (`INSTALL_GUIDE.md`)

### 3. 코드 리뷰 및 버그 수정
**Claude Code 자체 분석:**
- `runEvaluation` try-finally 누락 수정
- `parseOllamaResult` 마크다운 코드블록 파싱 실패 방어
- 기존 localStorage `hints` 데이터 자동 마이그레이션

**코드 리뷰어 에이전트 분석:**
- CSP `connect-src` 누락으로 Ollama fetch 완전 차단 → 수정 (Critical)
- CSV 수식 인젝션 취약점 수정
- 미승인 점수가 평균/분포에 집계되는 문제 수정

**Codex Harness 2차 검증:**
- 교사 점수 저장/승인 전 유효성 검증 추가
- `runEvaluation` 실행 중 수정 내용 덮어씌움 방지 (스냅샷 사용)
- localStorage 손상 데이터 방어적 정규화
- 회귀 테스트 추가

### 4. GitHub Pages 배포
- GitHub Actions 워크플로 작성 (`deploy.yml`)
- `app/` 폴더를 GitHub Pages로 자동 배포
- 배포 주소: https://digitaltutor26.github.io/portfolio5/

### 5. 문서 정리
- `README.md` 전면 업데이트
- `PROGRESS_2026-07-18.md` 인수인계 문서 작성
- `SESSION_SUMMARY_2026-07-18.md` (이 파일)

---

## 커밋 내역

| 커밋 | 내용 |
|------|------|
| `51304cf` | UX 버그 4건 수정 |
| `f4df738` | Ollama AI 평가 연동 + 설치 가이드 |
| `36ab0a8` | 회귀 테스트 async 대응 |
| `bcf4dc3` | 코드 분석 버그 3건 수정 |
| `c0081b0` | 코드 리뷰 이슈 6건 수정 (CSP Critical 포함) |
| `373ebb5` | Codex Harness 2차 검증 결과 적용 |
| `0f95f26` | GitHub Actions 배포 워크플로 추가 |
| `44835ef` | 진행 현황 인수인계 문서 |

---

## 다음 세션 시작점

1. `PROGRESS_2026-07-18.md` 열어서 전체 현황 파악
2. Windows 11 PC에 Ollama 설치 (`INSTALL_GUIDE.md` 참고)
3. AI 평가 품질 테스트 → 방향 결정
4. GitHub Pages 공유 → 사용자 피드백 수집

---

## 오늘 확인된 주요 사실

- Ollama 소형 모델(4b)은 참고 수준의 채점 품질 (중간 수준 구분 불안정)
- CSP 설정 없이는 브라우저에서 Ollama fetch가 완전 차단됨 (포트가 달라 'self' 불허)
- GitHub Pages는 `/app` 직접 지정 불가 → GitHub Actions로 우회 배포
- Codex Harness는 Claude Code 작업 커밋 후 2차 검증 용도로만 사용 (동시 실행 금지)
