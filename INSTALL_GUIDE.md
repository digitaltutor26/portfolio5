# Auto1 수행평가 평가 시스템 — Windows 11 사용 가이드

두 가지 방법 중 목적에 맞게 선택하세요.

| 방법 | 설치 필요 | AI 평가 | PDF 업로드 | 추천 대상 |
|------|-----------|---------|-----------|---------|
| **A. 브라우저만 사용** | 불필요 | ❌ | ✅ | UI 확인, 피드백 수집 |
| **B. 로컬 실행** | Node.js + Ollama | ✅ | ✅ | AI 채점 포함 전체 기능 |

---

## 방법 A — 브라우저만으로 사용 (설치 없음)

### 1. 브라우저 열기

Chrome, Edge, Firefox 중 아무거나 실행합니다.

### 2. 주소창에 입력

```
https://digitaltutor26.github.io/portfolio5/
```

Enter 를 누르면 바로 사용 가능합니다. 인터넷 연결만 있으면 됩니다.

### 사용 가능한 기능

- 루브릭 작성 및 편집 (기준 추가/삭제)
- 학생 제출물 직접 입력
- 파일 업로드 (.txt / .pdf)
- 교사 수동 채점 및 피드백 입력
- 승인 처리 및 학급 리포트
- CSV 내보내기

> AI 자동 평가 기능은 각 PC에 Ollama가 설치되어 있어야 합니다. (방법 B 참고)

---

## 방법 B — 로컬 실행 (AI 평가 포함)

### 사전 설치 항목

| 항목 | 용도 | 용량 |
|------|------|------|
| Ollama | AI 평가 엔진 | 약 50MB |
| AI 모델 | 실제 채점 수행 | 약 2~3GB |
| 서버 실행 환경 | 앱 로컬 서버 | Python 또는 Node.js |

---

### 1단계: Ollama 설치

1. 브라우저에서 `https://ollama.com` 접속
2. **Download for Windows** 버튼 클릭
3. 다운로드된 `OllamaSetup.exe` 실행 → 설치 진행
4. 설치 완료 후 시스템 트레이(우측 하단)에 Ollama 아이콘 확인

> Ollama는 설치 후 자동으로 백그라운드에서 실행됩니다.

---

### 2단계: AI 모델 다운로드

명령 프롬프트(cmd)를 열고 실행합니다.

```
ollama pull gemma3:4b
```

약 **3GB** 다운로드, 완료 메시지가 나오면 성공입니다.

#### 대안 모델 (PC 사양에 따라 선택)

| 모델 | 명령 | 크기 | 필요 RAM | 비고 |
|------|------|------|---------|------|
| gemma3:4b | `ollama pull gemma3:4b` | 3GB | 8GB | 권장 |
| llama3.2 | `ollama pull llama3.2` | 2GB | 8GB | 빠른 테스트용 |
| gemma3:12b | `ollama pull gemma3:12b` | 8GB | 16GB | 고품질, 느림 |

> RAM 8GB 미만이면 `llama3.2` 를 권장합니다.

설치된 모델 확인:
```
ollama list
```

---

### 3단계: 앱 파일 받기

#### GitHub에서 ZIP 다운로드

1. 브라우저에서 `https://github.com/digitaltutor26/portfolio5` 접속
2. 초록색 **Code** 버튼 클릭
3. **Download ZIP** 클릭
4. 다운로드된 `portfolio5-main.zip` 압축 해제
5. 압축 해제된 폴더 안에 `app` 폴더가 있는지 확인

---

### 4단계: 앱 서버 실행

앱을 실행하려면 로컬 서버가 필요합니다. **Python 방법**과 **Node.js 방법** 중 하나를 선택하세요.

---

#### 방법 B-1: Python으로 서버 실행 (학교 네트워크 환경 권장)

Python은 인터넷 연결 없이 서버를 바로 실행할 수 있어 학교 망 환경에 적합합니다.

Python 설치 확인:
```
python --version
```

`Python 3.x.x` 가 나오면 사용 가능합니다.

서버 실행 (cmd에서):
```
cd %USERPROFILE%\Downloads\portfolio5-main\app
python -m http.server 3000
```

브라우저에서:
```
http://localhost:3000
```

> `%USERPROFILE%\Downloads\portfolio5-main` 는 압축 해제 위치에 따라 다를 수 있습니다.  
> 정확한 경로 확인: cmd에서 `cd %USERPROFILE%\Downloads` 후 `dir` 명령으로 폴더명 확인

---

#### 방법 B-2: Node.js로 서버 실행

1. 브라우저에서 `https://nodejs.org` 접속
2. **LTS 버전** 다운로드 및 설치
3. 설치 확인:
   ```
   node --version
   ```

서버 실행 (cmd에서):
```
cd %USERPROFILE%\Downloads\portfolio5-main
npx serve app
```

브라우저에서:
```
http://localhost:3000
```

> 첫 실행 시 `serve` 패키지를 자동 설치합니다 (인터넷 필요, 1회만).  
> 학교 네트워크에서 차단될 수 있으므로 이 경우 Python 방법(B-1)을 사용하세요.

---

### 5단계: AI 평가 설정

앱이 열리면 **평가 설정** 패널에서 확인합니다.

- **Ollama 서버 주소**: `http://localhost:11434` (기본값 유지)
- **모델명**: 설치한 모델명 입력 (예: `gemma3:4b` 또는 `llama3.2`)

> 모델명은 `ollama list` 에 나오는 이름과 정확히 일치해야 합니다.

---

### 매번 사용할 때 순서

1. 시스템 트레이에 Ollama 아이콘 확인 (없으면 시작 메뉴에서 Ollama 실행)
2. cmd 열기
3. 서버 실행 명령 입력 (Python 또는 Node.js 방법)
4. 브라우저에서 `http://localhost:3000` 접속

---

## 문제 해결

### 404 오류가 뜰 때

| 상황 | 원인 | 해결 |
|------|------|------|
| 앱에서 AI 평가 실행 시 404 | 모델이 설치 안 됨 | `ollama list` 로 확인 후 `ollama pull 모델명` |
| 앱에서 AI 평가 실행 시 404 | 앱 모델명과 설치 모델명 불일치 | 평가 설정에서 모델명 정확히 입력 |
| `npx serve` 실행 시 오류 | 학교 네트워크 차단 | Python 방법(B-1) 사용 |

### "지정된 경로를 찾을 수 없다" 오류

cd 명령의 경로가 틀린 겁니다. 아래 순서로 정확한 경로를 찾으세요:

```
cd %USERPROFILE%\Downloads
dir
```

목록에서 `portfolio5` 로 시작하는 폴더명을 확인한 뒤:

```
cd portfolio5-main\app
python -m http.server 3000
```

### "Ollama 서버에 연결할 수 없습니다" 오류

- 시스템 트레이에 Ollama 아이콘 확인
- 없으면 시작 메뉴에서 Ollama 검색 후 실행
- cmd에서 `ollama list` 실행해 모델 설치 여부 확인

### PDF 업로드가 안 될 때

`file://` 로 시작하는 주소로 접속 중인 경우입니다.  
반드시 `http://localhost:3000` 으로 접속하세요.

### 포트 3000이 이미 사용 중일 때

```
python -m http.server 3001
```

브라우저에서 `http://localhost:3001` 로 접속합니다.

---

## 빠른 참고

| 작업 | 명령 |
|------|------|
| Python 서버 시작 | `python -m http.server 3000` (app 폴더에서) |
| Node.js 서버 시작 | `npx serve app` (portfolio5-main 폴더에서) |
| 설치된 모델 확인 | `ollama list` |
| 모델 추가 다운로드 | `ollama pull 모델명` |
| Ollama 상태 확인 | `ollama ps` |
| Ollama 대화 테스트 | `ollama run llama3.2` (종료: `/bye`) |

---

> 문의사항은 담당자에게 문의하세요.  
> GitHub Pages 주소: `https://digitaltutor26.github.io/portfolio5/`
