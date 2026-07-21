from apscheduler.schedulers.blocking import BlockingScheduler

def run_daily_batch():
    print("배치 시작: 공시 수집 → 뉴스 분류 → 피처 조인 → XGBoost 추론 → daily_risk_score 저장")
    # TODO Day2~3: 아래 순서로 실제 함수 채우기
    # 1) A의 OpenDART/pykrx/ECOS 수집 함수 호출
    # 2) B의 뉴스 분류 결과 로드 (또는 배치 내에서 직접 호출)
    # 3) join_features.build_ml_rows(...)
    # 4) 학습된 XGBoost 모델로 predict_proba
    # 5) daily_risk_score_col.insert_many(...)

if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Asia/Seoul")
    scheduler.add_job(run_daily_batch, "cron", hour=7, minute=0)
    print("스케줄러 등록 완료 (매일 07:00 실행). Ctrl+C로 종료.")
    scheduler.start()