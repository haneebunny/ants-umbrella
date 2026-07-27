"""데이터·모델 건강검진

데이터가 제대로 정제됐는지, 모델이 제대로 학습됐는지를 한 번에 점검한다.
각 항목은 PASS / WARN / FAIL 로 판정하며, 판정 기준을 함께 출력한다.

실행:  poetry run python scripts/health_check.py
"""
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from xgboost import XGBClassifier

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ML_READY = PROJECT_ROOT / "data" / "ml_ready_real.csv"
RAW_PRICE = PROJECT_ROOT / "data" / "price_features_raw.csv"

FEATURES = [
    "log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx",
    "category_material_value", "category_immaterial_value",
    "capital_event_flag", "delisting_related_flag",
]
LABEL = "label_drawdown_20d"
WINDOW, THRESHOLD = 20, -0.10

# 날씨 등급 컷 (main.py와 동일해야 함)
WEATHER_CUTS = (0.097, 0.252, 0.420)

results = []


def check(name, status, detail, criterion=""):
    results.append((name, status, detail, criterion))
    icon = {"PASS": "✅", "WARN": "⚠️ ", "FAIL": "❌"}[status]
    print(f"{icon} {name}")
    print(f"     {detail}")
    if criterion:
        print(f"     기준: {criterion}")
    print()


def section(title):
    print(f"\n{'━' * 68}\n{title}\n{'━' * 68}\n")


# ══════════════════════════════════════════════════════════════════
df = pd.read_csv(ML_READY, dtype={"ticker": str}, parse_dates=["date"])
df = df.sort_values(["ticker", "date"]).reset_index(drop=True)

section("A. 데이터 정제 품질")

# A1. 규모
n_rows, n_tickers = len(df), df["ticker"].nunique()
span = f"{df.date.min().date()} ~ {df.date.max().date()}"
check("A1. 데이터 규모", "PASS",
      f"{n_rows:,}행 · {n_tickers}개 종목 · {span}")

# A2. 종목-거래일 중복
dup = df.duplicated(subset=["ticker", "date"]).sum()
check("A2. 종목-거래일 중복", "PASS" if dup == 0 else "FAIL",
      f"중복 {dup}건", "0건이어야 함 (같은 날 같은 종목이 두 번 있으면 학습이 왜곡됨)")

# A3. 거래일 정렬·연속성
gaps = []
for tk, g in df.groupby("ticker"):
    d = g["date"].sort_values()
    if not d.is_monotonic_increasing:
        gaps.append(f"{tk}: 정렬 깨짐")
    long_gap = (d.diff().dt.days > 10).sum()
    if long_gap:
        gaps.append(f"{tk}: 10일 초과 공백 {long_gap}회")
check("A3. 거래일 연속성", "PASS" if not gaps else "WARN",
      "이상 없음" if not gaps else " / ".join(gaps[:4]),
      "10일 넘는 공백은 수집 누락 의심 (연휴는 최대 약 5거래일)")

# A4. 피처 결측률
miss = df[FEATURES].isna().mean().sort_values(ascending=False)
worst = miss.head(3)
detail = ", ".join(f"{k} {v*100:.1f}%" for k, v in worst.items())
check("A4. 피처 결측률", "PASS" if miss.max() < 0.15 else "WARN",
      f"최대 결측: {detail}",
      "15% 미만 권장. 롤링 초기 구간(beta_60d 등) 결측은 정상")

# A5. 수익률 이상치
r = df["log_return_1d"].dropna()
extreme = (r.abs() > 0.30).sum()
check("A5. 수익률 이상치", "PASS" if extreme == 0 else "WARN",
      f"일간 ±30% 초과 {extreme}건 (최대 {r.abs().max()*100:.1f}%)",
      "국내 증시 상하한가는 ±30%. 초과 시 수정주가 미적용·액면분할 의심")

# A6. 거시 지표 결합
macro_na = df[["macro_rate", "macro_fx"]].isna().mean()
check("A6. 거시 지표 결합", "PASS" if macro_na.max() == 0 else "WARN",
      f"macro_rate {macro_na['macro_rate']*100:.1f}% / macro_fx {macro_na['macro_fx']*100:.1f}% 결측",
      "forward-fill 후 0%여야 함")

# A7. 뉴스 커버리지
has_news = (df["category_material_value"] != 0) | (df["category_immaterial_value"] != 0)
cov = has_news.mean()
check("A7. 뉴스 커버리지", "WARN" if cov < 0.10 else "PASS",
      f"뉴스 신호 보유 행 {has_news.sum():,}건 ({cov*100:.1f}%)",
      "10% 미만이면 뉴스 기여도 결론을 내리기 어려움")

# ══════════════════════════════════════════════════════════════════
section("B. 라벨 무결성 (가장 중요)")

# B1. 라벨 독립 재계산 대조
raw = pd.read_csv(RAW_PRICE, dtype={"ticker": str}, parse_dates=["date"])
raw = raw.sort_values(["ticker", "date"]).reset_index(drop=True)


def recompute(g):
    """generate_labels.py와 독립적인 방식(단순 루프)으로 급락 라벨 재계산"""
    ret = g["log_return_1d"].fillna(0).values
    n = len(ret)
    out = np.full(n, np.nan)
    for t in range(n):
        if t + WINDOW >= n:
            break
        out[t] = 1.0 if (np.exp(np.cumsum(ret[t + 1:t + 1 + WINDOW]).min()) - 1) <= THRESHOLD else 0.0
    g = g.copy()
    g["_ref"] = out
    return g


ref = raw.groupby("ticker", group_keys=False)[["ticker", "log_return_1d"]].apply(recompute)
raw["_ref"] = ref["_ref"]
merged = df.merge(raw[["ticker", "date", "_ref"]], on=["ticker", "date"], how="left")
cmp_rows = merged.dropna(subset=[LABEL, "_ref"])
mismatch = int((cmp_rows[LABEL].astype(int) != cmp_rows["_ref"].astype(int)).sum())
rate = mismatch / len(cmp_rows) if len(cmp_rows) else 1
check("B1. 라벨 독립 재계산 대조", "PASS" if rate < 0.001 else "FAIL",
      f"{len(cmp_rows):,}행 중 불일치 {mismatch}건 ({rate*100:.3f}%)",
      "0.1% 미만. 경계값(정확히 -10.000%) 부동소수점 차이는 허용")

# B2. 양성률
labeled = df[df[LABEL].notna()]
pos_rate = labeled[LABEL].mean()
check("B2. 라벨 양성률", "PASS" if 0.05 < pos_rate < 0.45 else "WARN",
      f"{pos_rate*100:.2f}% (양성 {int(labeled[LABEL].sum()):,} / {len(labeled):,})",
      "5~45%. 이 범위를 벗어나면 불균형이 심해 학습이 불안정")

# B3. 최근 20거래일 라벨 결측 (설계 의도대로인지)
unlabeled = df[LABEL].isna().sum()
expected = n_tickers * WINDOW
check("B3. 라벨 미확정 구간", "PASS" if unlabeled == expected else "WARN",
      f"미확정 {unlabeled}행 (기대값 {n_tickers}종목 × {WINDOW}일 = {expected}행)",
      "종목별 마지막 20거래일은 미래가 없어 라벨 불가 → 추론용으로 유지되어야 정상")

# B4. 라벨 누수 검사 — 라벨이 참조하는 미래 구간이 데이터 끝을 넘지 않는지
leak = 0
for tk, g in df.groupby("ticker"):
    g = g.sort_values("date")
    lab_idx = np.where(g[LABEL].notna().values)[0]
    if len(lab_idx) and lab_idx.max() + WINDOW >= len(g):
        leak += 1
check("B4. 라벨 참조 구간 누수", "PASS" if leak == 0 else "FAIL",
      f"미래 구간이 부족한데 라벨이 매겨진 종목 {leak}개",
      "0개. 라벨은 t+1~t+20이 모두 존재할 때만 매겨져야 함")

# ══════════════════════════════════════════════════════════════════
section("C. 모델 학습 건전성")

train = df.dropna(subset=FEATURES + [LABEL]).sort_values("date").reset_index(drop=True)
X, y = train[FEATURES], train[LABEL].astype(int)
base_rate = float(y.mean())

check("C0. 실제 학습 행 수", "PASS",
      f"{len(train):,}행 (전체 {n_rows:,} → 라벨 확정 {len(labeled):,} → 피처 온전 {len(train):,})")

# in-sample 모델
m_in = XGBClassifier(n_estimators=100, max_depth=3, eval_metric="logloss", random_state=42)
m_in.fit(X, y)
p_in = m_in.predict_proba(X)[:, 1]

# 엠바고 워크포워드 (out-of-sample)
GAP = WINDOW
n = len(train)
folds = []
for k in range(4):
    te = int(n * (0.4 + 0.15 * k))
    ts = te + GAP
    e = min(int(n * (0.4 + 0.15 * (k + 1))) + GAP, n)
    if ts < e:
        folds.append((np.arange(0, te - GAP), np.arange(ts, e)))

pp, yy, ii = [], [], []
for tr_i, te_i in folds:
    mm = XGBClassifier(n_estimators=100, max_depth=3, eval_metric="logloss", random_state=42)
    mm.fit(X.iloc[tr_i], y.iloc[tr_i])
    pp.append(mm.predict_proba(X.iloc[te_i])[:, 1])
    yy.append(y.iloc[te_i].values)
    ii.append(te_i)
p_oos, y_oos, idx_oos = np.concatenate(pp), np.concatenate(yy), np.concatenate(ii)

# C1. 기준선 대비 성능
pr_oos = average_precision_score(y_oos, p_oos)
auc_oos = roc_auc_score(y_oos, p_oos)
oos_base = y_oos.mean()
ratio = pr_oos / oos_base
check("C1. 기준선 대비 예측력", "PASS" if ratio > 1.1 else "FAIL",
      f"OOS PR-AUC {pr_oos:.4f} vs 무작위 기준선 {oos_base:.4f} → {ratio:.2f}배 (AUC-ROC {auc_oos:.4f})",
      "PR-AUC가 기준선(양성률)의 1.1배 초과. 미만이면 학습 실패")

# C2. 확률 보정
calib = p_in.mean() / base_rate
brier = brier_score_loss(y, p_in)
check("C2. 확률 보정", "PASS" if 0.9 <= calib <= 1.1 else "FAIL",
      f"예측 평균 {p_in.mean():.4f} ÷ 실제 급락률 {base_rate:.4f} = {calib:.2f}배 (Brier {brier:.4f})",
      "0.9~1.1배. 벗어나면 화면에 표시되는 확률이 허위 표기가 됨")

# C3. 과적합 정도
pr_in = average_precision_score(y, p_in)
gap = pr_in - pr_oos
check("C3. 과적합 정도", "PASS" if gap < 0.25 else "WARN",
      f"in-sample PR-AUC {pr_in:.4f} vs OOS {pr_oos:.4f} → 격차 {gap:.4f}",
      "격차 0.25 미만 권장. 크면 in-sample 수치를 성과로 인용하면 안 됨")

# C4. 날씨 등급 단조성 (OOS)
sub = train.iloc[idx_oos].copy()
sub["p"] = p_oos
mk = sub.groupby("date")["p"].transform("mean").values
adj = np.clip(p_oos - 0.7 * (mk - float(np.median(p_oos))), 0, 1)
c1, c2, c3 = WEATHER_CUTS
grade = np.select([adj < c1, adj < c2, adj < c3], ["맑음", "구름", "비"], default="번개")
rates, lines = [], []
for g_ in ["맑음", "구름", "비", "번개"]:
    msk = grade == g_
    if msk.sum():
        rt = y_oos[msk].mean()
        rates.append(rt)
        lines.append(f"{g_} {rt:.3f}(n={msk.sum():,})")
mono = all(rates[i] <= rates[i + 1] for i in range(len(rates) - 1))
check("C4. 날씨 등급 단조성 (OOS)", "PASS" if mono else "WARN",
      " → ".join(lines),
      "등급이 나빠질수록 실제 급락률이 높아져야 함 (단조 증가)")

# C5. 무기여 피처
imp = pd.Series(m_in.feature_importances_, index=FEATURES).sort_values()
dead = imp[imp == 0]
check("C5. 무기여 피처", "PASS" if len(dead) == 0 else "WARN",
      f"기여도 0인 피처 {len(dead)}개" + (f": {list(dead.index)}" if len(dead) else ""),
      "0개 권장. 있으면 데이터가 비었거나 사건이 너무 희소함")

# ══════════════════════════════════════════════════════════════════
section("D. 단계별 기여도 — 무엇을 넣었더니 얼마나 좋아졌나")

# 피처를 누적해가며 같은 방식(엠바고 워크포워드)으로 평가한다.
PRICE = ["log_return_1d", "volatility_20d", "volume_zscore", "beta_60d"]
MACRO = ["macro_rate", "macro_fx"]
DISC = ["capital_event_flag", "delisting_related_flag"]
NEWS = ["category_material_value", "category_immaterial_value"]


def eval_cols(cols):
    """엠바고 워크포워드로 학습·평가하고 테스트 구간 예측을 반환"""
    preds = []
    for tr_i, te_i in folds:
        mm = XGBClassifier(n_estimators=100, max_depth=3, eval_metric="logloss",
                           random_state=42)
        mm.fit(X.iloc[tr_i][cols], y.iloc[tr_i])
        preds.append(mm.predict_proba(X.iloc[te_i][cols])[:, 1])
    return np.concatenate(preds)


def eval_rule(col):
    """학습 없이 해당 피처값 자체를 위험 점수로 사용"""
    return np.concatenate([X.iloc[te_i][col].values for _, te_i in folds])


ladder = []
# 1) 그냥 데이터만 — 학습 없음
ladder.append(("① 아무것도 안 함 (전부 평균 확률)", np.full(len(y_oos), oos_base)))
ladder.append(("① 단순 규칙 — 변동성 값만 사용(학습 X)", eval_rule("volatility_20d")))
# 2) 학습했을 때
ladder.append(("② 학습 — 가격 피처만", eval_cols(PRICE)))
# 3) 거시·공시 추가
ladder.append(("③ + 거시(금리·환율)", eval_cols(PRICE + MACRO)))
ladder.append(("③ + 공시(자본이벤트·상장폐지)", eval_cols(PRICE + MACRO + DISC)))
# 4) 뉴스 추가
ladder.append(("④ + 뉴스(DL 감성·카테고리)", eval_cols(PRICE + MACRO + DISC + NEWS)))

print(f"  {'단계':<38}{'PR-AUC':>9}{'AUC-ROC':>10}{'기준선대비':>11}")
print(f"  {'-' * 66}")
ladder_rows = []
for name, pr in ladder:
    pa = average_precision_score(y_oos, pr)
    ar = roc_auc_score(y_oos, pr)
    ladder_rows.append((name, pa, ar, pa / oos_base))
    print(f"  {name:<38}{pa:>9.4f}{ar:>10.4f}{pa / oos_base:>10.2f}배")
print()


def boot_delta(pa_, pb_, metric, B=2000, seed=0):
    """두 단계의 성능 차이에 대한 부트스트랩 신뢰구간"""
    rng = np.random.default_rng(seed)
    idx = np.arange(len(y_oos))
    diffs = []
    for _ in range(B):
        s_ = rng.choice(idx, len(idx), replace=True)
        if len(np.unique(y_oos[s_])) < 2:
            continue
        diffs.append(metric(y_oos[s_], pb_[s_]) - metric(y_oos[s_], pa_[s_]))
    d = np.array(diffs)
    return float(np.percentile(d, 2.5)), float(np.percentile(d, 97.5)), float((d > 0).mean())


print("  [각 단계가 정말 기여했는지 — 부트스트랩 95% 신뢰구간]\n")
steps = [
    ("학습의 기여      (단순규칙 → 학습)", ladder[1][1], ladder[2][1]),
    ("거시의 기여      (가격 → +거시)", ladder[2][1], ladder[3][1]),
    ("공시의 기여      (+거시 → +공시)", ladder[3][1], ladder[4][1]),
    ("뉴스의 기여      (+공시 → +뉴스)", ladder[4][1], ladder[5][1]),
]
contrib = []
for label, pa_, pb_ in steps:
    lo, hi, pwin = boot_delta(pa_, pb_, average_precision_score)
    verdict = "기여 확인" if lo > 0 else ("악화" if hi < 0 else "판단 불가(0 포함)")
    contrib.append((label, lo, hi, pwin, verdict))
    print(f"  {label:<34} ΔPR-AUC 95%CI [{lo:+.4f}, {hi:+.4f}]  P(개선)={pwin:.2f}  → {verdict}")
print()

news_lo, news_hi, news_p = contrib[-1][1], contrib[-1][2], contrib[-1][3]
check("D1. 뉴스의 급락 예측 기여", "PASS" if news_lo > 0 else "WARN",
      f"ΔPR-AUC 95%CI [{news_lo:+.4f}, {news_hi:+.4f}], P(개선)={news_p:.2f}",
      "신뢰구간 하한 > 0 이어야 '기여했다'고 말할 수 있음")

# ══════════════════════════════════════════════════════════════════
section("종합")

n_pass = sum(1 for _, s, _, _ in results if s == "PASS")
n_warn = sum(1 for _, s, _, _ in results if s == "WARN")
n_fail = sum(1 for _, s, _, _ in results if s == "FAIL")
print(f"  ✅ PASS {n_pass}   ⚠️  WARN {n_warn}   ❌ FAIL {n_fail}\n")

if n_fail:
    print("  ❌ FAIL 항목 — 반드시 조치 필요")
    for nm, s, d, _ in results:
        if s == "FAIL":
            print(f"     · {nm}: {d}")
    print()
if n_warn:
    print("  ⚠️  WARN 항목 — 확인 권장 (프로젝트 한계로 알고 있으면 무방)")
    for nm, s, d, _ in results:
        if s == "WARN":
            print(f"     · {nm}: {d}")
    print()

# ══════════════════════════════════════════════════════════════════
# 리포트 파일 생성
from datetime import datetime

REPORT = PROJECT_ROOT / "reports" / "health_check.md"
REPORT.parent.mkdir(parents=True, exist_ok=True)

ICON = {"PASS": "✅", "WARN": "⚠️", "FAIL": "❌"}
md = [
    "# 데이터·모델 건강검진 리포트",
    "",
    f"> 생성 시각: {datetime.now().strftime('%Y-%m-%d %H:%M')}  ",
    f"> 대상: `data/ml_ready_real.csv` — {n_rows:,}행 · {n_tickers}개 종목 · {span}  ",
    f"> 결과: **PASS {n_pass} · WARN {n_warn} · FAIL {n_fail}**",
    "",
    "이 리포트는 `backend/scripts/health_check.py`가 자동 생성합니다.",
    "",
    "---",
    "",
    "## 요약",
    "",
    "| 항목 | 판정 | 결과 |",
    "| --- | :---: | --- |",
]
for nm, s, d, _ in results:
    md.append(f"| {nm} | {ICON[s]} {s} | {d} |")

md += [
    "",
    "---",
    "",
    "## 단계별 기여도",
    "",
    "동일한 엠바고 워크포워드 검증으로, 피처를 누적해가며 측정했습니다.",
    f"무작위 기준선(양성률) = **{oos_base:.4f}**",
    "",
    "| 단계 | PR-AUC | AUC-ROC | 기준선 대비 |",
    "| --- | ---: | ---: | ---: |",
]
for name, pa, ar, rt in ladder_rows:
    md.append(f"| {name} | {pa:.4f} | {ar:.4f} | {rt:.2f}배 |")

md += [
    "",
    "### 각 단계가 정말 기여했는가 (부트스트랩 95% 신뢰구간)",
    "",
    "| 단계 | ΔPR-AUC 95% 신뢰구간 | P(개선) | 판정 |",
    "| --- | --- | ---: | --- |",
]
for label, lo, hi, pwin, verdict in contrib:
    md.append(f"| {label.strip()} | [{lo:+.4f}, {hi:+.4f}] | {pwin:.2f} | **{verdict}** |")

md += [
    "",
    "> 신뢰구간 하한이 0보다 커야 '기여했다'고 말할 수 있습니다.",
    "> 0을 포함하면 개선인지 우연인지 구분할 수 없다는 뜻입니다.",
    "",
    "---",
    "",
    "## 판정 기준",
    "",
    "| 항목 | 기준 |",
    "| --- | --- |",
]
for nm, s, d, c in results:
    if c:
        md.append(f"| {nm} | {c} |")

REPORT.write_text("\n".join(md) + "\n", encoding="utf-8")
print(f"  📄 리포트 생성: {REPORT.relative_to(PROJECT_ROOT)}\n")

raise SystemExit(1 if n_fail else 0)
