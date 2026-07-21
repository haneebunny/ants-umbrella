import os
import json
from pymongo import MongoClient
import pymongo
from dotenv import load_dotenv
from pathlib import Path

# 프로젝트 루트 및 backend/ 폴더 내 .env 동적 탐색
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
dotenv_path = PROJECT_ROOT / "backend" / ".env"
if not dotenv_path.exists():
    dotenv_path = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path)

MONGODB_URI = os.getenv("MONGODB_URI")
USE_MOCK = False

if not MONGODB_URI:
    print("[WARN] MONGODB_URI가 .env에 정의되어 있지 않습니다. 로컬 JSON Mock DB를 사용합니다.")
    USE_MOCK = True
else:
    try:
        # 타임아웃을 짧게 지정하여 신속하게 폴백 전환
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        db = client["esg_risk_db"]
        print("[SUCCESS] MongoDB Atlas 클러스터 연결에 성공했습니다!")
    except Exception as e:
        print(f"[WARN] MongoDB Atlas 연결 실패 ({e}). 로컬 JSON Mock DB로 전환합니다.")
        USE_MOCK = True

import atexit

class JSONFileCollection:
    """MongoDB 연결 불가 시 로컬 JSON 파일로 쿼리 및 저장을 모킹합니다."""
    def __init__(self, name: str):
        self.name = name
        self.file_path = PROJECT_ROOT / "data" / f"mock_db_{name}.json"
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self.data = []
        self._dirty = False # 데이터 변경 발생 플래그
        self._load()
        # 프로세스 정상 종료 시 1회만 디스크 쓰기 보장 (속도 향상)
        atexit.register(self._save)

    def _load(self):
        if self.file_path.exists():
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except:
                self.data = []
        else:
            self.data = []

    def _save(self):
        # 변경이 있었을 경우에만 최종 파일에 저장
        if not self._dirty:
            return
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
            print(f"[INFO] JSON Mock DB '{self.name}' 저장 완료: {self.file_path}")
        except Exception as e:
            print(f"[ERROR] Mock JSON 저장 에러: {e}")

    def create_index(self, keys, unique=False):
        pass

    def update_one(self, filter_query, update_query, upsert=False):
        doc = update_query.get("$set", {}).copy()
        
        found_idx = -1
        for idx, item in enumerate(self.data):
            if item.get("ticker") == filter_query.get("ticker") and item.get("date") == filter_query.get("date"):
                found_idx = idx
                break
                
        if found_idx != -1:
            self.data[found_idx].update(doc)
        else:
            self.data.append(doc)
        self._dirty = True # 변경 발생 마크 (atexit 발생 시 저장)
        return True

    def find_one(self, filter_query, sort=None):
        ticker = filter_query.get("ticker")
        docs = [d for d in self.data if d.get("ticker") == ticker]
        if not docs:
            return None
            
        if sort:
            key, direction = sort[0]
            docs = sorted(docs, key=lambda x: x.get(key, ""), reverse=(direction == -1))
            
        return docs[0].copy()

# 글로벌 Mock 객체 캐싱
_mock_collections = {}

def get_collection(name: str):
    """지정 컬렉션을 가져오고, 환경에 맞춰 실제 MongoDB 또는 JSON Mock DB를 매핑합니다."""
    if USE_MOCK:
        if name not in _mock_collections:
            _mock_collections[name] = JSONFileCollection(name)
        return _mock_collections[name]
        
    collection = db[name]
    collection.create_index(
        [("ticker", pymongo.ASCENDING), ("date", pymongo.ASCENDING)],
        unique=True
    )
    return collection

