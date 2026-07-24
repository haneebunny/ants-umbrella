
"""
뉴스가 변동성 이상으로 급락 예측에 기여하는지 검증.
- 급락 라벨(label_drawdown_20d)을 log_return_1d에서 복원 (향후 20거래일 내 -10% 하락)
- 엠바고(gap=20) 적용한 시계열 CV
- (2) 변동성 국면 층화 비교 + 뉴스-보유 구간 비교 + 부트스트랩 CI
"""
import pandas as pd, numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score
import os
np.random.seed(42)

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.abspath(os.path.join(script_dir, '../../data/ml_ready_real.csv'))
df = pd.read_csv(csv_path)
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(['ticker','date']).reset_index(drop=True)

# ---------- 1) 급락 라벨 복원: 향후 20거래일 내 누적수익률이 -10% 이하로 떨어지면 1 ----------
H = 20; THR = -0.10
def make_label(g):
    r = g['log_return_1d'].fillna(0).values
    n = len(r); lab = np.full(n, np.nan)
    for t in range(n):
        if t + H >= n:   # 미래 20일 확보 안 되면 라벨 없음
            break
        fwd = np.cumsum(r[t+1:t+1+H])          # t 이후 누적 로그수익률
        simple_min = np.exp(fwd.min()) - 1     # 창 내 최저점 단순수익률
        lab[t] = 1.0 if simple_min <= THR else 0.0
    g = g.copy(); g['label_drawdown_20d'] = lab
    return g
df = df.groupby('ticker', group_keys=False).apply(make_label)

price = ['log_return_1d','volatility_20d','volume_zscore','beta_60d','macro_rate','macro_fx']
news  = ['category_material_value','category_immaterial_value','non_esg_material_value','esg_material_value']
df = df.dropna(subset=['label_drawdown_20d','volatility_20d','beta_60d']).reset_index(drop=True)
for c in price+news: df[c] = df[c].fillna(0)
y = df['label_drawdown_20d'].astype(int).values

print('='*70)
print('복원 급락 라벨 양성률: %.3f  (n=%d)' % (y.mean(), len(y)))
neg_mat = (df['category_material_value'] < 0)
any_news = (df[news] != 0).any(axis=1)
print('material 부정뉴스 보유 행: %d (%.2f%%)' % (neg_mat.sum(), 100*neg_mat.mean()))
print('아무 뉴스라도 있는 행: %d (%.2f%%)' % (any_news.sum(), 100*any_news.mean()))

# ---------- 2) 변동성 국면 층화: 같은 변동성 안에서 부정뉴스가 급락률을 높이나? ----------
print('\n' + '='*70)
print('[분석A] 변동성 4분위 × material 부정뉴스 유무별 급락 발생률')
print('-'*70)
df['_volq'] = pd.qcut(df['volatility_20d'], 4, labels=['Q1(저)','Q2','Q3','Q4(고)'])
print(f'{"변동성구간":<10}{"부정뉴스無 급락률":>16}{"부정뉴스有 급락률":>16}{"(n無/n有)":>16}{"차이":>10}')
for q in ['Q1(저)','Q2','Q3','Q4(고)']:
    m = df['_volq']==q
    a = df.loc[m & ~neg_mat, 'label_drawdown_20d']
    b = df.loc[m &  neg_mat, 'label_drawdown_20d']
    diff = (b.mean()-a.mean()) if len(b)>0 else float('nan')
    print(f'{q:<12}{a.mean():>14.3f}{b.mean():>16.3f}{f"({len(a)}/{len(b)})":>18}{diff:>+10.3f}')

# ---------- 3) 모델 Ablation + 엠바고(gap=20) 시계열 CV + 부트스트랩 CI ----------
try:
    from xgboost import XGBClassifier
    def mk(): return XGBClassifier(n_estimators=120,max_depth=3,learning_rate=0.05,
        subsample=0.8,colsample_bytree=0.8,eval_metric='logloss',
        scale_pos_weight=float((y==0).sum()/max((y==1).sum(),1)),verbosity=0,n_jobs=2)
    MODEL='XGBoost'
except Exception:
    from sklearn.ensemble import HistGradientBoostingClassifier
    def mk(): return HistGradientBoostingClassifier(max_depth=3,learning_rate=0.05,max_iter=200)
    MODEL='HistGBM(sklearn)'

order = df.sort_values('date').index.values
Xall = df.loc[order]; yy = y[order]
dates = Xall['date'].values
GAP = 20
n = len(Xall)
folds = []
for k in range(4):  # 확장형 시계열 4-fold + 엠바고
    tr_end = int(n*(0.4 + 0.15*k))
    te_start = tr_end + GAP                 # 엠바고: 학습끝~테스트시작 사이 20행 비움
    te_end = int(n*(0.4 + 0.15*(k+1))) + GAP
    if te_end > n: te_end = n
    if te_start >= te_end: continue
    folds.append((np.arange(0,tr_end-GAP), np.arange(te_start,te_end)))  # 학습끝도 20행 purge

def evalset(cols):
    aucs=[]; prs=[]; preds=[]; ys=[]
    X = Xall[cols].values
    for tr,te in folds:
        m=mk(); m.fit(X[tr],yy[tr])
        p=m.predict_proba(X[te])[:,1]
        aucs.append(roc_auc_score(yy[te],p)); prs.append(average_precision_score(yy[te],p))
        preds.append(p); ys.append(yy[te])
    return np.array(aucs),np.array(prs),np.concatenate(preds),np.concatenate(ys)

print('\n' + '='*70)
print(f'[분석B] Ablation ({MODEL}, 엠바고 gap={GAP} 적용, 시계열 4-fold)')
print('-'*70)
aA,pA,predA,yA = evalset(price)
aB,pB,predB,yB = evalset(price+news)
print(f'Model A (가격+거시)      AUC {aA.mean():.4f}±{aA.std():.4f}   PR-AUC {pA.mean():.4f}±{pA.std():.4f}')
print(f'Model B (+뉴스)          AUC {aB.mean():.4f}±{aB.std():.4f}   PR-AUC {pB.mean():.4f}±{pB.std():.4f}')
print(f'ΔAUC {aB.mean()-aA.mean():+.4f}   ΔPR-AUC {pB.mean()-pA.mean():+.4f}')

# 부트스트랩 CI (동일 테스트 예측을 재표집)
def boot_ci(yt, pa, pb, metric, B=2000):
    d=[]
    idx=np.arange(len(yt))
    for _ in range(B):
        s=np.random.choice(idx,len(idx),replace=True)
        if len(np.unique(yt[s]))<2: continue
        d.append(metric(yt[s],pb[s])-metric(yt[s],pa[s]))
    d=np.array(d); return np.percentile(d,2.5), np.percentile(d,97.5), (d>0).mean()
lo,hi,pp = boot_ci(yA,predA,predB,roc_auc_score)
lo2,hi2,pp2 = boot_ci(yA,predA,predB,average_precision_score)
print(f'ΔAUC   95%CI [{lo:+.4f}, {hi:+.4f}]  P(Δ>0)={pp:.2f}')
print(f'ΔPRAUC 95%CI [{lo2:+.4f}, {hi2:+.4f}]  P(Δ>0)={pp2:.2f}')

# ---------- 4) 뉴스 있는 구간에서만 재평가 ----------
print('\n' + '='*70)
print('[분석C] 뉴스 신호가 있는 행에서만 A vs B 재평가 (효과 희석 제거)')
print('-'*70)
mask = (Xall[news].values!=0).any(axis=1)
def sub(pred): return pred
for name,pred in [('A',predA),('B',predB)]:
    pass
# 테스트 concat 순서가 fold별이라, 뉴스마스크도 동일 순서로 재구성
newsmask_te=[]
for tr,te in folds: newsmask_te.append(mask[te])
newsmask_te=np.concatenate(newsmask_te)
if newsmask_te.sum()>20 and len(np.unique(yA[newsmask_te]))>1:
    print(f'뉴스보유 테스트행 {int(newsmask_te.sum())}개:')
    print(f'  Model A  AUC {roc_auc_score(yA[newsmask_te],predA[newsmask_te]):.4f}  PR-AUC {average_precision_score(yA[newsmask_te],predA[newsmask_te]):.4f}')
    print(f'  Model B  AUC {roc_auc_score(yB[newsmask_te],predB[newsmask_te]):.4f}  PR-AUC {average_precision_score(yB[newsmask_te],predB[newsmask_te]):.4f}')
else:
    print('뉴스보유 테스트행이 너무 적어 재평가 불가:', int(newsmask_te.sum()))

# ---------- 5) 피처 중요도 ----------
print('\n' + '='*70)
print('[참고] Model B 피처 중요도 (전체 학습)')
print('-'*70)
mfull=mk(); mfull.fit(Xall[price+news].values, yy)
if hasattr(mfull,'feature_importances_'):
    imp=sorted(zip(price+news, mfull.feature_importances_), key=lambda x:-x[1])
    for f,v in imp: print(f'  {f:<28}{v:.4f}')