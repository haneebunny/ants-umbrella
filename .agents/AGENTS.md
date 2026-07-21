# AGENTS.md

이 파일은 이 저장소에서 작업하는 AI 코딩 에이전트(Antigravity 등)를 위한 운영 가이드입니다. 사람을 위한 소개는 `README.md`를, 상세 기획은 `전략기획서_PRD__v2.md`를 참고하세요.

---

## 프로젝트 개요

ESG 사건(뉴스·공시)의 방향·강도를 업종별 Materiality(1/0) 기준으로 분리 집계하고, 가격/거시 피처와 함께 XGBoost에 넣어 종목별 "20거래일 내 -10% 하락 확률"을 예측하는 서비스입니다. 매일 새벽 배치로 데이터 수집·피처 계산·모델 추론을 수행하고, 그 결과를 DB에 저장해두었다가 사용자가 앱을 열면 바로 조회해서 보여주는 구조입니다(실시간 재계산 아님). 상세 스펙은 `전략기획서_PRD__v2.md`, 단계별 실행 가이드는 `개발_로드맵_ML_DL_가이드.md`를 참고하세요.

## 기술 스택

- 백엔드: Python 3.11.9
- 프론트: Next.js (JavaScript, **TypeScript 미사용**)
- DB: MongoDB Atlas (M0 무료 클러스터, DB명 `esg_risk_db`)
- ESG 텍스트 분류: HuggingFace Inference API / `transformers` 로컬 파이프라인 (zero-shot classification)
- ML: XGBoost
- 배치 자동화: GitHub Actions

## 디렉터리 구조

```
.
├── AGENTS.md
├── PROGRESS.md              # 작업 기록 (날짜 | 이름 | 한 일)
├── ROADMAP.md                 # Day별 실행 체크리스트
├── .env.example              # 필요한 환경변수 목록 (값은 비어있음)
├── data/
│   ├── reference/            # 커밋함 — Materiality Map CSV 등 설정성 데이터
│   ├── raw/                  # 커밋 안 함 — 수집한 원본 뉴스/공시
│   └── processed/            # 커밋 안 함 — 파이프라인 중간 산출물
├── backend/
│   ├── main.py                # 앱 진입점만, 로직은 아래 모듈로 위임 (비대해지지 않게 유지)
│   ├── data_sources/          # OpenDART, NAVER API HUB, ECOS, pykrx 등 외부 API 연동
│   ├── pipeline/               # ESG 분류, Materiality 집계, 피처 생성
│   ├── models/                 # XGBoost 학습/추론
│   └── db/                     # MongoDB 연결 및 쿼리 로직 (데이터 접근은 여기로 분리)
└── frontend/
    └── (Next.js 프로젝트, flex/gap 중심 레이아웃)
```

## 셋업 명령어

```bash
# 백엔드 (Poetry)
poetry install
poetry shell
cp .env.example .env   # 값을 채워 넣을 것 (아래 "환경변수" 참고)

# 프론트엔드
cd frontend
npm install
npm run dev
```

> 아나콘다(conda) 사용자는 `git pull` 이후 `pyproject.toml`/`poetry.lock`에 새로 추가된 패키지가 있으면 수동으로 설치해야 합니다.

## 테스트/검증 명령어

```bash
python -m py_compile <수정한 파일>   # 최소한 문법 오류 확인
pytest                              # 테스트 스크립트가 있는 경우
cd frontend && npm run lint          # eslint (Next.js 기본 룰셋)
```

---

## 환경변수 규칙 (필수)

**API 키, DB 접속 주소, 비밀번호 등 외부에 노출되면 안 되는 값은 예외 없이 `.env`를 통해서만 접근합니다. 코드에 직접 값을 써넣지 않습니다(하드코딩 금지).**

- 필요한 키 목록은 `.env.example`에 있습니다: `NCP_API_KEY_ID`, `NCP_API_KEY`(NAVER API HUB), `DART_API_KEY`(OpenDART), `ECOS_API_KEY`, `HF_TOKEN`(HuggingFace), `MONGODB_URI`, `ANTHROPIC_API_KEY`(선택)
- Python: `os.environ["KEY"]` (`python-dotenv`로 로드)
- Next.js: `process.env.KEY` — 브라우저에 노출되면 안 되는 키에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다
- `.env` 파일 자체는 절대 커밋하지 않습니다 (`.gitignore`에 등록됨)
- 원격 실행(GitHub Actions)에서는 동일한 키를 **GitHub Secrets**로 등록해서 사용합니다

## MongoDB 규칙

- 컬렉션명: `esg_events`, `disclosures`, `price_macro`, `training_features`, `daily_risk_score` (snake_case, 복수형)
- 모든 컬렉션에 `(ticker, date)` 복합 유니크 인덱스 적용
- 데이터 적재는 `insert`가 아니라 `update_one(..., upsert=True)`로 처리 (배치 재실행 시 중복 방지)

## 코드 스타일

- 프론트: `flex`/`gap` 중심 레이아웃, `margin`/`absolute`는 꼭 필요할 때만 사용
- 백엔드: 데이터 접근 로직은 `backend/db/`로 분리, `main.py`는 진입점 역할만 (로직 직접 넣지 않기)
- ESG 분류·Materiality 판정 로직에 관한 필드명·스키마는 `전략기획서_PRD__v2.md` 4-3 섹션을 기준으로 삼습니다 (임의로 필드명을 바꾸지 않기)

## 협업 / Git 규칙 (항상 지킬 것)

> 이 규칙은 코드를 커밋·푸시할 때마다 항상 적용됩니다. 기능 종류와 상관없이 예외 없이 따릅니다.

**작업 시작 전 사람에게 먼저 확인을 받습니다. 허락 전에는 `git add`도 하지 않습니다.**

### 브랜치 전략

- **`main`**: 배포·최종 완성본 브랜치. **직접 커밋/푸시 절대 금지.**
- **`feature/...`**: 기능 개발용 독립 브랜치. 모든 작업은 여기서 하고, PR을 거쳐 `main`에 합칩니다.
- **브랜치 생성 필수**: 새로운 개발 작업을 처음 시작할 때는 무조건 브랜치를 새로 따고 시작합니다.
- **단계별 브랜치 순환**: 한 단계 진행할 때마다 새로운 브랜치를 사용하며, 다음 단계 브랜치를 따기 전 기존 브랜치의 작업물은 반드시 **조장의 허락을 받아 원격 push 및 PR까지 완료**해 둡니다.
- 새 작업 시작 전 항상 최신 `main`을 받은 상태에서 브랜치를 팝니다.
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/fe-login   # 새 브랜치 만들고 이동
  ```

### 브랜치 이름 규칙

형식: `접두어/파트-작업내용` (소문자, 단어 구분은 하이픈 `-`)

| 용도 | 형식 | 예시 |
|---|---|---|
| 프론트 기능 | `feature/fe-기능명` | `feature/fe-login`, `feature/fe-main-page` |
| 백엔드 기능 | `feature/be-기능명` | `feature/be-matching-api`, `feature/be-db-setup` |
| 버그 수정 | `fix/fe-버그명` / `fix/be-버그명` | `fix/be-match-format` |

### 커밋 컨벤션

형식: `Type: 요약` (요약은 한글 가능). 제목만 보고 무슨 변화인지 알 수 있게 씁니다.

| 타입 | 설명 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 (README, 가이드 등) |
| `style` | 포맷팅·세미콜론 등 (로직 변경 없음) |
| `refactor` | 기능 변화 없는 구조 개선 |
| `chore` | 빌드·패키지 설정·`.gitignore` 등 |

예: `feat: 유기동물 상세 페이지 UI 구현` / `fix: 백엔드 매칭 API 데이터 포맷 에러 수정`

### 커밋 & 푸시 & PR 흐름

**PR은 "PR 날려줘"라고 명시적으로 요청받았을 때만 진행합니다.** 기능 작업이 끝났다고 자동으로 push·PR까지 가지 않습니다. 요청받으면:

```bash
git status              # 변경 파일 확인
git add .
git commit -m "feat: 유기동물 상세 페이지 UI 구현"
git push origin feature/fe-login   # 내 브랜치로 푸시 (main 아님!)
```

그다음 GitHub에서 `Compare & pull request` → 리뷰어에 **`haneebunny`** 지정 → 작업 내용 요약 작성 → `Create pull request` → **조장에게 알립니다.**

### ⚠️ 필수 주의사항

- 🚫 **`main`에 직접 푸시 절대 금지.** 반드시 `feature/` 브랜치 → PR → merge 경로만 사용합니다.
- 📦 **의존성 추가 시 lock 파일을 반드시 커밋에 포함합니다.**
  - 프론트(npm): `package.json` + `package-lock.json`
  - 백엔드(Poetry): `pyproject.toml` + `poetry.lock`
  - (아나콘다 사용자는 pull 받은 뒤 추가된 패키지를 수동 설치해야 합니다.)

## 작업 기록

- 코드를 만들거나 수정했으면 `PROGRESS.md`에 `날짜 | 이름 | 한 일` 형식으로 한 줄 추가
- Day 단위(또는 PRD 기준 큰 기능 단위)가 끝나면 `ROADMAP.md`에도 체크 표시

## 하지 말아야 할 것 (Do-Not-Touch)

- ESG 분류 모델을 전체 파인튜닝하지 않습니다 — zero-shot API 또는 linear probing(임베딩 고정 + 경량 head만 학습)만 사용
- `industry_materiality_weight` 같은 연속 가중치 방식으로 되돌리지 않습니다 — Materiality는 업종×이슈카테고리 1/0 이진 판정 방식(`is_material`)을 유지
- 사용자 화면에 E/S/G 세부 pillar나 내부용 `issue_category`를 노출하지 않습니다 — 노출 가능한 근거는 "긍정/부정 방향 + material 여부"까지만
- `.env` 파일, API 키, `MONGODB_URI` 값을 코드나 커밋에 평문으로 남기지 않습니다
