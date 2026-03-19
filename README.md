# PoGO Type Helper MVP

포켓몬고 PvP에서 상대 타입을 빠르게 고르고, 내 3마리 중 어떤 포켓몬으로 교체할지 추천해주는 React + TypeScript + Vite + Tailwind 기반 웹 앱입니다.

## 1. MVP 설계서

### 목표
- 내 3마리 팀 정보를 저장하고 불러오기
- 각 포켓몬별로 타입 1~2개, 일반 공격 1개, 스페셜 공격 1~2개 설정
- 상대 타입 1~2개 선택
- 상성표 기준으로 공격/방어 유불리 계산
- 현재 출전 포켓몬의 유불리와 교체 추천 표시

### 핵심 계산 규칙
- 굉장: `1.25`
- 보통: `1.0`
- 별로: `0.8`
- 자속보정(STAB): 포켓몬 타입과 기술 타입이 같으면 `x1.25`
- 이중 약점/반감: 두 타입 배율을 곱해서 처리
  - 예: `1.25 x 1.25 = 1.5625`
  - 예: `0.8 x 0.8 = 0.64`
  - 예: `1.25 x 0.8 = 1.0`

### 추천 로직
- 공격 최고 배율: 빠른 기술과 차지 기술 중 가장 잘 들어가는 기술
- 공격 평균 배율: 선택 기술 전체 평균
- 방어 위험도: 상대가 가진 타입 공격 중 내 포켓몬에게 가장 아픈 쪽
- 최종 점수:

`(최고 공격 배율 x 0.7 + 평균 공격 배율 x 0.3) / 방어 위험도`

최종 점수가 높은 포켓몬일수록 교체 추천 우선순위가 높습니다.

### 저장 기능
- localStorage 기반
- 팀 이름 생성/수정/삭제 가능
- 팀마다 3마리 저장

---

## 2. 화면 mock 구조

### 상단
- 앱 제목
- 새 팀 저장 버튼
- 팀 이름 수정 버튼
- 팀 삭제 버튼

### 좌측 패널
- 저장된 팀 목록
- 팀 카드 선택으로 현재 팀 전환

### 우측 메인
1. 내 팀 3마리 카드
   - 카드 클릭 시 현재 출전 포켓몬 지정
   - 추천 교체 표시
2. 현재 출전 포켓몬 편집
   - 이름
   - 타입 최대 2개
   - 일반 공격 1개
   - 스페셜 공격 최대 2개
3. 상대 타입 선택
   - 18개 타입 아이콘
   - 화면 폭에 따라 2~3줄 이상 자동 배치
4. 결과 및 추천
   - 3마리 각각의 공격/방어/종합 평가
   - 추천 순위
   - 현재 출전 포켓몬 요약

---

## 3. 리소스 업로드 방식

이 프로젝트는 아이콘 파일을 직접 잘라 넣기 쉽게 설계했습니다.

### 넣어야 하는 위치
`public/types/`

### 파일명 규칙
- `normal.png`
- `fighting.png`
- `flying.png`
- `poison.png`
- `ground.png`
- `rock.png`
- `bug.png`
- `ghost.png`
- `steel.png`
- `fire.png`
- `water.png`
- `grass.png`
- `electric.png`
- `psychic.png`
- `ice.png`
- `dragon.png`
- `dark.png`
- `fairy.png`

앱은 위 파일명을 자동으로 읽습니다.

### 업로드 쉽게 하는 방법
1. 업로드한 아이콘 원본 이미지를 준비
2. 각 타입 아이콘을 1개씩 잘라 PNG로 저장
3. 위 파일명 규칙으로 저장
4. `public/types/` 폴더에 덮어쓰기
5. `npm run dev` 또는 배포 빌드 후 확인

### 지금 프로젝트 상태
- 아이콘 이미지 자체는 자동 포함하지 않았습니다.
- 이유: 현재 대화에서는 업로드된 원본 이미지 파일을 직접 파일로 받아 자를 수 없는 상태라, **업로드/교체가 쉬운 구조**로 먼저 맞춰두었습니다.
- 아이콘이 없으면 앱이 타입명 첫 글자 fallback 표시로 동작합니다.

---

## 4. Cloudflare Pages 배포 방법

### A. 로컬 실행
```bash
npm install
npm run dev
```

### B. 배포 빌드
```bash
npm install
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### C. Cloudflare Pages 등록
1. Cloudflare 대시보드 접속
2. **Workers & Pages** 선택
3. **Create application** 클릭
4. **Pages** 선택
5. Git 연결 또는 Direct Upload 선택

#### 방법 1: Git 연결 추천
- GitHub 저장소에 이 프로젝트 업로드
- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version은 기본값으로도 대개 가능하지만 20 계열 권장

#### 방법 2: Direct Upload
- 로컬에서 `npm run build`
- 생성된 `dist/` 폴더를 업로드

### D. 커스텀 도메인 연결
1. Pages 프로젝트 진입
2. **Custom domains**
3. 원하는 도메인 연결
4. Cloudflare DNS 안내대로 CNAME/연결 처리

---

## 5. 프로젝트 구조

```text
pogo-type-helper/
├─ public/
│  └─ types/
│     └─ 여기에 18개 타입 아이콘 PNG 업로드
├─ src/
│  ├─ data/
│  │  ├─ typeChart.ts
│  │  └─ typeMeta.ts
│  ├─ lib/
│  │  ├─ battle.ts
│  │  └─ storage.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ index.css
│  └─ types.ts
├─ package.json
└─ README.md
```

---

## 6. 다음 확장 추천
- 포켓몬 종족 DB 연동
- 빠른 기술/차지 기술 실제 기술명 지원
- 리그별 팀 프리셋
- 상대 포켓몬 이름 검색 후 타입 자동 입력
- PWA 설치 지원
