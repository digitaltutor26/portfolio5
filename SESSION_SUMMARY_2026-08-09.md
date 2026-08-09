# 세션 요약 — 2026-08-09

## 이번 세션에서 한 일

1. 회귀 버그 수정 (`app/app.js`)
2. Mac 개발 환경에 Ollama 설치
3. gemma3:4b vs llama3.2 AI 채점 품질 비교 테스트
4. 실제 앱(브라우저 + 로컬 Ollama)으로 전체 흐름 E2E 확인

---

## 1. 회귀 버그 수정

`npm test`가 실패하고 있었음. 원인: `runEvaluation`의 "평가 중 수정 감지" 로직이 `id`/`text` 변경만 확인해서, AI 평가가 진행되는 동안 교사가 이름·점수·피드백·메모만 수정하면(원문은 그대로 두고) 감지를 피해가고, 평가가 끝나는 순간 AI 결과 스냅샷 전체로 덮어써져 교사의 수정 내용이 사라지는 문제였음.

`app/app.js` `runEvaluation` 내 변경 감지 조건에 `name`/`teacherScore`/`feedback`/`note`/`status`를 추가해서 수정. `npm test` 통과 확인 후 커밋(`95d700f`).

---

## 2. Ollama 설치 (Mac)

이 저장소가 있는 Mac에는 Homebrew가 없어서, `ollama.com`에서 macOS 앱(zip)을 직접 받아 `/Applications`에 설치. CLI(`ollama`)는 `/usr/local/bin/ollama` 심볼릭 링크로 자동 연결됨. 서버는 `http://localhost:11434`에서 정상 응답.

```sh
curl -fSL https://ollama.com/download/Ollama-darwin.zip -o Ollama-darwin.zip
unzip Ollama-darwin.zip -d Ollama_extracted
cp -R Ollama_extracted/Ollama.app /Applications/
open -a /Applications/Ollama.app
```

`gemma3:4b`(3.3GB), `llama3.2`(2.0GB) 두 모델 다운로드 완료.

---

## 3. AI 평가 품질 비교 (gemma3:4b vs llama3.2)

앱 기본 샘플 제출물 3건(상/중/하 예상 등급)을 실제 앱의 프롬프트·파싱 로직으로 두 모델에 각각 채점시켜 비교.

| 학생 | 예상 등급 | gemma3:4b | llama3.2 |
|---|---|---|---|
| 김민준 | 상 | 12~16/20 | **0/20** (채점 실패) |
| 이서연 | 중 | 10/20 | 12/20 |
| 박지호 | 하 | 6/20 | 11/20 |

**결론: gemma3:4b 채택.** llama3.2는 가장 잘 쓴 글에 0점을 주고 피드백도 비워서 반환하는 채점 실패가 발생했고, 등급 순위가 뒤집혔으며(하 등급 글이 중 등급보다 근거 점수가 높음), 채점 근거 텍스트에 태국어 문자·영어 단어가 섞여 나오는 등 품질이 불안정했음. gemma3:4b는 세 번 모두 등급 순서(상>중>하)를 정확히 맞췄고, 채점 근거도 실제 제출물 내용을 구체적으로 인용해 신뢰할 만했음. 속도는 llama3.2가 2배 빠르지만(~6초 vs ~13~19초) 품질 차이가 훨씬 중요하다고 판단.

→ 외부 API(Claude/GPT) 전환은 현재로선 불필요. 앱 기본값도 이미 `gemma3:4b`.

---

## 4. 브라우저 E2E 확인

`npx serve app/`로 로컬 서버 실행 후, 실제 Chrome 브라우저에서 Ollama(gemma3:4b)와 연동해 전체 플로우 확인:

- 평가 설정 → 자동 평가 실행 → 3명 모두 정상 채점 (CSP로 인한 fetch 차단 없음, 콘솔 에러 없음)
- 리뷰 화면에서 학생별 AI 점수/근거 확인
- 승인 처리 → 리포트 탭에서 점수 분포·학생별 결과 정상 집계 확인

점수는 격리 스크립트 테스트와 대체로 일치(이서연 10, 박지호 6은 완전 동일, 김민준은 12→16으로 약간 변동 — LLM 샘플링 특성상 자연스러운 편차이며 매번 최고 점수를 받는 경향은 유지됨).

---

## 다음 세션 시작점

1. Windows 노트북에서 gemma3:4b로 사용자 테스트 이어가기
2. reviewPolicy UI 기능 연결 (현재 미동작)
3. 교사 체크리스트 모드 검토
4. 학생 ID 중복 방지 (우선순위 낮음)

---

## Windows 설치 가이드 요약 (재확인용)

`INSTALL_GUIDE.md` 방법 B 기준. 모델은 이번 테스트 결과에 따라 `gemma3:4b` 사용 권장(`llama3.2`는 품질 문제로 비권장).

1. `ollama.com` → Download for Windows → 설치
2. `ollama pull gemma3:4b`
3. GitHub `Code` → `Download ZIP` → 압축 해제
4. `cd %USERPROFILE%\Downloads\portfolio5-main\app` → `python -m http.server 3000`
5. 브라우저에서 `http://localhost:3000` 접속 (`file://` 금지 — PDF 업로드 안 됨)
6. 평가 설정에서 Ollama 주소(`http://localhost:11434`)·모델명(`gemma3:4b`) 확인
