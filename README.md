# ☔ 개미의 우산

> 비 오는 시장에서 개미에게 우산을 씌워주는 **사전 경보 서비스**
>
> 내가 가진 주식이 앞으로 크게 떨어질 위험이 있는지 매일 자동으로 계산해서,
> 날씨 아이콘(☀️ ⛅ 🌧️ ⚡) 하나로 보여줍니다.

**🔗 [ants-umbrella.vercel.app](https://ants-umbrella.vercel.app)**

---

## 무엇을 푸는가

직장인 개인투자자는 하루 약 18분으로 쏟아지는 뉴스·공시를 "내 계좌 영향"으로 번역할 수 없습니다.
판단을 대신하는 로보어드바이저와 정보만 나열하는 뉴스 서비스 사이,
**"판단 재료를 내 포트폴리오 기준으로 가공해주는"** 서비스의 공백을 채웁니다.

### 예측 대상을 바꾼 이야기

처음엔 **"내일 이 주식이 오를까 내릴까"** 를 맞히려 했습니다.
그런데 실측해보니 **AUC-ROC 0.500** — 동전 던지기와 같았습니다.

그래서 질문을 바꿨습니다.

| | 예측 대상 | 실측 AUC-ROC | 결과 |
| --- | --- | --- | --- |
| ❌ | 20거래일 **방향** (오를까/내릴까) | **0.500** | 폐기 |
| ✅ | 20거래일 내 **-10% 급락 여부** | **0.559** | 채택 |

> **"주가를 맞히는 게 아니라, 위험한 상태인지를 판별합니다."**

### 하지 않는 것

종목 추천 · 매수/매도 시점 · 목표가 · 수익률 보장 · 자동 매매

---

## 시스템 구성

```
[사용자]
   │
   ▼
Vercel ── Next.js 프론트엔드
   │  (REST)
   ▼
Railway ── FastAPI 백엔드 ──► MongoDB Atlas
                                  ▲
GitHub Actions (매일 2회) ────────┘
  수집 → 피처 → 라벨 → 건강검진 → 예측 → 적재 → Slack 알림
```

### 기술 스택

| 구분 | 사양 |
| --- | --- |
| **프론트엔드** | Next.js 16.2.10 (App Router) · React 19.2.4 · Tailwind CSS 4 |
| **백엔드** | Python **3.11.9** · FastAPI · Poetry · Pydantic |
| **DB** | MongoDB Atlas |
| **ML** | XGBoost · scikit-learn |
| **DL** | KR-FinBert-SC (감성) · XLM-RoBERTa-XNLI (zero-shot 분류) — **추론 전용** |
| **배포** | Vercel (프론트) · Railway (백엔드) · GitHub Actions (배치) |

### 데이터 출처

| 데이터 | 출처 |
| --- | --- |
| 주가·거래량 | pykrx, FinanceDataReader |
| 거시경제 (금리·환율) | 한국은행 ECOS |
| 뉴스 | 빅카인즈 (학습용) · 네이버 검색 API (일일 수집) |
| 공시 | OpenDART |
| 업종 중요도 | SASB 기준 |
| 실시간 시세 | 한국투자증권 OpenAPI |

**현재 데이터**: 17개 종목 · 2023-01-02 ~ 2026-07-27 · **14,773행**

---

## 어떻게 판단하는가

### 정답(라벨) 정의

```
label_drawdown_20d
  = 이 날로부터 20거래일 안에 주가가 10% 넘게 떨어졌으면 1(급락), 아니면 0(무사)

양성률 17.88%  — 드문 사건
```

### 검증 설계

시계열 데이터라 무작위 분할을 쓸 수 없습니다.
**과거로 학습해 미래를 맞히는** 구조를 반복하고, 학습·검증 구간 사이에
라벨이 참조하는 **미래 20거래일만큼 엠바고**를 둡니다.

```
┌─────────┬─────────┬─────────┬─────────┐
│  1구간  │  2구간  │  3구간  │  4구간  │
└─────────┴─────────┴─────────┴─────────┘
Fold 1  [ 학습 ]▮[ 시험 ]      ▮ = 엠바고 20일
Fold 2  [  학 습  ]▮[ 시험 ]
Fold 3  [   학  습   ]▮[ 시험 ]
```

### 성적표

지표는 **0점이 아니라 "찍어도 나오는 점수"** 에서 출발합니다.

| 지표 | 기준선 | 우리 | 의미 |
| --- | --- | --- | --- |
| **PR-AUC** ⭐ | 0.179 | **0.245** (1.37배) | 드문 급락을 골라내는 능력 |
| **확률 보정** ⭐ | 1.00배 | **1.00배** | 화면의 확률이 실제와 일치하는가 |
| AUC-ROC | 0.500 | 0.559 | 줄 세우기 품질 |
| Brier | — | 0.102 | 확률 정밀도 |
| ~~Accuracy~~ | — | — | **사용 안 함** — 급락을 못 잡아도 82점이 나옴 |

> **왜 확률 보정을 따로 두는가**
> 화면에 "급락 확률 24%"를 그대로 보여주므로, 숫자가 틀리면 성능 문제가 아니라 **허위 표기**입니다.
> 불균형 보정(`scale_pos_weight`)을 켜면 확률이 실제의 **2.1배**로 부풀려지는데,
> **AUC-ROC로는 이 문제를 감지할 수 없습니다.** 순서만 채점하기 때문입니다.
> 그래서 평가용 모델에만 적용하고 **서빙 모델에는 쓰지 않습니다.**

---

## 정직하게 보고하는 3가지

### ① 뉴스는 급락 예측에 기여하지 않았습니다

조건을 4번 바꿔가며 측정했으나 결론이 계속 뒤집혔습니다.

| 조건 | ΔPR-AUC 95% 신뢰구간 | P(개선) |
| --- | --- | --- |
| 뉴스 1종목만 | [-0.0066, +0.0030] | 0.25 |
| 17종목 확대 | [-0.0048, +0.0049] | 0.53 |
| + 중립 처리 개선 | [-0.0009, +0.0196] | 0.96 |
| **+ 전 종목 완비 (최종)** | **[-0.0212, -0.0027]** | **0.00** |

**종목 하나 추가로 부호가 뒤집힌다는 것은 안정적인 신호가 없다는 뜻입니다.**

또한 부정 뉴스가 많을수록 오히려 급락률이 **낮게** 나왔는데(20일 부정 10건 이상 → 5.0%),
확인해보니 **뉴스가 많은 종목이 대형주라서 생긴 착시**였습니다.
변동성을 통제하니 네 구간 모두 차이가 사라졌습니다.

→ 뉴스는 예측이 아니라 **"왜 위험한가"를 설명하는 근거**와 **Slack 알림 필터**로 역할을 한정했습니다.

### ② 단순 변동성 규칙이 학습 모델보다 낫습니다

| 방식 | PR-AUC |
| --- | --- |
| **변동성 값만 사용 (학습 없음)** | **0.363** |
| 학습 — 가격 피처 | 0.260 |
| 학습 — + 거시 | 0.255 |
| 학습 — + 공시 | 0.245 |

악재가 터지면 주가가 먼저 출렁이고 변동성에 이미 반영됩니다.
뉴스는 그 뒤에 보도되므로 새로 더할 정보가 적습니다.
**모델의 가치는 순위가 아니라 보정된 확률을 제공하는 데 있습니다.**

### ③ 날씨 4단계 중 비·번개는 아직 구분되지 않습니다

out-of-sample 급락률이 비 0.263 / 번개 0.242로 신뢰구간이 겹칩니다.
현재 신뢰할 수 있는 경계는 **"맑음 / 그 외"** 수준이며, 종목 수 확대가 다음 과제입니다.

---

## 로컬 실행

### 백엔드 (Python 3.11.9)

```bash
cd backend
poetry install
poetry run uvicorn main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

`frontend/.env.local` 에 `NEXT_PUBLIC_API_URL=http://localhost:8000` 설정

### 환경변수 (`backend/.env`)

```
MONGODB_URI            MongoDB Atlas 연결 문자열
KIS_APP_KEY            한국투자증권 OpenAPI
KIS_APP_SECRET
ECOS_API_KEY           한국은행 거시지표
OPENDART_API_KEY       금융감독원 공시
NCP_API_KEY_ID         네이버 클라우드 (뉴스 검색)
NCP_API_KEY
HF_TOKEN               HuggingFace
GEMINI_API_KEY         AI 브리핑 생성
SLACK_WEBHOOK_URL      일일 알림
```

---

## 데이터 파이프라인

```bash
cd backend

poetry run python scripts/collect_price.py       # 주가·거래량
poetry run python scripts/collect_macro.py       # 금리·환율 (+ forward-fill)
poetry run python scripts/collect_news.py        # 뉴스 (일일)
poetry run python scripts/collect_dart.py        # 공시

poetry run python scripts/generate_labels.py     # 급락 라벨 생성
poetry run python scripts/add_sector.py          # 업종 정보
poetry run python scripts/join_features.py       # 통합 → ml_ready_real.csv

poetry run python scripts/health_check.py        # 데이터·모델 건강검진 ⭐
poetry run python scripts/save_risk_scores.py    # 예측 → MongoDB 적재
poetry run python scripts/slack_notifier.py      # 알림 발송
```

> ⚠️ `generate_labels.py` → `add_sector.py` 순서를 지켜야 합니다.
> `add_sector.py` 는 `price_features_labeled.csv` 를 읽어 업종만 덧붙입니다.

### 건강검진 (`health_check.py`)

데이터 정제 품질 · 라벨 무결성 · 모델 건전성 · 단계별 기여도를
한 번에 점검하고 `reports/health_check.md` 를 생성합니다.
FAIL이 있으면 종료 코드 1을 반환하므로 CI에서 배포 차단에 쓸 수 있습니다.

```
A. 데이터 정제 품질     중복·연속성·결측·이상치·커버리지
B. 라벨 무결성         독립 재계산 대조 · 양성률 · 미래 참조 누수
C. 모델 학습 건전성     기준선 대비 · 확률 보정 · 과적합 · 등급 단조성
D. 단계별 기여도       가격 → 거시 → 공시 → 뉴스 (부트스트랩 신뢰구간)
```

### 자동 배치 (GitHub Actions)

| 워크플로 | 스케줄 (KST) | 내용 |
| --- | --- | --- |
| `daily_slack_alert.yml` | 07:41 / 17:46 | 수집 → 건강검진 → 예측 → 적재 → Slack |
| `ml_ablation_experiment.yml` | 수동 | 전체 파이프라인 + Ablation 재현 |

---

## 프로젝트 구조

```
ants-umbrella/
├── backend/
│   ├── main.py                 FastAPI 엔드포인트 · 날씨 변환 로직
│   ├── app/
│   │   ├── db.py               MongoDB 커넥션
│   │   ├── schemas.py          Pydantic 스키마
│   │   └── utils.py
│   └── scripts/                수집 · 피처 · 학습 · 검진 · 알림
├── frontend/src/app/
│   ├── page.js                 홈 대시보드
│   ├── stock/[ticker]/         종목 상세
│   ├── diagnosis/              위험 진단
│   ├── onboarding/             투자성향 진단
│   └── alerts/                 위험 알림
├── data/                       수집·가공 데이터 (gitignored)
├── reports/health_check.md     건강검진 리포트 (자동 생성)
└── .github/workflows/
```

### 주요 API

| Method | 엔드포인트 | 설명 |
| --- | --- | --- |
| GET | `/api/dashboard-weather` | 보유 종목별 날씨·위험도 |
| GET | `/risk-score/{ticker}` | 종목 급락 확률·확신도 |
| GET | `/risk-evidences/{ticker}` | 위험 판정 근거 (뉴스·공시) |
| POST | `/api/weather-briefing` | AI 판단 근거 생성 |
| GET | `/api/watchlist-prices` | 실시간 시세 |
| GET | `/api/alerts` | 위험 알림 목록 |

---

## 다음 과제

| 순위 | 항목 | 이유 |
| --- | --- | --- |
| **P0** | 회원가입 + 포트폴리오 직접 입력 | 현재 고정 포트폴리오 — 개인화의 전제 |
| P1 | 대상 종목 17 → 50+ | 날씨 등급 분리 검증의 선행 조건 |
| P1 | 수집 대상을 사용자 보유 종목 기준으로 | P0 완료 시 필수 |
| P2 | 알림 정밀도 추적 체계 | 발송 종목의 20일 뒤 실제 급락 여부 로깅 |

---

## 문서

| 문서 | 내용 |
| --- | --- |
| `data_analysis_definition.md` | 실험 설계 · Ablation · 피처 중요도 |
| `ROADMAP.md` | 개발 로드맵 |
| `PROGRESS.md` | 작업 이력 |
| `TEAM_ROLE_GUIDE.md` | 팀원 역할 분담 |
| `reports/health_check.md` | 최신 건강검진 결과 (자동 생성) |

---

<div align="center">

**우리는 주가를 맞히는 대신, "급락 위험을 사전에 감지"하여 개미 투자자에게 우산을 씌워줍니다.**

</div>
