import pandas as pd, numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss
from sklearn.ensemble import HistGradientBoostingClassifier
np.random.seed(0)
import os
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
df=pd.read_csv(os.path.join(base_dir, 'data', 'ml_ready_real.csv'))
df['date']=pd.to_datetime(df['date']); df=df.sort_values(['ticker','date']).reset_index(drop=True)
H,THR=20,-0.10
def lab(g):
    r=g['log_return_1d'].fillna(0).values;n=len(r);L=np.full(n,np.nan)
    for t in range(n):
        if t+H>=n:break
        L[t]=1.0 if (np.exp(np.cumsum(r[t+1:t+1+H]).min())-1)<=THR else 0.0
    g=g.copy();g['y']=L;return g
df=df.groupby('ticker',group_keys=False).apply(lab)
def roll(g):
    g=g.copy()
    for w in (5,20):
        g[f'mat_{w}']=g['category_material_value'].rolling(w,min_periods=1).sum()
        g[f'negcnt_{w}']=(g['category_material_value']<0).rolling(w,min_periods=1).sum()
    return g
df=df.groupby('ticker',group_keys=False).apply(roll)
price=['log_return_1d','volatility_20d','volume_zscore','beta_60d','macro_rate','macro_fx']
news=['category_material_value','category_immaterial_value','esg_material_value','mat_5','mat_20','negcnt_5','negcnt_20']
disc=['capital_event_flag','delisting_related_flag']
df=df.dropna(subset=['y','volatility_20d','beta_60d']).reset_index(drop=True)
for c in price+news+disc: df[c]=df[c].fillna(0)
d=df.sort_values('date').reset_index(drop=True); y=d['y'].astype(int).values
n=len(d);GAP=20;folds=[]
for k in range(4):
    te=int(n*(0.4+0.15*k));ts=te+GAP;e=min(int(n*(0.4+0.15*(k+1)))+GAP,n)
    if ts<e: folds.append((np.arange(0,te-GAP),np.arange(ts,e)))
def mk():return HistGradientBoostingClassifier(max_depth=3,learning_rate=0.05,max_iter=200,class_weight='balanced')
def run_model(cols):
    pr=[];ys=[]
    X=d[cols].values
    for tr,te in folds:
        m=mk();m.fit(X[tr],y[tr]);pr.append(m.predict_proba(X[te])[:,1]);ys.append(y[te])
    return np.concatenate(pr),np.concatenate(ys)
def run_rule(col):  # 학습 없이 그 피처값 자체를 위험점수로
    pr=[];ys=[]
    for tr,te in folds: pr.append(d[col].values[te]);ys.append(y[te])
    return np.concatenate(pr),np.concatenate(ys)
# 테스트 정답 (공통)
yt=np.concatenate([y[te] for _,te in folds])
base=yt.mean()
def metrics(p): return roc_auc_score(yt,p), average_precision_score(yt,p), brier_score_loss(yt,(p-p.min())/(p.max()-p.min()+1e-9))
print('공통 테스트 급락 양성률(기준선):',round(base,3),' | 테스트행',len(yt))
print()
print(f'{"단계":<34}{"AUC-ROC":>9}{"PR-AUC":>9}')
# L0 그냥 예측: 모두 기준선 확률
p0=np.full(len(yt),base)
print(f'{"L0 그냥예측(모두 기준선)":<32}{0.500:>9.3f}{base:>9.3f}')
# L1 단순 규칙: 변동성 높으면 위험
p1,_=run_rule('volatility_20d')
print(f'{"L1 단순규칙(변동성만)":<33}{roc_auc_score(yt,p1):>9.3f}{average_precision_score(yt,p1):>9.3f}')
# L2 ML 가격+거시
p2,_=run_model(price); a2,pr2,_=metrics(p2)
print(f'{"L2 ML(가격+거시) ★":<33}{a2:>9.3f}{pr2:>9.3f}')
# L3 ML+DL 뉴스
p3,_=run_model(price+news); a3,pr3,_=metrics(p3)
print(f'{"L3 +뉴스(DL신호)":<34}{a3:>9.3f}{pr3:>9.3f}')
# L4 +공시
p4,_=run_model(price+news+disc); a4,pr4,_=metrics(p4)
print(f'{"L4 +공시":<35}{a4:>9.3f}{pr4:>9.3f}')
def boot(pa,pb,met,B=2000):
    dd=[];idx=np.arange(len(yt))
    for _ in range(B):
        s=np.random.choice(idx,len(idx),replace=True)
        if len(np.unique(yt[s]))<2:continue
        dd.append(met(yt[s],pb[s])-met(yt[s],pa[s]))
    dd=np.array(dd);return np.percentile(dd,2.5),np.percentile(dd,97.5),(dd>0).mean()
print('\n[상승이 진짜인지 신뢰구간으로 확인]')
lo,hi,pp=boot(p0,p2,roc_auc_score)
print(f'L0 → L2 (그냥예측 → ML)   ΔAUC 95%CI[{lo:+.3f},{hi:+.3f}] P(개선)={pp:.2f}  ← ML의 실제 기여')
lo,hi,pp=boot(p2,p3,average_precision_score)
print(f'L2 → L3 (ML → +뉴스DL)    ΔPR-AUC 95%CI[{lo:+.3f},{hi:+.3f}] P(개선)={pp:.2f}  ← 뉴스의 실제 기여')