# backend/scripts/validate_incoming_data.py
import pandas as pd
from pathlib import Path
from pydantic import ValidationError
import sys

# app 모듈을 로드하기 위해 backend 경로를 sys.path에 추가
sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.schemas import NewsFeature, SupplementarySignal, PriceFeature

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"

def validate_csv(file_path: Path, model_cls, name: str) -> bool:
    print(f"=== {name} ({file_path.name}) 검증 시작 ===")
    if not file_path.exists():
        print(f"[ERROR] 파일이 존재하지 않습니다: {file_path}")
        return False
    
    # ticker 컬럼을 명시적으로 문자열(str)로 읽어서 Pydantic 검증 에러 방지
    df = pd.read_csv(file_path, dtype={"ticker": str})
    print(f"총 행 수: {len(df)}")
    
    errors = 0
    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        
        # Pydantic Date 형식으로 변환
        if "date" in row_dict and isinstance(row_dict["date"], str):
            try:
                row_dict["date"] = pd.to_datetime(row_dict["date"]).date()
            except Exception as e:
                print(f"[Row {idx}] 날짜 파싱 오류: {row_dict['date']}, {e}")
                errors += 1
                continue
                
        # is_material numeric Literal[0, 1] 변환
        if "is_material" in row_dict:
            try:
                if pd.isna(row_dict["is_material"]):
                    row_dict["is_material"] = 0
                else:
                    row_dict["is_material"] = int(row_dict["is_material"])
            except Exception as e:
                print(f"[Row {idx}] is_material 인트 캐스팅 오류: {row_dict['is_material']}, {e}")
                errors += 1
                continue

        # news_related bool 캐스팅
        if "news_related" in row_dict:
            try:
                row_dict["news_related"] = bool(row_dict["news_related"])
            except:
                pass

        try:
            # PriceFeature 검증 시 CSV 파일에 아직 결합되지 않은 macro_rate 및 macro_fx 더미 값 보완
            if model_cls == PriceFeature:
                if "macro_rate" not in row_dict or pd.isna(row_dict["macro_rate"]):
                    row_dict["macro_rate"] = 0.0
                if "macro_fx" not in row_dict or pd.isna(row_dict["macro_fx"]):
                    row_dict["macro_fx"] = 0.0
                if "sector" not in row_dict or pd.isna(row_dict["sector"]):
                    row_dict["sector"] = "UNKNOWN"
            
            model_cls(**row_dict)
        except ValidationError as e:
            errors += 1
            if errors <= 5:  # 처음 5개 검증 오류만 요약 출력
                print(f"[Row {idx}] Pydantic 검증 에러:")
                print(e)
                
    if errors > 0:
        print(f"[결과] {name} 검증 실패 (총 에러 건수: {errors} / 전체 {len(df)}행)\n")
        return False
    else:
        print(f"[결과] {name} 검증 성공! 모든 행이 스키마 규격에 일치합니다. (총 {len(df)}행)\n")
        return True

if __name__ == "__main__":
    # 파일 경로 동적 타겟팅 (fallback 포함)
    news_path = DATA_DIR / "news_features_day2.csv"
    if not news_path.exists():
        news_path = DATA_DIR / "news_features_dummy.csv"
        
    supp_path = DATA_DIR / "supplementary_signals.csv"
    price_path = DATA_DIR / "price_features_labeled.csv"

    v1 = validate_csv(news_path, NewsFeature, "뉴스 사건 피처")
    v2 = validate_csv(supp_path, SupplementarySignal, "보조 신호")
    v3 = validate_csv(price_path, PriceFeature, "가격 피처")
    
    if not (v1 and v2 and v3):
        print("[FAIL] 일부 입력 데이터가 schemas.py 정합성 검증을 통과하지 못했습니다.")
        sys.exit(1)
    else:
        print("[PASS] 모든 입력 데이터가 schemas.py 스키마 규격에 완벽히 부합합니다.")
        sys.exit(0)
