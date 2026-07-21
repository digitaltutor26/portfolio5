# 세션 요약 — 2026-07-21

## 이번 세션에서 한 일

### Windows 11 노트북 테스트 진행 및 문제 해결

이전 세션(2026-07-18)에서 구축한 시스템을 Windows 11 학교 노트북에서 실제 테스트하면서 발생한 문제들을 확인하고 해결 방법을 정리했습니다.

---

## 발생한 문제 및 해결

### 1. 학교 LAN 망에서 npm/npx 차단

**문제**: `npx serve app` 실행 시 404 오류 발생  
**원인**: 학교 네트워크에서 npm 레지스트리 접근 차단  
**해결**: Python `http.server` 로 대체 (외부 인터넷 불필요)

```
cd %USERPROFILE%\Downloads\portfolio5-main\app
python -m http.server 3000
```

### 2. ollama pull 차단 가능성

**문제**: 학교 망에서 `ollama pull gemma3:4b` 다운로드가 막힐 수 있음  
**해결**: 집 또는 외부 네트워크에서 미리 다운로드 후 사용  
**대안**: 먼저 `llama3.2` 로 테스트 (이미 설치된 경우)

### 3. CD 경로 오류 ("지정된 경로를 찾을 수 없다")

**문제**: `cd` 명령에서 폴더 경로가 맞지 않아 오류 발생  
**해결**: `%USERPROFILE%\Downloads` 로 이동 후 `dir` 명령으로 실제 폴더명 확인

### 4. AI 평가 404 오류

**문제**: 앱에서 AI 평가 실행 시 404 반환  
**원인**: 앱 기본 모델명(`gemma3:4b`)이 설치된 모델과 불일치  
**해결**: 평가 설정 패널에서 실제 설치된 모델명으로 변경  

### 5. `ollama run llama3.2` 로 시작한 경우

`ollama run` 은 대화 모드 진입. 앱 서버 실행 전에 종료 필요:
```
/bye
```
`llama3.2` 는 `gemma3:4b` 의 대안으로 사용 가능 (앱 모델명 변경 필요).

---

## 확인된 환경 제약

| 환경 | 제약 | 해결책 |
|------|------|--------|
| 학교 LAN | npm 레지스트리 차단 | Python http.server 사용 |
| 학교 LAN | ollama.com 다운로드 차단 가능성 | 집에서 미리 다운로드 |
| Windows 11 | Python 미설치 가능 | 사전 설치 필요 |

---

## 문서 업데이트

### INSTALL_GUIDE.md 전면 개편

기존 가이드에 없던 내용 추가:

- **방법 A**: GitHub Pages URL만으로 브라우저 접속 (설치 없음)
- **방법 B-1**: Python `http.server` 로 로컬 실행 (학교 네트워크 환경 권장)
- **방법 B-2**: Node.js `npx serve` 로 로컬 실행 (일반 환경)
- 404 오류 원인별 해결표 추가
- 경로 오류 해결 방법 추가
- `ollama run` vs `ollama pull` 차이 명시

---

## 현재 테스트 상태

| 항목 | 상태 |
|------|------|
| GitHub Pages 접속 (방법 A) | 미확인 (학교 망 접근 가능 여부) |
| Python 서버 실행 | Python 설치 확인됨, 경로 안내 완료 |
| Ollama 설치 | 완료 |
| llama3.2 모델 | 설치됨 |
| gemma3:4b 모델 | 다운로드 예정 (학교 망 차단 가능성) |
| AI 평가 실제 테스트 | 미완료 (서버 실행 후 진행 예정) |

---

## 다음 세션 시작점

1. `INSTALL_GUIDE.md` 의 방법 A 또는 B-1 으로 앱 접속
2. `ollama list` 로 설치된 모델 확인
3. AI 평가 품질 실제 테스트 (학생 글 샘플 입력)
4. gemma3:4b vs llama3.2 채점 품질 비교
5. 결과에 따라 외부 API(Claude/GPT) 전환 여부 결정

---

## 관련 파일

- `INSTALL_GUIDE.md` — Windows 설치/실행 가이드 (이번 세션 업데이트)
- `PROGRESS_2026-07-18.md` — 이전 세션 인수인계 문서
- `SESSION_SUMMARY_2026-07-18.md` — 이전 세션 요약
