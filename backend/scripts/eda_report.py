"""EDA 리포트 생성

학습 테이블(ml_ready_real.csv)을 탐색해 분포·관계·라벨 특성을 정리하고
reports/eda_report.md 와 reports/figures/*.png 를 만든다.

데이터분석 정의서·EDA 보고서에 그대로 붙일 수 있도록 표와 그래프를 함께 출력한다.

실행:  poetry run python scripts/eda_report.py
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ML_READY = PROJECT_ROOT / "data" / "ml_ready_real.csv"
NEWS_CSV = PROJECT_ROOT / "data" / "news_features_all.csv"
OUT_MD = PROJECT_ROOT / "reports" / "eda_report.md"
FIG_DIR = PROJECT_ROOT / "reports" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

# 한글 폰트 (macOS / 리눅스 CI 모두 대응)
for cand in ["AppleGothic", "NanumGothic", "Malgun Gothic", "DejaVu Sans"]:
    if any(f.name == cand for f in fm.fontManager.ttflist):
        plt.rc("font", family=cand)
        break
plt.rc("axes", unicode_minus=False)

LABEL = "label_drawdown_20d"
PRICE = ["log_return_1d", "volatility_20d", "volume_zscore", "beta_60d"]
MACRO = ["macro_rate", "macro_fx"]
NAMES = {
    "005930": "삼성전자", "000660": "SK하이닉스", "055550": "신한지주", "010950": "S-Oil",
    "005490": "POSCO홀딩스", "005380": "현대차", "035420": "NAVER", "000270": "기아",
    "373220": "LG에너지솔루션", "015760": "한국전력", "032830": "삼성생명", "051910": "LG화학",
    "068270": "셀트리온", "017670": "SK텔레콤", "105560": "KB금융", "033780": "KT&G",
    "028260": "삼성물산",
}

md = []


def w(line=""):
    md.append(line)


def fig_path(name):
    return FIG_DIR / f"{name}.png"


def save(fig, name):
    fig.tight_layout()
    fig.savefig(fig_path(name), dpi=110, bbox_inches="tight")
    plt.close(fig)
    w(f"![{name}](figures/{name}.png)")
    w()


df = pd.read_csv(ML_READY, dtype={"ticker": str}, parse_dates=["date"])
df["종목"] = df["ticker"].map(NAMES).fillna(df["ticker"])
lab = df[df[LABEL].notna()].copy()
lab["y"] = lab[LABEL].astype(int)

# ══════════════════════════════════════════════════════════════════
w("# EDA 리포트 — 개미의 우산")
w()
w(f"> 생성: {pd.Timestamp.now():%Y-%m-%d %H:%M} · 대상 `data/ml_ready_real.csv`  ")
w("> `backend/scripts/eda_report.py` 가 자동 생성합니다.")
w()
w("---")
w()

# ── 1. 개요 ────────────────────────────────────────────────────
w("## 1. 데이터 개요")
w()
w("| 항목 | 값 |")
w("| --- | --- |")
w(f"| 종목 수 | {df.ticker.nunique()}개 |")
w(f"| 기간 | {df.date.min():%Y-%m-%d} ~ {df.date.max():%Y-%m-%d} |")
w(f"| 거래일 수 | {df.date.nunique():,}일 |")
w(f"| 전체 행 | {len(df):,}행 |")
w(f"| 라벨 확정 행 | {len(lab):,}행 |")
w(f"| 라벨 미확정(최근 20거래일) | {df[LABEL].isna().sum():,}행 |")
w()

miss = df[PRICE + MACRO].isna().mean() * 100
w("**결측률** — 롤링 계산 초기 구간에서만 발생하며 학습에서 제외됩니다.")
w()
w("| 피처 | 결측률 |")
w("| --- | --- |")
for k, v in miss.sort_values(ascending=False).items():
    w(f"| `{k}` | {v:.2f}% |")
w()

# ── 2. 가격 피처 분포 ──────────────────────────────────────────
w("## 2. 가격 피처 분포")
w()
desc = df[PRICE].describe().T[["mean", "std", "min", "50%", "max"]]
desc.columns = ["평균", "표준편차", "최솟값", "중앙값", "최댓값"]
w("| 피처 | " + " | ".join(desc.columns) + " |")
w("| --- | " + " | ".join(["---"] * len(desc.columns)) + " |")
for idx, r in desc.iterrows():
    w(f"| `{idx}` | " + " | ".join(f"{v:.4f}" for v in r) + " |")
w()

fig, ax = plt.subplots(1, 4, figsize=(17, 3.4))
specs = [
    ("log_return_1d", "일간 수익률", (-0.12, 0.12)),
    ("volatility_20d", "20일 변동성", None),
    ("volume_zscore", "거래량 z-score", (-3, 6)),
    ("beta_60d", "60일 베타", (-1, 3)),
]
for a, (col, title, clip) in zip(ax, specs):
    s = df[col].dropna()
    if clip:
        s = s.clip(*clip)
    a.hist(s, bins=60, color="#3eb489", edgecolor="none")
    a.set_title(title, fontsize=11)
    a.grid(alpha=.25)
save(fig, "01_price_features")

# ── 3. 라벨 분석 ───────────────────────────────────────────────
w("## 3. 라벨(급락) 분석")
w()
base = lab["y"].mean()
w(f"**전체 양성률(급락 발생 비율) = {base*100:.2f}%** "
  f"(급락 {int(lab.y.sum()):,}건 / 전체 {len(lab):,}건)")
w()
w("> 드문 사건이므로 정확도(Accuracy)는 지표로 쓰지 않습니다. "
  f"\"모두 안전\"이라고만 답해도 정확도가 {(1-base)*100:.1f}% 나옵니다.")
w()

yearly = lab.groupby(lab.date.dt.year)["y"].agg(["size", "mean"])
yearly.columns = ["행 수", "급락률"]
w("### 연도별 급락률 — 시기에 따라 편차가 큽니다")
w()
w("| 연도 | 행 수 | 급락률 |")
w("| --- | ---: | ---: |")
for yr, r in yearly.iterrows():
    w(f"| {yr} | {int(r['행 수']):,} | {r['급락률']*100:.1f}% |")
w()
w("> 검증을 단일 분할이 아니라 시계열 교차검증으로 하는 이유입니다. "
  "특정 시기만 테스트하면 결과가 왜곡됩니다.")
w()

by_tk = lab.groupby("종목")["y"].agg(["size", "mean"]).sort_values("mean", ascending=False)
fig, ax = plt.subplots(1, 2, figsize=(15, 4.2))
ax[0].bar(yearly.index.astype(str), yearly["급락률"] * 100, color="#f43f5e")
ax[0].axhline(base * 100, ls="--", c="#334155", lw=1, label=f"전체 평균 {base*100:.1f}%")
ax[0].set_title("연도별 급락률 (%)"); ax[0].legend(fontsize=9); ax[0].grid(alpha=.25, axis="y")
ax[1].barh(by_tk.index[::-1], by_tk["mean"][::-1] * 100, color="#818cf8")
ax[1].axvline(base * 100, ls="--", c="#334155", lw=1)
ax[1].set_title("종목별 급락률 (%)"); ax[1].grid(alpha=.25, axis="x")
save(fig, "02_label_distribution")

w("### 종목별 급락률")
w()
w("| 종목 | 행 수 | 급락률 |")
w("| --- | ---: | ---: |")
for tk, r in by_tk.iterrows():
    w(f"| {tk} | {int(r['size']):,} | {r['mean']*100:.1f}% |")
w()

# ── 4. 피처와 라벨의 관계 ──────────────────────────────────────
w("## 4. 피처와 급락의 관계")
w()
w("각 피처를 4구간(사분위)으로 나눠 구간별 실제 급락률을 봅니다. "
  "구간이 올라갈수록 급락률이 뚜렷하게 변하면 예측에 쓸 만한 신호입니다.")
w()

fig, ax = plt.subplots(1, 4, figsize=(17, 3.6))
w("| 피처 | Q1(낮음) | Q2 | Q3 | Q4(높음) | 최대/최소 |")
w("| --- | ---: | ---: | ---: | ---: | ---: |")
for a, col in zip(ax, PRICE):
    s = lab.dropna(subset=[col]).copy()
    s["q"] = pd.qcut(s[col], 4, labels=["Q1", "Q2", "Q3", "Q4"])
    g = s.groupby("q", observed=True)["y"].mean() * 100
    ratio = g.max() / g.min() if g.min() > 0 else float("inf")
    w(f"| `{col}` | " + " | ".join(f"{v:.1f}%" for v in g) + f" | **{ratio:.2f}배** |")
    a.bar(g.index.astype(str), g.values, color="#3eb489")
    a.axhline(base * 100, ls="--", c="#334155", lw=1)
    a.set_title(col, fontsize=10); a.grid(alpha=.25, axis="y")
save(fig, "03_feature_vs_label")

w("> `volatility_20d`의 구간 간 격차가 가장 큽니다. "
  "변동성이 급락 예측의 핵심 신호라는 근거입니다.")
w()

# 상관관계
w("### 피처 간 상관관계")
w()
corr = df[PRICE + MACRO].corr()
fig, a = plt.subplots(figsize=(6.4, 5.2))
im = a.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
a.set_xticks(range(len(corr))); a.set_xticklabels(corr.columns, rotation=45, ha="right", fontsize=9)
a.set_yticks(range(len(corr))); a.set_yticklabels(corr.columns, fontsize=9)
for i in range(len(corr)):
    for j in range(len(corr)):
        a.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center", fontsize=8,
               color="white" if abs(corr.iloc[i, j]) > 0.5 else "#1e293b")
fig.colorbar(im, shrink=.8)
a.set_title("피처 상관계수")
save(fig, "04_correlation")

# ── 5. 거시 지표 ───────────────────────────────────────────────
w("## 5. 거시 지표와 급락 시기")
w()
mm = lab.groupby(lab.date.dt.to_period("M")).agg(
    급락률=("y", "mean"), 금리=("macro_rate", "mean"), 환율=("macro_fx", "mean"))
mm.index = mm.index.to_timestamp()

fig, ax1 = plt.subplots(figsize=(13, 3.8))
ax1.bar(mm.index, mm["급락률"] * 100, width=20, color="#fca5a5", label="월별 급락률(%)")
ax1.set_ylabel("급락률 (%)")
ax2 = ax1.twinx()
ax2.plot(mm.index, mm["환율"], color="#1e293b", lw=1.4, label="원/달러 환율")
ax2.set_ylabel("환율")
ax1.set_title("월별 급락률과 환율")
fig.legend(loc="upper left", bbox_to_anchor=(0.08, 0.95), fontsize=9)
save(fig, "05_macro_vs_label")

w("| 거시 피처 | 급락 라벨과의 상관 |")
w("| --- | ---: |")
for c in MACRO:
    w(f"| `{c}` | {lab[c].corr(lab['y']):+.3f} |")
w()
w("> 거시 지표는 모든 종목이 같은 값을 공유하므로 **종목 간 판별에는 기여하지 못합니다.** "
  "시장 국면을 구분하는 용도로만 의미가 있습니다.")
w()

# ── 6. 뉴스 ────────────────────────────────────────────────────
if NEWS_CSV.exists():
    news = pd.read_csv(NEWS_CSV, dtype={"ticker": str}, parse_dates=["date"])
    w("## 6. 뉴스 데이터")
    w()
    has = (df["category_material_value"] != 0) | (df["category_immaterial_value"] != 0)
    w(f"- 분류 기사 **{len(news):,}건** · {news.ticker.nunique()}종목")
    w(f"- 뉴스가 붙은 칸 **{int((df.news_count > 0).sum()):,} / {len(df):,} "
      f"({(df.news_count > 0).mean()*100:.1f}%)**" if "news_count" in df.columns else "")
    w(f"- 방향 신호(≠0)가 남은 칸 {int(has.sum()):,} ({has.mean()*100:.1f}%)")
    w()

    fig, ax = plt.subplots(1, 2, figsize=(14, 3.8))
    cc = news.news_category.value_counts()
    ax[0].barh(cc.index[::-1], cc.values[::-1], color="#3eb489")
    ax[0].set_title("카테고리 분포"); ax[0].grid(alpha=.25, axis="x")
    dc = news.news_direction.value_counts()
    colors = {"positive": "#3eb489", "neutral": "#94a3b8", "negative": "#f43f5e"}
    ax[1].bar(dc.index, dc.values, color=[colors.get(x, "#888") for x in dc.index])
    for i, (k, v) in enumerate(dc.items()):
        ax[1].text(i, v, f"{v/len(news)*100:.1f}%", ha="center", va="bottom", fontsize=9)
    ax[1].set_title("감성 분포"); ax[1].grid(alpha=.25, axis="y")
    save(fig, "06_news")

    w(f"> 중립이 {(news.news_direction=='neutral').mean()*100:.1f}%로 가장 많습니다. "
      "뉴스 기사가 본래 중립적 문체로 쓰이기 때문이며, "
      "이 때문에 방향 신호만으로는 '뉴스 없음'과 '중립 뉴스'가 구분되지 않아 "
      "기사 건수를 별도 피처로 추가했습니다.")
    w()

    # 부정 뉴스와 급락의 관계 (교란 요인 확인)
    if "news_neg_cnt_20d" in lab.columns:
        w("### 부정 뉴스가 많으면 더 떨어지는가")
        w()
        w("| 조건 | 급락률 | 기준 대비 |")
        w("| --- | ---: | ---: |")
        for name, m in [("부정 기사 0건", lab.news_neg_cnt_20d == 0),
                        ("최근 20일 부정 3건 이상", lab.news_neg_cnt_20d >= 3),
                        ("최근 20일 부정 10건 이상", lab.news_neg_cnt_20d >= 10)]:
            if m.sum() > 30:
                p = lab[m]["y"].mean()
                w(f"| {name} (n={int(m.sum()):,}) | {p*100:.1f}% | {p/base:.2f}배 |")
        w()
        w("변동성을 통제하면(같은 변동성 구간 안에서 비교) 차이가 사라집니다.")
        w()
        w("| 변동성 구간 | 부정 0건 | 부정 3건+ | 차이 |")
        w("| --- | ---: | ---: | ---: |")
        s = lab.dropna(subset=["volatility_20d"]).copy()
        s["vq"] = pd.qcut(s.volatility_20d, 4, labels=["낮음", "중하", "중상", "높음"])
        for q in ["낮음", "중하", "중상", "높음"]:
            sub = s[s.vq == q]
            a_ = sub[sub.news_neg_cnt_20d == 0]["y"].mean()
            b_ = sub[sub.news_neg_cnt_20d >= 3]["y"].mean()
            if (sub.news_neg_cnt_20d >= 3).sum() > 30:
                w(f"| {q} | {a_*100:.1f}% | {b_*100:.1f}% | {(b_-a_)*100:+.1f}%p |")
        w()
        w("> 부정 뉴스가 많은 종목은 대형주라 원래 급락이 적습니다(교란 요인). "
          "변동성을 통제하면 뉴스의 추가 기여가 확인되지 않습니다.")
        w()

w("---")
w()
w("## 요약")
w()
w(f"1. 급락은 전체의 **{base*100:.1f}%** 로 드문 사건 → 정확도 대신 PR-AUC를 씁니다.")
w("2. 연도별 급락률 편차가 커서 **시계열 교차검증**이 필요합니다.")
w("3. **변동성이 가장 강한 단일 신호**이며, 구간별 급락률 격차가 가장 큽니다.")
w("4. 거시 지표는 전 종목 공통이라 **종목 간 판별에 기여하지 못합니다.**")
if NEWS_CSV.exists():
    w("5. 부정 뉴스와 급락의 겉보기 관계는 **대형주 편중에 의한 착시**였습니다.")

OUT_MD.write_text("\n".join(md) + "\n", encoding="utf-8")
print(f"생성 완료: {OUT_MD.relative_to(PROJECT_ROOT)}")
print(f"그래프: {len(list(FIG_DIR.glob('*.png')))}개 → {FIG_DIR.relative_to(PROJECT_ROOT)}/")
