# backend/scripts/run_pipeline.py
import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime

# 경로 설정
SCRIPTS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPTS_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

# 작업 디렉터리를 backend/ 디렉터리로 변경하여 상대경로 실행 정합성 보장
os.chdir(BACKEND_DIR)

# 실행할 스크립트 리스트 및 설명
PIPELINE_STEPS = [
    ("scripts/collect_price.py", "1. 16개 포트폴리오 종목 주가 수집 (FinanceDataReader/pykrx)"),
    ("generate_labels.py", "2. 주가 라벨 정의 (20거래일 내 -10% 하락 여부)"),
    ("scripts/add_sector.py", "3. 종목별 업종(섹터) 정보 매핑"),
    ("scripts/join_features.py", "4. 최종 학습/추론 통합 피처 데이터셋 병합 (코랩 가공 뉴스 반영)"),
    ("scripts/compare_features.py", "5. XGBoost 피처 중요도 및 성능 비교 실험")
]

def run_step(script_name: str, description: str, log_file) -> bool:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_file.write(f"\n{'='*70}\n")
    log_file.write(f"▶ {description} ({script_name})\n")
    log_file.write(f"시작 시간: {timestamp}\n")
    log_file.write(f"{'='*70}\n")
    log_file.flush()
    
    print(f"\n💡 \033[1;34m[실행 중] {description} ({script_name})\033[0m")
    
    # sys.executable을 사용해 현재 활성화된 가상환경의 python 인터프리터 호출
    process = subprocess.Popen(
        [sys.executable, script_name],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    # 실시간 콘솔 출력 및 파일 기록 동시 수행
    for line in process.stdout:
        sys.stdout.write(line)
        sys.stdout.flush()
        log_file.write(line)
        log_file.flush()
        
    process.wait()
    
    end_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_file.write(f"\n종료 시간: {end_timestamp} | Exit Code: {process.returncode}\n")
    log_file.flush()
    
    if process.returncode == 0:
        print(f"✅ \033[1;32m[성공] {description} 완료\033[0m")
        return True
    else:
        print(f"❌ \033[1;31m[오류] {description} 실패 (Exit Code: {process.returncode})\033[0m")
        return False

def main():
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    log_path = DATA_DIR / f"pipeline_run_{timestamp_str}.log"
    latest_log_path = DATA_DIR / "pipeline_run_latest.log"
    
    print("==================================================")
    print("🏗️  ESG 투자성향진단 통합 ML 파이프라인 구동 스크립트")
    print(f"로그 파일 경로: {log_path}")
    print("==================================================")
    
    success = True
    
    with open(log_path, "w", encoding="utf-8") as log_file:
        log_file.write(f"=== ESG 리스크 예측 ML 파이프라인 전체 실행 로그 ===\n")
        log_file.write(f"실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        for script_name, description in PIPELINE_STEPS:
            step_success = run_step(script_name, description, log_file)
            if not step_success:
                print(f"\n⚠️ \033[1;31m[실행 중단] {description} 단계에서 오류가 발생하여 파이프라인을 중단합니다.\033[0m")
                success = False
                break
                
        log_file.write(f"\n{'='*70}\n")
        log_file.write(f"전체 파이프라인 결과: {'성공 (SUCCESS)' if success else '실패 (FAILED)'}\n")
        log_file.write(f"{'='*70}\n")
        
    # 최신 로그 파일 링크/복사 제공
    try:
        if latest_log_path.exists():
            latest_log_path.unlink()
        import shutil
        shutil.copy2(log_path, latest_log_path)
    except Exception as e:
        pass
        
    if success:
        print("\n🎉 \033[1;32m==================================================")
        print("🎉 [SUCCESS] 모든 파이프라인 단계가 성공적으로 실행되었습니다!")
        print(f"📄 상세 실행 로그 확인: {log_path}")
        print("==================================================\033[0m\n")
    else:
        print("\n💥 \033[1;31m==================================================")
        print("💥 [FAILED] 파이프라인 구동 중 실패한 단계가 있습니다.")
        print(f"📄 오류 확인 로그: {log_path}")
        print("==================================================\033[0m\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
