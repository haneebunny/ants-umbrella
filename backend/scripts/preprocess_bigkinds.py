# backend/scripts/preprocess_bigkinds.py
import pandas as pd
import sys
import os
import re
import glob
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
TRAINING_DIR = PROJECT_ROOT / "data" / "training"

# 파일명에 포함된 단어와 우리 포트폴리오 기업명 매핑 테이블 (소문자 기준 매칭)
FILENAME_TO_COMPANY = {
    "kb금융": "KB금융",
    "kia": "기아",
    "기아": "기아",
    "kt": "KT&G",  # KT&G_... 매칭 지원
    "kt&g": "KT&G",
    "lg에너지솔루션": "LG에너지솔루션",
    "lg화학": "LG화학",
    "naver": "NAVER",
    "posco": "POSCO홀딩스",
    "posco홀딩스": "POSCO홀딩스",
    "s-oil": "S-Oil",
    "sk텔레콤": "SK텔레콤",
    "sk하이닉스": "SK하이닉스",
    "삼성물산": "삼성물산",
    "삼성생명": "삼성생명",
    "삼성전자": "삼성전자",
    "셀트리온": "셀트리온",
    "신한지주": "신한지주",
    "현대차": "현대차",
    "카카오": "카카오"
}

def clean_html(raw_text):
    if not isinstance(raw_text, str):
        return ""
    # HTML 태그 및 광고성 특수문자 전처리
    text = re.sub(r"<.*?>", "", raw_text)
    text = re.sub(r"▶.*", "", text)
    text = re.sub(r"[^\w\s가-힣.,!?]", " ", text)
    return text.strip()

def detect_company_from_filename(filename: str) -> str:
    fn_lower = filename.lower()
    for key, comp in FILENAME_TO_COMPANY.items():
        if key in fn_lower:
            return comp
    return None

def process_single_file(file_path: Path) -> list:
    print(f"🔄 처리 중: {file_path.name} ...")
    
    ext = file_path.suffix.lower()
    try:
        if ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path, encoding='utf-8-sig')
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding='cp949')
    except Exception as e:
        print(f"  ❌ 파일 읽기 실패: {e}")
        return []
        
    title_col = None
    body_col = None
    date_col = None
    
    for col in df.columns:
        c_clean = str(col).strip()
        if c_clean in ['제목', 'title', 'Title']:
            title_col = col
        elif c_clean in ['본문', '본문(200자)', 'body', 'Body', '본문내용']:
            body_col = col
        elif c_clean in ['일자', 'date', 'Date', '작성일']:
            date_col = col
            
    if not title_col or not date_col:
        print(f"  ⚠️ 필수 컬럼(제목 또는 일자)이 없어 이 파일은 건너뜁니다.")
        return []
        
    # 파일명 기반으로 기본 매핑할 기업명 파악
    default_company = detect_company_from_filename(file_path.name)
    if default_company:
        print(f"  🎯 파일명 기반 기업 매핑 판정: [{default_company}]")
        
    rows = []
    for idx, row in df.iterrows():
        title_val = str(row[title_col]) if pd.notna(row[title_col]) else ""
        body_val = str(row[body_col]) if body_col and pd.notna(row[body_col]) else ""
        date_val = str(row[date_col]) if pd.notna(row[date_col]) else ""
        
        # 일자 정규화 YYYY-MM-DD
        date_match = re.search(r"\d{4}[-.]\d{2}[-.]\d{2}", date_val)
        if date_match:
            pub_date = date_match.group(0).replace(".", "-")
        else:
            try:
                pub_date = pd.to_datetime(date_val).strftime("%Y-%m-%d")
            except Exception:
                pub_date = date_val
                
        # 제목 및 본문 결합
        full_text = title_val
        if body_val:
            full_text = f"[{title_val}] {body_val}"
            
        full_text_cleaned = clean_html(full_text)
        
        # 기업명 배정: 파일명 기반 기업명이 있으면 최우선 배정, 없으면 텍스트 매칭 검색
        assigned_company = default_company
        if not assigned_company:
            for key, comp in FILENAME_TO_COMPANY.items():
                if comp in full_text_cleaned:
                    assigned_company = comp
                    break
                    
        if assigned_company and len(full_text_cleaned) >= 8:
            rows.append({
                "text": full_text_cleaned,
                "company": assigned_company,
                "pub_date": pub_date
            })
            
    print(f"  ➡️ {len(rows)}건 정제 완료")
    return rows

def main():
    # 실행 시 특정 파일이 인자로 넘어오면 그 파일만 처리, 없으면 data/training 폴더 전체 자동 스캔
    target_files = []
    
    if len(sys.argv) >= 2:
        single_path = Path(sys.argv[1])
        if single_path.exists():
            target_files = [single_path]
        else:
            print(f"[오류] 지정한 경로가 존재하지 않습니다: {single_path}")
            sys.exit(1)
    else:
        # data/training 폴더 내 모든 xlsx 및 csv 파일 스캔
        if not TRAINING_DIR.exists():
            print(f"❌ {TRAINING_DIR} 폴더가 존재하지 않습니다. 먼저 폴더를 만들고 엑셀 파일들을 넣어주세요.")
            sys.exit(1)
        xlsx_files = list(TRAINING_DIR.glob("*.xlsx")) + list(TRAINING_DIR.glob("*.xls"))
        csv_files = list(TRAINING_DIR.glob("*.csv"))
        # 결과 파일인 raw_news_training.csv와 news_features_training.csv는 스캔 대상에서 명시적 제외
        target_files = [f for f in (xlsx_files + csv_files) if f.name not in ["raw_news_training.csv", "news_features_training.csv"]]
        
    if not target_files:
        print("❌ 처리할 빅카인즈 파일(*.xlsx, *.csv)을 data/training/ 폴더 아래에서 찾을 수 없습니다.")
        sys.exit(1)
        
    print(f"📚 총 {len(target_files)}개의 빅카인즈 파일을 감지했습니다. 일괄 처리를 시작합니다.")
    
    all_processed_rows = []
    for file_path in target_files:
        rows = process_single_file(file_path)
        all_processed_rows.extend(rows)
        
    if not all_processed_rows:
        print("❌ 정제 조건에 맞는 뉴스가 한 건도 없습니다.")
        sys.exit(1)
        
    # 최종 데이터프레임 병합 및 전체 중복 제거
    out_df = pd.DataFrame(all_processed_rows)
    out_df = out_df.drop_duplicates(subset="text").reset_index(drop=True)
    
    # 결과 파일 저장
    TRAINING_DIR.mkdir(parents=True, exist_ok=True)
    out_file_path = TRAINING_DIR / "raw_news_training.csv"
    
    out_df.to_csv(out_file_path, index=False, encoding="utf-8-sig")
    print(f"\n🎉 [SUCCESS] 모든 {len(target_files)}개 파일에 대한 일괄 통합 및 정제 완료!")
    print(f" - 저장 경로: {out_file_path}")
    print(f" - 최종 중복 제거된 학습용 뉴스 건수: {len(out_df)}건")

if __name__ == "__main__":
    main()
