# scripts/collect_macro.py
import os
import pandas as pd
from dotenv import load_dotenv
from PublicDataReader import Ecos

load_dotenv()
API_KEY = os.getenv("ECOS_API_KEY")
api = Ecos(API_KEY)



def find_stat_code(keyword: str) -> pd.DataFrame:
    """통계표 이름에 keyword가 들어간 것들을 찾아준다. 코드가 안 맞을 때 이걸로 검색."""
    table_list = api.get_statistic_table_list()
    return table_list[table_list["통계명"].str.contains(keyword, na=False)]

def get_base_rate(start: str, end: str) -> pd.DataFrame:
    # 722Y001: 한국은행 기준금리 및 여수신금리, 항목코드 0101000 = 한국은행 기준금리
    df = api.get_statistic_search(
        통계표코드="722Y001", 주기="D", 검색시작일자=start, 검색종료일자=end,
        통계항목코드1="0101000",
    )
    return df[["시점", "값"]].rename(columns={"시점": "date", "값": "macro_rate"})

def get_fx_rate(start: str, end: str) -> pd.DataFrame:
    # 731Y001: 시장평균환율(원/달러 등)
    df = api.get_statistic_search(
        통계표코드="731Y001", 주기="D", 검색시작일자=start, 검색종료일자=end,
    )
    return df[["시점", "값"]].rename(columns={"시점": "date", "값": "macro_fx"})

if __name__ == "__main__":
    # 코드가 틀렸는지 먼저 확인하고 싶으면:
    # print(find_stat_code("기준금리"))
    # print(find_stat_code("환율"))

    rate = get_base_rate("20260101", "20260721")
    fx = get_fx_rate("20260101", "20260721")

    macro = rate.merge(fx, on="date", how="outer").sort_values("date")
    macro.to_csv("data/macro_features.csv", index=False, encoding="utf-8-sig")
    print(macro.tail(10))