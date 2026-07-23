# backend/scripts/balance_training_data.py
import pandas as pd
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
INPUT_PATH = PROJECT_ROOT / "data" / "training" / "raw_news_training.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "training" / "raw_news_training.csv"

TARGET_TOTAL = 10000

def main():
    if not INPUT_PATH.exists():
        print(f"❌ 원본 학습용 파일이 존재하지 않습니다: {INPUT_PATH}")
        return

    df = pd.read_csv(INPUT_PATH)
    print(f"📊 원본 데이터 로드 완료 (총 {len(df)}건)")

    # 기업별 기사 수 확인
    counts = df["company"].value_counts()
    print("\n--- [원본 기업별 기사 분포] ---")
    print(counts)

    companies = counts.index.tolist()
    
    # 균등 상한선(Cap) 찾기 알고리즘
    # 상한선 C를 1부터 점진적으로 증가시키며 합이 10000이 되는 지점을 찾습니다.
    best_c = 1
    for c in range(1, len(df)):
        total = sum(min(count, c) for count in counts)
        if total >= TARGET_TOTAL:
            best_c = c
            break
            
    print(f"\n🎯 탐색된 최적의 기업별 최대 기사 수 상한선(Cap): {best_c}건")

    sampled_dfs = []
    for comp in companies:
        df_comp = df[df["company"] == comp]
        n_available = len(df_comp)
        
        # 상한선 c보다 기사가 적으면 전부 선택, 많으면 무작위 c개 선택
        if n_available <= best_c:
            sampled_dfs.append(df_comp)
        else:
            df_sampled = df_comp.sample(n=best_c, random_state=42)
            sampled_dfs.append(df_sampled)

    final_df = pd.concat(sampled_dfs, ignore_index=True)
    
    # 셔플하여 저장 (데이터 순서 무작위화)
    final_df = final_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # 만약 합치는 과정에서 약간의 소수점 단수 차이로 10000건보다 미세하게 초과되었다면 최종 슬라이싱
    if len(final_df) > TARGET_TOTAL:
        final_df = final_df.iloc[:TARGET_TOTAL]

    final_df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")
    print(f"\n🎉 [SUCCESS] 균등 샘플링 완료 및 덮어쓰기 성공!")
    print(f" - 최종 파일 경로: {OUTPUT_PATH}")
    print(f" - 최종 샘플링된 뉴스 건수: {len(final_df)}건")
    
    print("\n--- [조정 후 기업별 기사 분포] ---")
    print(final_df["company"].value_counts())

if __name__ == "__main__":
    main()
