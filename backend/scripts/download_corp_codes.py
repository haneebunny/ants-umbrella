# backend/scripts/download_corp_codes.py
import os, zipfile, io, requests
import xml.etree.ElementTree as ET
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

API_KEY = os.getenv("DART_API_KEY") or os.getenv("OPENDART_API_KEY")

if not API_KEY:
    print("[ERROR] DART_API_KEY를 .env 파일에 설정해 주세요.")
    exit(1)

print("DART 고유번호 ZIP 파일 다운로드 중...")
url = "https://opendart.fss.or.kr/api/corpCode.xml"
resp = requests.get(url, params={"crtfc_key": API_KEY})

if resp.status_code != 200:
    print(f"[ERROR] 다운로드 실패 (HTTP {resp.status_code})")
    exit(1)

# zip 파일 압축 해제
try:
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zip_ref:
        xml_filename = zip_ref.namelist()[0]
        with zip_ref.open(xml_filename) as xml_file:
            xml_data = xml_file.read()
except Exception as e:
    print(f"[ERROR] ZIP 압축 해제 중 에러 발생: {e}")
    print("API 키가 올바르지 않거나 아직 승인되지 않았을 수 있습니다.")
    exit(1)

print("XML 파싱 및 데이터 변환 중...")
root = ET.fromstring(xml_data)

rows = []
for list_node in root.findall("list"):
    corp_code = list_node.find("corp_code").text
    corp_name = list_node.find("corp_name").text
    stock_code = list_node.find("stock_code").text.strip()
    modify_date = list_node.find("modify_date").text
    rows.append({
        "corp_code": corp_code,
        "corp_name": corp_name,
        "stock_code": stock_code,
        "modify_date": modify_date
    })

df = pd.DataFrame(rows)
# 상장사만 필터링 (stock_code가 비어있지 않은 것)
df = df[df["stock_code"] != ""]
df = df[df["stock_code"].notna()]

# data 디렉터리가 없으면 생성
data_dir = PROJECT_ROOT / "data"
data_dir.mkdir(parents=True, exist_ok=True)

output_path = data_dir / "corp_code_map.csv"
df.to_csv(output_path, index=False, encoding="utf-8-sig")

print(f"[SUCCESS] {len(df)}개 상장사 정보 저장 완료: {output_path}")
