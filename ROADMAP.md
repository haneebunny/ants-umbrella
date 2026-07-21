# ROADMAP

4일 스프린트 Day별 체크리스트입니다. 완료한 항목은 체크하고, 세부 내용은 `PROGRESS.md`에 기록하세요.

---

## Day 1 — 데이터 파이프라인 기초

**사람이 먼저 할 일 (에이전트가 대신할 수 없음)**
- [ ] OpenDART 인증키 발급 (`opendart.fss.or.kr`, 개인 즉시발급)
- [ ] ECOS 인증키 발급 (`ecos.bok.or.kr`, 가입 시 자동발급)
- [ ] NAVER API HUB 키 발급 (`ncloud.com` 콘솔)
- [ ] HuggingFace Access Token 발급 (`huggingface.co/settings/tokens`)
- [ ] 빅카인즈 API는 신청만 넣어두고 기다리지 않기 (이번 스프린트는 DART 단독 플랜B 전제)

**Antigravity에게 순서대로 시킬 것**
- [ ] 프로젝트 스캐폴딩 (백엔드 `pyproject.toml`/Poetry, 프론트 Next.js 프로젝트)
- [ ] OpenDART 공시 수집 스크립트 + `CAPITAL_EVENT`/`DELISTING_RELATED` 규칙 기반 태깅
- [ ] NAVER API HUB 뉴스 수집 스크립트
- [ ] pykrx/FinanceDataReader로 가격·거래량·업종 정보 수집
- [ ] ECOS 거시지표 수집
- [ ] (병행) 이벤트 스터디(AR/CAR) 오프라인 EDA 노트북

> 예시 프롬프트: *"OpenDART API로 특정 종목의 주요사항보고서 목록을 가져오고, 유형코드를 CAPITAL_EVENT/DELISTING_RELATED로 분류하는 파이썬 스크립트를 짜줘. API 키는 .env에서 읽어오게 해줘."*

## Day 2 — DL: 카테고리 판정 → Materiality Map → 방향 판정

**DL 처리 순서 (중요 — 반드시 이 순서로)**
1. **카테고리 판정을 가장 먼저** 합니다 (HuggingFace zero-shot, `["ESG 관련", "실적/재무 관련", "산업/사업동향 관련", "문화/마케팅 관련", "기타"]`). 이 결과가 ① 사용자 화면에 그대로 노출되는 태그이자 ② 이후 Materiality 조회의 키이자 ③ 아래 우선순위 처리 대상을 정하는 라우팅 기준이기 때문에, 반드시 첫 단계로 둡니다.
2. 카테고리별로 **`ESG`/`실적·재무`부터 방향(긍정/부정) 판정까지 정교하게 처리**하고, `산업·사업동향`/`문화·마케팅`/`기타`는 시간이 남으면 이어서, 부족하면 카테고리 태그만 노출하고 넘어갑니다.
3. Materiality Map(업종 × 카테고리 → 1/0)을 조회해 `category_material_value`/`category_immaterial_value`로 분리 집계합니다.

**사람이 먼저 할 일**
- [ ] Materiality Map CSV 채우기 (업종 × 뉴스 카테고리 → 1/0). **`ESG`, `실적·재무` 칸부터 채우고**, 시간이 부족하면 나머지 칸(`산업·사업동향`/`문화·마케팅`/`기타`)은 전부 `0`으로 둔 채 다음 스프린트로 이월합니다.
- [ ] (linear probing 진행 시) 뉴스 문장 150~400건 라벨링: `news_related`, `news_category`, `direction` — 라벨링도 `ESG`/`실적·재무` 카테고리 문장부터 우선 진행

**Colab (사람 주도 + 에이전트 보조)**
- [ ] 카테고리 zero-shot 프롬프트/라벨 문구 테스트, 후보 라벨 버전별 비교
- [ ] (linear probing 진행 시) 임베딩 추출 → 분류기 head 학습 → train/val loss curve 확인 (ESG·실적재무 데이터로 먼저)

**VSCode에서 Antigravity에게 시킬 것**
- [ ] 카테고리 판정 함수 (HuggingFace zero-shot) — 파이프라인의 첫 단계로 배치
- [ ] 선택한 방향 판정 방식(linear probing 또는 zero-shot)을 카테고리별 우선순위에 따라 적용하는 배치 파이프라인
- [ ] Materiality Map 조회 함수 (`(업종, news_category) → is_material`)
- [ ] PRD 4-3 스키마대로 결과 저장, `category_material_value`/`category_immaterial_value` 집계
- [ ] MongoDB 컬렉션 세팅 및 07:00 배치 스케줄 뼈대

**Fallback (시간이 부족할 때)**
- [ ] 카테고리 판정 정확도가 애매한 뉴스 → `기타`로 분류하고 넘어가기 (억지로 5개 중 하나에 끼워맞추지 않기)
- [ ] Materiality Map 미완성 칸 → `0`(immaterial) 기본값 — material 신호를 과대 계상하지 않는 안전한 쪽으로 처리
- [ ] linear probing이 특정 카테고리에서 정확도가 안 나옴 → 해당 카테고리만 zero-shot(`["긍정적인 사건", "부정적인 사건"]`)으로 잠정 대체

## Day 3 — ML: XGBoost 학습 & Ablation

- [x] PRD 4-3 스키마 ④대로 피처 조인 (뉴스 material/immaterial + 보조신호 + 가격/거시)
- [x] 라벨 생성: `label_direction_next_day` (다음 거래일 종가가 전일 대비 상승=1/하락=0)
- [x] 시계열 분할(look-ahead bias 방지)
- [x] XGBoost 학습, Accuracy/AUC-ROC/Brier Score로 평가 (양성비율이 대략 균형이라 PR-AUC/Precision@K는 사용하지 않음)
- [x] Ablation 3단(베이스라인→+뉴스카테고리→+뉴스카테고리+보조신호) 실행 및 비교
- [x] `daily_risk_score`(PRD 4-3 스키마 ⑤: `direction`, `confidence_tier`) 저장

## Day 4 — UX 통합 & 발표 준비

- [x] 성향 임계치 적용 날씨 산출 로직
- [ ] LLM 브리핑 연동 — "카테고리 태그 + 방향 + 확신도(강/중/약)"까지만 노출, 확률 수치·등락폭은 노출 금지
- [x] 프론트: 체질/날씨 화면, 종목 상세 근거 카드(`[ESG]`, `[문화·마케팅]` 등 카테고리 태그 표시)
- [ ] 어드민: Materiality Map(업종×뉴스카테고리) 편집, 배치 모니터링, Ablation 결과 뷰
- [ ] 통합 테스트
- [ ] Ablation 결과(loss curve, Accuracy/AUC-ROC 비교표)를 발표자료로 정리

---

## 막힐 때 체크리스트

- **linear probing val loss가 안 줄어든다** → 라벨 수 부족(200건 미만) 또는 라벨링 기준 불일치 가능성
- **HuggingFace 무료 티어 rate limit** → 요청 사이 sleep 추가, 중복 기사는 캐싱
- **XGBoost 성능이 baseline(prior~50%)보다 안 좋다** → 실패가 아니라 "단기 방향 예측은 원래 어렵다"는 분석 결과로 제시, 어떤 카테고리 조합이 그나마 기여했는지 Ablation으로 설명
- **카테고리 판정이 애매한 뉴스가 많다** → 억지로 5개 중 하나에 끼워맞추지 말고 `기타`로 분류
- **Colab에서 만든 분류기를 VSCode로 옮기는 법** → `pickle`(sklearn) 또는 `torch.save`(PyTorch)로 저장 → 다운로드 → `backend/models/`에 넣기
