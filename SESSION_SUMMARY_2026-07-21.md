# 세션 요약 — 2026-07-21

## 이번 세션에서 한 일

Windows 11 노트북에서 실제 테스트를 진행하며 발생한 문제를 해결하고, 새 PC 설치 가이드를 정비했습니다.

---

## 새 컴퓨터에서 시작하기

### 필수 설치 목록

| 항목 | 다운로드 주소 | 용량 | 비고 |
|------|-------------|------|------|
| Ollama | https://ollama.com | 약 50MB | AI 평가 엔진 |
| AI 모델 | (Ollama 설치 후 명령으로 다운로드) | 2~3GB | 인터넷 필요 |
| Python | https://python.org | 약 25MB | 로컬 서버 실행용 |
| Node.js (선택) | https://nodejs.org | 약 30MB | Python 대안 |

> AI 평가 없이 UI만 사용한다면 설치 불필요. 브라우저에서 아래 주소 접속:  
> `https://digitaltutor26.github.io/portfolio5/`

---

### 설치 순서 및 명령어

#### 1. Ollama 설치 및 실행 확인

```
# 설치 후 cmd에서 실행
ollama --version
```

설치 완료 시 시스템 트레이(우측 하단)에 Ollama 아이콘 확인.

#### 2. AI 모델 다운로드 (1회만)

```
ollama pull gemma3:4b
```

RAM 8GB 미만이거나 빠른 테스트를 원하면:

```
ollama pull llama3.2
```

설치된 모델 확인:

```
ollama list
```

#### 3. 앱 파일 받기

브라우저에서 `https://github.com/digitaltutor26/portfolio5` 접속  
→ 초록색 **Code** 버튼 → **Download ZIP** → 압축 해제

#### 4. 앱 서버 실행

**Python 사용 (권장):**

```
cd %USERPROFILE%\Downloads\portfolio5-main\app
python -m http.server 3000
```

**Node.js 사용:**

```
cd %USERPROFILE%\Downloads\portfolio5-main
npx serve app
```

#### 5. 브라우저 접속

```
http://localhost:3000
```

#### 6. 앱 내 AI 설정 확인

앱 열면 **평가 설정** 패널에서:
- Ollama 서버 주소: `http://localhost:11434` (기본값 유지)
- 모델명: `ollama list` 에 나온 이름과 정확히 일치하게 입력

---

### 매번 사용할 때 순서

```
1. 시스템 트레이에 Ollama 아이콘 확인 (없으면 시작 메뉴에서 Ollama 실행)
2. cmd 열기
3. python -m http.server 3000  (app 폴더에서)
4. 브라우저에서 http://localhost:3000 접속
```

---

### 모델별 비교

| 모델 | 크기 | 필요 RAM | 한국어 품질 | 속도 |
|------|------|---------|-----------|------|
| gemma3:4b | 3GB | 8GB | 권장 | 보통 |
| llama3.2 | 2GB | 8GB | 유사 | 빠름 |
| gemma3:12b | 8GB | 16GB | 최상 | 느림 |

---

## 문서 업데이트

`INSTALL_GUIDE.md` 를 방법 A / B-1 / B-2 세 가지 경로로 전면 개편했습니다.

- **방법 A**: GitHub Pages URL만으로 브라우저 접속 (설치 없음)
- **방법 B-1**: Python `http.server` 로 로컬 실행
- **방법 B-2**: Node.js `npx serve` 로 로컬 실행

---

## 다음 세션 시작점

1. AI 평가 품질 실제 테스트 (학생 글 샘플 입력)
2. gemma3:4b vs llama3.2 채점 품질 비교
3. 결과에 따라 외부 API(Claude/GPT) 전환 여부 결정
4. reviewPolicy UI 기능 연결
5. 교사 체크리스트 모드 검토 (AI 없이 상/중/하 직접 선택)

---

## 참고: 학교 네트워크 환경 제약

학교 망에서 발생한 문제들 (일반 환경에서는 해당 없음):

| 문제 | 원인 | 해결 |
|------|------|------|
| `npx serve` 404 오류 | npm 레지스트리 차단 | Python `http.server` 사용 |
| `ollama pull` 실패 | 외부 다운로드 차단 | 집에서 미리 다운로드 |
| 경로 오류 ("지정된 경로를 찾을 수 없다") | cd 경로 불일치 | `dir` 명령으로 폴더명 확인 후 이동 |
| AI 평가 404 | 앱 모델명과 설치 모델명 불일치 | 평가 설정에서 모델명 정확히 입력 |

경로 확인 방법:

```
cd %USERPROFILE%\Downloads
dir
```

목록에서 `portfolio5` 로 시작하는 폴더명 확인 후 정확히 입력.
