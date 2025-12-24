# Daily AI News Viewer 🚀

이 프로젝트는 매일 업데이트되는 AI 논문, 뉴스레터, 프로덕트 소식을 보다 쾌적하게 읽을 수 있도록 React로 제작된 웹 뷰어입니다.

---

## 🛠 설치 및 시작하기 (Setup)

저장소를 클론한 후, 다음 단계에 따라 의존성을 설치하고 실행하세요.

### 1. 의존성 설치

**루트 폴더(서버) 설정:**

```bash
npm install
```

**클라이언트(React) 설정:**

```bash
cd client
npm install
cd ..
```

### 2. 프로젝트 빌드하기

React 소스 코드를 서버가 인식할 수 있는 정적 파일로 변환해야 합니다.

```bash
cd client
npm run build
cd ..
```

### 3. 서버 실행하기

서버가 실행되면 브라우저에서 바로 확인할 수 있습니다.

```bash
node server.js
```

- 실행 주소: [http://localhost:3000](http://localhost:3000)

---

## 🔄 데이터 업데이트 (Sync with Upstream)

이 프로젝트는 원본 저장소([GENEXIS-AI/DailyNews](https://github.com/GENEXIS-AI/DailyNews))로부터 최신 데이터를 가져오도록 설정되어 있습니다.

### 최신 데이터 가져오기

원본 저장소의 새로운 뉴스 파일들만 쏙쏙 가져오려면 다음 명령어를 사용하세요.

```bash
git pull upstream main
```

---

## 📂 프로젝트 구조

- `client/`: React 기반의 프론트엔드 소스 코드
- `server.js`: API 및 정적 파일 제공을 위한 Express 서버
- `논문/`, `뉴스레터/`, `프로덕트/`: 마크다운 뉴스 데이터 폴더
- `오디오/`: 관련 오디오 및 이미지 자산 (용량 문제로 .gitignore에 포함됨)
