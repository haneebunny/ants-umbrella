import pandas as pd, numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score
from sklearn.ensemble import HistGradientBoostingClassifier
import os
np.random.seed(42)
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.abspath(os.path.join(script_dir, '../../data/ml_ready_real.csv'))
df=pd.read_csv(csv_path)
df['date']=pd.to_datetime(df['date']); df=df.sort_values(['ticker','date']).reset_index(drop=True)
H=20;THR=-0.10
def lab(g):
    r=g['log_return_1d'].fillna(0).values;n=len(r);L=np.full(n,np.nan)
    for t in range(n):
        if t+H>=n:break
        L[t]=1.0 if (np.exp(np.cumsum(r[t+1:t+1+H]).min())-1)<=THR else 0.0
    g=g.copy();g['y']=L;return g
df=df.groupby('ticker',group_keys=False).apply(lab)
# 롤링 뉴스 피처 (과거만 사용: shift 없이 rolling은 현재 포함이나 뉴스는 당일 발생분이라 t시점 관측가능)
def roll(g):
    g=g.copy()
    for w in (5,20):
        g[f'mat_{w}']=g['category_material_value'].rolling(w,min_periods=1).sum()
        g[f'immat_{w}']=g['category_immaterial_value'].rolling(w,min_periods=1).sum()
        g[f'negcnt_{w}']=(g['category_material_value']<0).rolling(w,min_periods=1).sum()
        g[f'newscnt_{w}']=(g['category_material_value']!=0).rolling(w,min_periods=1).sum()
    return g
df=df.groupby('ticker',group_keys=False).apply(roll)
price=['log_return_1d','volatility_20d','volume_zscore','beta_60d','macro_rate','macro_fx']
daily=['category_material_value','category_immaterial_value','non_esg_material_value','esg_material_value']
rollf=[f'{a}_{w}' for w in(5,20) for a in('mat','immat','negcnt','newscnt')]
df=df.dropna(subset=['y','volatility_20d','beta_60d']).reset_index(drop=True)
for c in price+daily+rollf: df[c]=df[c].fillna(0)
d=df.sort_values('date').reset_index(drop=True); y=d['y'].astype(int).values
n=len(d);GAP=20;folds=[]
for k in range(4):
    tr_end=int(n*(0.4+0.15*k));ts=tr_end+GAP;te=min(int(n*(0.4+0.15*(k+1)))+GAP,n)
    if ts<te: folds.append((np.arange(0,tr_end-GAP),np.arange(ts,te)))
def mk():return HistGradientBoostingClassifier(max_depth=3,learning_rate=0.05,max_iter=200,class_weight='balanced')
def ev(cols):
    X=d[cols].values;A=[];P=[];pr=[];ys=[]
    for tr,te in folds:
        m=mk();m.fit(X[tr],y[tr]);p=m.predict_proba(X[te])[:,1]
        A.append(roc_auc_score(y[te],p));P.append(average_precision_score(y[te],p));pr.append(p);ys.append(y[te])
    return np.array(A),np.array(P),np.concatenate(pr),np.concatenate(ys)
def boot(yt,pa,pb,met,B=1500):
    dd=[];idx=np.arange(len(yt))
    for _ in range(B):
        s=np.random.choice(idx,len(idx),replace=True)
        if len(np.unique(yt[s]))<2:continue
        dd.append(met(yt[s],pb[s])-met(yt[s],pa[s]))
    dd=np.array(dd);return np.percentile(dd,2.5),np.percentile(dd,97.5),(dd>0).mean()
print('급락 양성률 %.3f  n=%d'%(y.mean(),n))
aA,pA,prA,yA=ev(price)
aB,pB,prB,yB=ev(price+daily)
aC,pC,prC,yC=ev(price+daily+rollf)
print('\n엠바고 gap=20, 시계열 4-fold, class_weight=balanced')
print('A 가격+거시      AUC %.4f±%.4f  PR %.4f±%.4f'%(aA.mean(),aA.std(),pA.mean(),pA.std()))
print('B +뉴스(일별)    AUC %.4f±%.4f  PR %.4f±%.4f'%(aB.mean(),aB.std(),pB.mean(),pB.std()))
print('C +뉴스(롤링)    AUC %.4f±%.4f  PR %.4f±%.4f'%(aC.mean(),aC.std(),pC.mean(),pC.std()))
for nm,pr in [('B-A',prB),('C-A',prC)]:
    lo,hi,pp=boot(yA,prA,pr,roc_auc_score);l2,h2,p2=boot(yA,prA,pr,average_precision_score)
    print(f'{nm}: ΔAUC 95%CI[{lo:+.4f},{hi:+.4f}] P(>0)={pp:.2f} | ΔPR 95%CI[{l2:+.4f},{h2:+.4f}] P(>0)={p2:.2f}')
# 뉴스보유 테스트행만
mask=(d[daily].values!=0).any(axis=1);mt=np.concatenate([mask[te] for _,te in folds])
if mt.sum()>20:
    print('\n뉴스보유 테스트행 %d개:'%mt.sum())
    print('  A  AUC %.4f PR %.4f'%(roc_auc_score(yA[mt],prA[mt]),average_precision_score(yA[mt],prA[mt])))
    print('  C  AUC %.4f PR %.4f'%(roc_auc_score(yC[mt],prC[mt]),average_precision_score(yC[mt],prC[mt])))