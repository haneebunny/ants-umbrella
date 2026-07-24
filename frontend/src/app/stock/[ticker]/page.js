"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/layout/Header';
import Icon from '../../components/Icon';
import RainEffect from '../../components/RainEffect';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TICKER_NAME_MAP = {
  '000660': 'SK하이닉스',
  '005930': '삼성전자',
  '005380': '현대차',
  '035420': 'NAVER',
  '055550': '신한지주',
  '017670': 'SK텔레콤',
  '005490': 'POSCO홀딩스',
  '010950': 'S-Oil',
  '028260': '삼성물산',
  '000270': '기아',
  '068270': '셀트리온',
  '035720': '카카오',
  '051910': 'LG화학',
  '003550': 'LG',
  '036570': '엔씨소프트',
  '373220': 'LG에너지솔루션',
  '006400': '삼성SDI',
  '086520': '에코프로',
  '247540': '에코프로비엠',
  '196170': '알테오젠',
  '032830': '삼성생명',
  '033780': 'KT&G',
  '105560': 'KB금융',
  '047050': '포스코인터내셔널',
  '036460': '한국가스공사',
  '096770': '한국가스공사',
  '009150': '삼성전기',
  '011200': '한진',
  '251270': '넷마블',
};

/** 
 * 가독성을 극대화한 깔끔한 기간별 주가 데이터 포인트 생성 함수
 * 1D: 5개 (시간별 주요 시점)
 * 1W: 7개 (일별 종가)
 * 1M: 8개 (주간 주요 종가)
 * 1Y: 10개 (월별 대표 종가)
 */
function buildPeriodSparklines(currentPriceNum, highNum, lowNum, direction = 'up') {
  const isUp = direction === 'up';
  
  // 1D: 5개 포인트
  const p1D = [];
  const start1D = isUp ? currentPriceNum * 0.985 : currentPriceNum * 1.015;
  for (let i = 0; i < 5; i++) {
    const ratio = i / 4;
    const wave = Math.sin(i * 1.5) * (currentPriceNum * 0.005);
    p1D.push(Math.round(start1D + (currentPriceNum - start1D) * ratio + wave));
  }
  p1D[4] = currentPriceNum;

  // 1W: 7개 포인트
  const p1W = [];
  const start1W = isUp ? currentPriceNum * 0.95 : currentPriceNum * 1.05;
  for (let i = 0; i < 7; i++) {
    const ratio = i / 6;
    const wave = Math.sin(i * 1.2) * (currentPriceNum * 0.01);
    p1W.push(Math.round(start1W + (currentPriceNum - start1W) * ratio + wave));
  }
  p1W[6] = currentPriceNum;

  // 1M: 8개 포인트
  const p1M = [];
  const start1M = isUp ? currentPriceNum * 0.90 : currentPriceNum * 1.10;
  for (let i = 0; i < 8; i++) {
    const ratio = i / 7;
    const wave = Math.sin(i * 1.1) * (currentPriceNum * 0.018);
    p1M.push(Math.round(start1M + (currentPriceNum - start1M) * ratio + wave));
  }
  p1M[7] = currentPriceNum;

  // 1Y: 12개 포인트 (1년 = 52주)
  const p1Y = [];
  if (isUp) {
    // 상승 종목: 52주 최저가(lowNum)에서 출발하여 현재가/52주 최고가로 우상향 📈 (초록색)
    const start1Y = lowNum > 0 ? lowNum : currentPriceNum * 0.72;
    const peakHigh = highNum > 0 ? highNum : currentPriceNum * 1.25;
    for (let i = 0; i < 12; i++) {
      const ratio = i / 11;
      const waveFactor = Math.sin((i / 11) * Math.PI);
      let val = Math.round(start1Y + (currentPriceNum - start1Y) * ratio + waveFactor * (peakHigh - start1Y));
      p1Y.push(val);
    }
    if (lowNum > 0) p1Y[0] = lowNum;
    if (highNum > 0) p1Y[5] = peakHigh;
    p1Y[11] = currentPriceNum;
  } else {
    // 하락 종목: 52주 최고가(highNum)에서 출발하여 우하향 📉 (빨간색)
    const start1Y = highNum > 0 ? highNum : currentPriceNum * 1.30;
    const troughLow = lowNum > 0 ? lowNum : currentPriceNum * 0.70;
    for (let i = 0; i < 12; i++) {
      const ratio = i / 11;
      const waveFactor = Math.sin((i / 11) * Math.PI);
      let val = Math.round(start1Y + (currentPriceNum - start1Y) * ratio - waveFactor * (start1Y - troughLow));
      p1Y.push(val);
    }
    if (highNum > 0) p1Y[0] = highNum;
    if (lowNum > 0) p1Y[6] = troughLow;
    p1Y[11] = currentPriceNum;
  }

  return { '1D': p1D, '1W': p1W, '1M': p1M, '1Y': p1Y };
}

// 쉽고 친절한 주식 초보 맞춤 종목 데이터 (포트폴리오 전체 29개 종목 완전 연동)
const STOCK_DATA = {
  '251270': { name: '넷마블', marketCap: '4.8조', high52w: '72,000원', low52w: '41,000원', currentPrice: '56,800원', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.4, weight: 14, dropProb: 35.5,
    esgBreakdown: { e: { status: 'safe', text: '데이터센터 서버 에너지 절감' }, s: { status: 'safe', text: '게임 이용자 정보보호 최우수' }, g: { status: 'caution', text: '지배구조 이사회 독립성 강화' } },
    sparklines: buildPeriodSparklines(56800, 72000, 41000, 'down'),
    evidences: [{ type: '산업', direction: '부정', title: '신작 게임 마케팅비 증가 및 개발 일정 조정', date: '2026.07.21' }],
    aiBriefing: '넷마블 종목은 한 달 내 주가가 떨어질 위험이 35.5%입니다. 신작 라인업 출시 일정 및 실적 개선 여부를 관망해 보세요.',
  },
  '047050': { name: '포스코인터내셔널', marketCap: '9.8조', high52w: '92,500원', low52w: '48,000원', currentPrice: '56,200원', weather: 'rainy', direction: 'down', confidence: 'medium', change: -0.5, weight: 15, dropProb: 34.5,
    esgBreakdown: { e: { status: 'caution', text: '글로벌 원자재 공급망 환경 비용' }, s: { status: 'safe', text: '해외 사업장 안전 강화' }, g: { status: 'safe', text: '지배구조 이사회 강화' } },
    sparklines: buildPeriodSparklines(56200, 92500, 48000, 'down'),
    evidences: [{ type: '산업', direction: '부정', title: '중국 경기 둔화 및 글로벌 통상 환경 변동성 확대', date: '2026.07.22' }],
    aiBriefing: '포스코인터내셔널 종목은 한 달 내 주가가 떨어질 위험이 34.5%로 주의가 필요해요. 글로벌 원자재 가격 변동과 통상 환경 영향을 관망해 보세요.',
  },
  '036460': { name: '한국가스공사', marketCap: '3.5조', high52w: '64,000원', low52w: '24,000원', currentPrice: '38,900원', weather: 'rainy', direction: 'down', confidence: 'medium', change: -1.1, weight: 18, dropProb: 41.5,
    esgBreakdown: { e: { status: 'danger', text: '탄소배출 및 유가 미수금 부담' }, s: { status: 'safe', text: '가스 공급 안전망 체계' }, g: { status: 'safe', text: '공기업 지배구조 준수' } },
    sparklines: buildPeriodSparklines(38900, 64000, 24000, 'down'),
    evidences: [{ type: '공시', direction: '부정', title: '배당 관련 규제 준수 이슈 및 미수금 관련 불확실성', date: '2026.07.21' }],
    aiBriefing: '한국가스공사 종목은 한 달 내 주가가 떨어질 위험이 41.5%로 다소 높은 상태입니다. 유가 및 도시가스 요금 미수금 이슈를 체크해 보세요.',
  },
  '096770': { name: '한국가스공사', marketCap: '3.5조', high52w: '64,000원', low52w: '24,000원', currentPrice: '38,900원', weather: 'rainy', direction: 'down', confidence: 'medium', change: -1.1, weight: 18, dropProb: 41.5,
    esgBreakdown: { e: { status: 'danger', text: '탄소배출 및 유가 미수금 부담' }, s: { status: 'safe', text: '가스 공급 안전망 체계' }, g: { status: 'safe', text: '공기업 지배구조 준수' } },
    sparklines: buildPeriodSparklines(38900, 64000, 24000, 'down'),
    evidences: [{ type: '공시', direction: '부정', title: '배당 관련 규제 준수 이슈 및 미수금 관련 불확실성', date: '2026.07.21' }],
    aiBriefing: '한국가스공사 종목은 한 달 내 주가가 떨어질 위험이 41.5%로 다소 높은 상태입니다. 유가 및 도시가스 요금 미수금 이슈를 체크해 보세요.',
  },
  '009150': { name: '삼성전기', marketCap: '11.8조', high52w: '175,000원', low52w: '120,000원', currentPrice: '158,000원', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.3, weight: 15, dropProb: 27.5,
    esgBreakdown: { e: { status: 'safe', text: '친환경 전자부품 소재' }, s: { status: 'safe', text: '협력사 상생동행 인증' }, g: { status: 'safe', text: '투명 이사회' } },
    sparklines: buildPeriodSparklines(158000, 175000, 120000, 'down'),
    evidences: [{ type: '산업', direction: '부정', title: '글로벌 스마트폰 IT 부품 수요 회복 정체', date: '2026.07.21' }],
    aiBriefing: '삼성전기 종목은 한 달 내 주가가 떨어질 위험이 27.5%입니다. 적층세라믹콘덴서(MLCC) 글로벌 업황을 관망하시는 것을 추천합니다.',
  },
  '011200': { name: '한진', marketCap: '3,200억', high52w: '28,000원', low52w: '18,000원', currentPrice: '21,500원', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.4, weight: 15, dropProb: 18.5,
    esgBreakdown: { e: { status: 'safe', text: '친환경 물류 시스템' }, s: { status: 'safe', text: '택배 기사 안전 보장' }, g: { status: 'safe', text: '주주가치 제고' } },
    sparklines: buildPeriodSparklines(21500, 28000, 18000, 'up'),
    evidences: [{ type: '산업', direction: '긍정', title: '이커머스 택배 물동량 지속 증가 및 물류센터 효율화', date: '2026.07.22' }],
    aiBriefing: '한진 종목은 한 달 내 주가가 떨어질 위험이 18.5%로 안정적인 편입니다. 택배 물량 증가와 자산 효율화가 긍정적입니다.',
  },
  '032830': { name: '삼성생명', marketCap: '17.8조', high52w: '98,000원', low52w: '68,000원', currentPrice: '89,500원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.2, weight: 25, dropProb: 9.5,
    esgBreakdown: { e: { status: 'safe', text: '녹색금융 ESG 투자의무화' }, s: { status: 'safe', text: '고객 정보보안 최우수' }, g: { status: 'safe', text: '배당 성향 지속 확대' } },
    sparklines: buildPeriodSparklines(89500, 98000, 68000, 'up'),
    evidences: [{ type: '재무', direction: '긍정', title: '안정적 보험 계약 마진(CSM) 확보 및 주주환원 배당 정책 발표', date: '2026.07.23' }],
    aiBriefing: '삼성생명 종목은 한 달 내 주가가 떨어질 위험이 9.5%로 안전해요. 탄탄한 자산 운용 이익과 방어주 특성이 안정감을 더해주고 있습니다.',
  },
  '033780': { name: 'KT&G', marketCap: '12.4조', high52w: '115,000원', low52w: '84,000원', currentPrice: '99,800원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 0.8, weight: 25, dropProb: 8.8,
    esgBreakdown: { e: { status: 'safe', text: '친환경 포장재 전환' }, s: { status: 'safe', text: '안전보건 경영 실천' }, g: { status: 'safe', text: '자사주 매입 및 소각' } },
    sparklines: buildPeriodSparklines(99800, 115000, 84000, 'up'),
    evidences: [{ type: '재무', direction: '긍정', title: '해외 궐련 및 전자담배(NGP) 매출 호조 및 고배당 매력', date: '2026.07.23' }],
    aiBriefing: 'KT&G 종목은 한 달 내 주가가 떨어질 위험이 8.8%로 매우 안전한 상태예요. 글로벌 매출 성장과 자사주 소각 등 주주친화 정책이 주가를 든든히 지지합니다.',
  },
  '105560': { name: 'KB금융', marketCap: '32.1조', high52w: '92,000원', low52w: '55,000원', currentPrice: '83,200원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.4, weight: 25, dropProb: 8.2,
    esgBreakdown: { e: { status: 'safe', text: '탄소중립 금융 대출 확대' }, s: { status: 'safe', text: '서민 금융 지원' }, g: { status: 'safe', text: '분기 균등 배당 이행' } },
    sparklines: buildPeriodSparklines(83200, 92000, 55000, 'up'),
    evidences: [{ type: '재무', direction: '긍정', title: '역대 최대 분기 순이익 및 자사주 추가 매입 공시', date: '2026.07.23' }],
    aiBriefing: 'KB금융 종목은 한 달 내 주가가 떨어질 위험이 8.2%로 탄탄해요. 은행 및 증권 등 그룹 종합 금융 이익이 고르게 유지되고 있습니다.',
  },
  '000660': { name: 'SK하이닉스', marketCap: '195.4조', high52w: '308,500원', low52w: '152,000원', currentPrice: '268,500원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.8, weight: 22, dropProb: 6.2,
    esgBreakdown: { e: { status: 'safe', text: '친환경 반도체 공정 전환' }, s: { status: 'safe', text: '안전보건 최고등급' }, g: { status: 'safe', text: '투명한 이사회 운영' } },
    sparklines: buildPeriodSparklines(268500, 308500, 152000, 'up'),
    evidences: [{ type: '산업', direction: '긍정', title: 'HBM4 대형 수주 계약 확정 및 AI 반도체 수요 폭발', date: '2026.07.23' }],
    aiBriefing: 'SK하이닉스 종목은 한 달 내 주가가 떨어질 위험이 6.2%로 매우 안전한 상태예요. 회사의 탄탄한 실적이 주가를 든든히 지원하고 있습니다.',
  },
  '005930': { name: '삼성전자', marketCap: '468.6조', high52w: '88,800원', low52w: '54,200원', currentPrice: '78,500원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.5, weight: 25, dropProb: 8.4,
    esgBreakdown: { e: { status: 'safe', text: '친환경 반도체 공정 전환' }, s: { status: 'safe', text: '안전보건 경영 강화' }, g: { status: 'safe', text: '투명한 이사회 운영' } },
    sparklines: buildPeriodSparklines(78500, 88800, 54200, 'up'),
    evidences: [{ type: '산업', direction: '긍정', title: 'HBM 메모리 공급 확대 및 실적 개선세 지속', date: '2026.07.23' }],
    aiBriefing: '삼성전자 종목은 한 달 내 주가가 떨어질 위험이 8.4%로 안심할 수 있는 상태예요. 메모리 반도체 실적 회복이 안정감을 주고 있습니다.',
  },
  '005380': { name: '현대차', marketCap: '54.2조', high52w: '299,500원', low52w: '178,000원', currentPrice: '258,500원', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.9, weight: 18, dropProb: 11.2,
    esgBreakdown: { e: { status: 'safe', text: '수소/전기차 라인업 확대' }, s: { status: 'caution', text: '노사 협상 진행 중' }, g: { status: 'safe', text: '주주환원 배당 확대' } },
    sparklines: buildPeriodSparklines(258500, 299500, 178000, 'up'),
    evidences: [{ type: '재무', direction: '긍정', title: '하이브리드차 북미 판매 호조 및 배당 확대', date: '2026.07.23' }],
    aiBriefing: '현대차 종목은 한 달 내 주가가 떨어질 위험이 11.2%로 양호해요. 하이브리드 차량과 고성능 SUV 판매 호조로 견고한 영업이익을 이어가고 있습니다.',
  },
  '035420': { name: 'NAVER', marketCap: '27.8조', high52w: '220,000원', low52w: '155,000원', currentPrice: '169,500원', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.5, weight: 15, dropProb: 24.8,
    esgBreakdown: { e: { status: 'safe', text: '친환경 데이터센터 운용' }, s: { status: 'caution', text: '플랫폼 공정위 조사 이슈' }, g: { status: 'safe', text: '자사주 소각 추진' } },
    sparklines: buildPeriodSparklines(169500, 220000, 155000, 'down'),
    evidences: [{ type: '산업', direction: '부정', title: '커머스 시장 경쟁 심화 및 마케팅비 증가', date: '2026.07.21' }],
    aiBriefing: 'NAVER 종목은 한 달 내 주가가 떨어질 위험이 24.8%로 약간 주의가 필요해요. 이커머스 시장 경쟁 심화로 단기 조정 국면을 지나고 있습니다.',
  },
  '055550': { name: '신한지주', marketCap: '24.9조', high52w: '55,000원', low52w: '38,000원', currentPrice: '48,900원', weather: 'sunny', direction: 'up', confidence: 'medium', change: 1.0, weight: 16, dropProb: 9.5,
    esgBreakdown: { e: { status: 'safe', text: '녹색금융 대출 확대' }, s: { status: 'safe', text: '금융 소비자 보호' }, g: { status: 'safe', text: '분기 배당 정례화' } },
    sparklines: buildPeriodSparklines(48900, 55000, 38000, 'up'),
    evidences: [{ type: '재무', direction: '긍정', title: '안정적인 이자 마진 유지 및 대출 성과', date: '2026.07.23' }],
    aiBriefing: '신한지주 종목은 한 달 내 주가가 떨어질 위험이 9.5%로 안전해요. 안정적인 대출 이익과 정기적인 배당이 장점인 종목입니다.',
  },
  '017670': { name: 'SK텔레콤', marketCap: '12.1조', high52w: '58,000원', low52w: '46,000원', currentPrice: '55,100원', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.8, weight: 15, dropProb: 8.8,
    esgBreakdown: { e: { status: 'safe', text: '기지국 에너지 절감' }, s: { status: 'safe', text: '통신 장애 예방 강화' }, g: { status: 'safe', text: '고배당 주주 환원' } },
    sparklines: buildPeriodSparklines(55100, 58000, 46000, 'up'),
    evidences: [{ type: '재무', direction: '긍정', title: 'AI B2B 사업 성장 및 배당 매력 지속', date: '2026.07.22' }],
    aiBriefing: 'SK텔레콤 종목은 한 달 내 주가가 떨어질 위험이 8.8%로 낮아요. 통신 본업의 단단함과 고배당 매력 덕분에 주가가 안정적으로 흐르고 있습니다.',
  },
  '005490': { name: 'POSCO홀딩스', marketCap: '23.3조', high52w: '420,000원', low52w: '260,000원', currentPrice: '275,200원', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.4, weight: 14, dropProb: 38.5,
    esgBreakdown: { e: { status: 'danger', text: '탄소 배출권 관련 비용 부담' }, s: { status: 'safe', text: '친환경 제철 작업 환경' }, g: { status: 'safe', text: '지주사 이사회 개편' } },
    sparklines: buildPeriodSparklines(275200, 420000, 260000, 'down'),
    evidences: [{ type: '공시', direction: '부정', title: '철강 수요 둔화 및 탄소 배출 규제 비용 발생 공시', date: '2026.07.21' }],
    aiBriefing: 'POSCO홀딩스 종목은 한 달 내 주가가 떨어질 위험이 38.5%로 주의가 필요해요. 글로벌 철강 수요 둔화와 환경 규제 비용 부담이 주가 발목을 잡고 있습니다.',
  },
  '010950': { name: 'S-Oil', marketCap: '8.2조', high52w: '92,000원', low52w: '68,000원', currentPrice: '72,800원', weather: 'rainy', direction: 'down', confidence: 'weak', change: -0.3, weight: 13, dropProb: 44.2,
    esgBreakdown: { e: { status: 'danger', text: '정제 탄소배출 부담' }, s: { status: 'safe', text: '화학 설비 안전 관리' }, g: { status: 'safe', text: '지배구조 투명성' } },
    sparklines: buildPeriodSparklines(72800, 92000, 68000, 'down'),
    evidences: [{ type: 'ESG', direction: '부정', title: '정제마진 하락 및 유가 변동성 확대', date: '2026.07.20' }],
    aiBriefing: 'S-Oil 종목은 한 달 내 주가가 떨어질 위험이 44.2%로 다소 높아요. 글로벌 유가 변동과 마진 하락 영향이 커서 매수 시점을 신중히 잡으세요.',
  },
  '028260': { name: '삼성물산', marketCap: '21.5조', high52w: '135,000원', low52w: '100,000원', currentPrice: '116,800원', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.1, weight: 14, dropProb: 12.0,
    esgBreakdown: { e: { status: 'safe', text: '친환경 자재 사용' }, s: { status: 'safe', text: '건설 현장 안전관리' }, g: { status: 'safe', text: '주주가치 제고' } },
    sparklines: buildPeriodSparklines(116800, 135000, 100000, 'up'),
    evidences: [{ type: '산업', direction: '긍정', title: '해외 건설 수주 회복세', date: '2026.07.23' }],
    aiBriefing: '삼성물산 종목은 한 달 내 주가가 떨어질 위험이 12.0%로 양호해요. 해외 수주 증가와 자원 사업 이익으로 무난한 흐름을 이어가고 있습니다.',
  },
  '000270': { name: '기아', marketCap: '44.8조', high52w: '130,000원', low52w: '85,000원', currentPrice: '112,300원', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.2, weight: 14, dropProb: 10.5,
    esgBreakdown: { e: { status: 'safe', text: '전기차 라인업 확대' }, s: { status: 'safe', text: '품질 관리 강화' }, g: { status: 'safe', text: '자사주 소각 추진' } },
    sparklines: buildPeriodSparklines(112300, 130000, 85000, 'up'),
    evidences: [{ type: '산업', direction: '긍정', title: '전기차 및 해외 SUV 수출 호조', date: '2026.07.22' }],
    aiBriefing: '기아 종목은 한 달 내 주가가 떨어질 위험이 10.5%로 안전해요. 인기 SUV 라인업과 수출 성과 덕분에 실적 기대감이 높습니다.',
  },
  '068270': { name: '셀트리온', marketCap: '41.2조', high52w: '230,000원', low52w: '160,000원', currentPrice: '202,400원', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.2, weight: 14, dropProb: 22.1,
    esgBreakdown: { e: { status: 'safe', text: '바이오 폐기물 관리' }, s: { status: 'safe', text: '의약품 접근성' }, g: { status: 'caution', text: '지배구조 모니터링' } },
    sparklines: buildPeriodSparklines(202400, 230000, 160000, 'down'),
    evidences: [{ type: '재무', direction: '부정', title: '임상 데이터 승인 일정 일부 지연', date: '2026.07.19' }],
    aiBriefing: '셀트리온 종목은 한 달 내 주가가 떨어질 위험이 22.1%로 일시적인 관망이 필요해요. 임상 지연 이슈가 있지만 기존 약품 판매는 안정적입니다.',
  },
  '035720': { name: '카카오', marketCap: '16.8조', high52w: '60,000원', low52w: '35,000원', currentPrice: '37,900원', weather: 'thunder', direction: 'down', confidence: 'strong', change: -1.2, weight: 18, dropProb: 68.5,
    esgBreakdown: { e: { status: 'safe', text: '데이터센터 서버 절전' }, s: { status: 'danger', text: '상생 갈등 이슈' }, g: { status: 'danger', text: '경영진 사법 리스크' } },
    sparklines: buildPeriodSparklines(37900, 60000, 35000, 'down'),
    evidences: [{ type: 'ESG', direction: '부정', title: '경영진 리스크 및 매출 성장률 둔화', date: '2026.07.21' }],
    aiBriefing: '카카오는 한 달 내 주가가 떨어질 위험이 68.5%로 매우 높아요! 경영진 리스크와 성장률 둔화 악재가 겹쳐 있어 당분간 신중한 접근이 필요합니다.',
  },
  '051910': { name: 'LG화학', marketCap: '25.3조', high52w: '520,000원', low52w: '320,000원', currentPrice: '358,000원', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.6, weight: 16, dropProb: 28.5,
    esgBreakdown: { e: { status: 'caution', text: '석유화학 탄소배출 부담' }, s: { status: 'safe', text: '사업장 안전보건' }, g: { status: 'safe', text: '투명 이사회' } },
    sparklines: buildPeriodSparklines(358000, 520000, 320000, 'down'),
    evidences: [{ type: '공시', direction: '부정', title: '교환사채 발행 및 석유화학 업황 둔화', date: '2026.07.22' }],
    aiBriefing: 'LG화학 종목은 한 달 내 주가가 떨어질 위험이 28.5%로 관망이 필요해요. 석유화학 이익 둔화와 교환사채 발행 영향이 상방을 제약하고 있습니다.',
  },
  '003550': { name: 'LG', marketCap: '12.2조', high52w: '95,000원', low52w: '70,000원', currentPrice: '78,200원', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.4, weight: 15, dropProb: 13.5,
    esgBreakdown: { e: { status: 'safe', text: '지주사 ESG 통합 가이드' }, s: { status: 'safe', text: '계열사 상생 협력' }, g: { status: 'safe', text: '자사주 소각 추진' } },
    sparklines: buildPeriodSparklines(78200, 95000, 70000, 'up'),
    evidences: [{ type: '재무', direction: '긍정', title: '주요 계열사 배당금 수익 확정 및 지주사 순자산 가치 개선', date: '2026.07.23' }],
    aiBriefing: 'LG 종목은 한 달 내 주가가 떨어질 위험이 13.5%로 양호한 흐름입니다. 계열사 실적 안정과 주주환원 의지가 긍정적입니다.',
  },
  '036570': { name: '엔씨소프트', marketCap: '4.1조', high52w: '260,000원', low52w: '160,000원', currentPrice: '187,500원', weather: 'rainy', direction: 'down', confidence: 'weak', change: -1.1, weight: 15, dropProb: 32.0,
    esgBreakdown: { e: { status: 'safe', text: '친환경 신사옥 에너지 절감' }, s: { status: 'caution', text: '신작 유저 만족도 모니터링' }, g: { status: 'safe', text: '독립 이사회' } },
    sparklines: buildPeriodSparklines(187500, 260000, 160000, 'down'),
    evidences: [{ type: '산업', direction: '부정', title: '신작 신규 매출 정체 및 마케팅비 증가', date: '2026.07.20' }],
    aiBriefing: '엔씨소프트 종목은 한 달 내 주가가 떨어질 위험이 32.0%로 신중한 접근이 필요해요. 신작 라인업의 모멘텀이 필요한 시점입니다.',
  },
  '373220': { name: 'LG에너지솔루션', marketCap: '87.1조', high52w: '480,000원', low52w: '330,000원', currentPrice: '372,500원', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.8, weight: 20, dropProb: 21.5,
    esgBreakdown: { e: { status: 'safe', text: '배터리 리사이클링 확대' }, s: { status: 'safe', text: '글로벌 완성차 JV 안전' }, g: { status: 'safe', text: '이사회 투명성' } },
    sparklines: buildPeriodSparklines(372500, 480000, 330000, 'down'),
    evidences: [{ type: '산업', direction: '부정', title: '전기차 둔화 및 배터리 셀 가격 일시 하락', date: '2026.07.21' }],
    aiBriefing: 'LG에너지솔루션 종목은 한 달 내 주가가 떨어질 위험이 21.5%입니다. 글로벌 전기차 수요 일시 둔화 속에서 중장기 핵심 배터리 펀더멘털은 유지되고 있습니다.',
  },
  '006400': { name: '삼성SDI', marketCap: '27.1조', high52w: '500,000원', low52w: '350,000원', currentPrice: '395,000원', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.6, weight: 15, dropProb: 11.5,
    esgBreakdown: { e: { status: 'safe', text: '전고체 배터리 친환경 기술' }, s: { status: 'safe', text: '안전사업장 인증' }, g: { status: 'safe', text: '주주가치 제고' } },
    sparklines: buildPeriodSparklines(395000, 500000, 350000, 'up'),
    evidences: [{ type: '산업', direction: '긍정', title: '차세대 전고체 배터리 파일럿 라인 성과 기대', date: '2026.07.23' }],
    aiBriefing: '삼성SDI 종목은 한 달 내 주가가 떨어질 위험이 11.5%로 안정적입니다. 차세대 배터리 기술력과 수익성 위주 질적 성장이 주가를 받치고 있습니다.',
  },
  '086520': { name: '에코프로', marketCap: '12.5조', high52w: '150,000원', low52w: '80,000원', currentPrice: '94,200원', weather: 'thunder', direction: 'down', confidence: 'strong', change: -2.1, weight: 12, dropProb: 48.0,
    esgBreakdown: { e: { status: 'caution', text: '양극재 제조 환경 비용' }, s: { status: 'safe', text: '지역사회 기여' }, g: { status: 'caution', text: '지배구조 이슈' } },
    sparklines: buildPeriodSparklines(94200, 150000, 80000, 'down'),
    evidences: [{ type: 'ESG', direction: '부정', title: '양극재 단가 하락 및 2차전지 조정세', date: '2026.07.21' }],
    aiBriefing: '에코프로 종목은 한 달 내 주가가 떨어질 위험이 48.0%로 다소 높은 상황입니다. 2차전지 소재 단가 하락 이슈가 있어 신중한 관망을 권해드립니다.',
  },
  '247540': { name: '에코프로비엠', marketCap: '18.0조', high52w: '280,000원', low52w: '160,000원', currentPrice: '184,000원', weather: 'rainy', direction: 'down', confidence: 'medium', change: -1.5, weight: 14, dropProb: 39.0,
    esgBreakdown: { e: { status: 'safe', text: '양극재 탄소절감 기술' }, s: { status: 'safe', text: '안전사업장 인증' }, g: { status: 'safe', text: '투명 이사회' } },
    sparklines: buildPeriodSparklines(184000, 280000, 160000, 'down'),
    evidences: [{ type: '재무', direction: '부정', title: '북미 고객사 가동률 둔화에 따른 이익 정체', date: '2026.07.21' }],
    aiBriefing: '에코프로비엠 종목은 한 달 내 주가가 떨어질 위험이 39.0%입니다. 전기차 소재 출하량 조절 소식으로 조정세에 있으니 진입 시점을 재세요.',
  },
  '196170': { name: '알테오젠', marketCap: '15.1조', high52w: '310,000원', low52w: '180,000원', currentPrice: '284,500원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 2.4, weight: 15, dropProb: 7.5,
    esgBreakdown: { e: { status: 'safe', text: '친환경 바이오 연구' }, s: { status: 'safe', text: '의약품 접근성' }, g: { status: 'safe', text: '투명 경영' } },
    sparklines: buildPeriodSparklines(284500, 310000, 180000, 'up'),
    evidences: [{ type: '산업', direction: '긍정', title: '글로벌 빅파마 피하주사(SC) 제형 기술 이전 로열티 유입', date: '2026.07.23' }],
    aiBriefing: '알테오젠 종목은 한 달 내 주가가 떨어질 위험이 7.5%로 매우 안정적이에요! 글로벌 기술 이전 로열티 매출이 주가를 강력히 지탱하고 있습니다.',
  },
};

const DEFAULT_STOCK = {
  name: '종목 분석 리포트', marketCap: '10.0조', high52w: '100,000원', low52w: '80,000원', currentPrice: '90,000원', weather: 'cloudy', direction: 'down', confidence: 'weak', change: 0, weight: 15, dropProb: 15.0,
  esgBreakdown: { e: { status: 'safe', text: '환경 기준 충족' }, s: { status: 'safe', text: '사회 가치 이행' }, g: { status: 'safe', text: '이사회 운용 준수' } },
  sparklines: buildPeriodSparklines(90000, 100000, 80000, 'down'),
  evidences: [{ type: 'AI 분석', direction: '중립', title: '수집된 과거 리스크 이력이 적어 표준 모니터링 모드로 표시 중입니다.', date: '2026.07.23' }],
  aiBriefing: '현재 해당 종목은 기본 안전 지표 위주로 모니터링 중입니다. 추가 데이터 수집에 따라 리포트가 업데이트됩니다.',
};

const WEATHER_CFG = {
  sunny:   { icon: 'sun',       label: '맑음', color: 'text-[#3eb489]' },
  cloudy:  { icon: 'cloud',     label: '구름', color: 'text-slate-400' },
  rainy:   { icon: 'cloudRain', label: '비',   color: 'text-sky-400'   },
  thunder: { icon: 'zap',       label: '번개', color: 'text-rose-400'  },
};

export default function StockDetailPage() {
  const { ticker } = useParams();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // 라이브 API 데이터 연동 상태
  const [liveData, setLiveData] = useState(null);

  // 차트 기간 선택 탭 ('1D', '1W', '1M', '1Y')
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // 하락률 조절 슬라이더 (-5% 기본)
  const [simDropPct, setSimDropPct] = useState(5);
  // 가상 매수 금액 선택
  const [simVirtualAmount, setSimVirtualAmount] = useState(5000000);

  // AI 예측 원리 모달 상태
  const [showAiModal, setShowAiModal] = useState(false);

  // 📡 실시간 백엔드 DB/API 데이터 연동
  useEffect(() => {
    if (!ticker) return;
    async function fetchLiveData() {
      try {
        const [scoreRes, weatherRes, evRes] = await Promise.all([
          fetch(`${API_BASE}/risk-score/${ticker}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/api/dashboard-weather?tickers=${ticker}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/risk-evidences/${ticker}`).then(r => r.ok ? r.json() : null),
        ]);

        if (scoreRes || weatherRes || evRes) {
          const weatherItem = Array.isArray(weatherRes) ? weatherRes[0] : null;
          let rawBriefing = evRes?.ai_briefing || '';
          rawBriefing = rawBriefing.replace(/^💡\s*\[AI 진단\]\s*/, '').replace(/^\[AI 진단\]\s*/, '');

          setLiveData({
            prob_up: scoreRes?.prob_up,
            dropProb: scoreRes?.prob_up !== undefined ? Math.round((1 - scoreRes.prob_up) * 1000) / 10 : undefined,
            direction: weatherItem?.direction || scoreRes?.direction,
            weather: weatherItem?.weather,
            change: weatherItem?.change,
            currentPrice: weatherItem?.price !== undefined ? `${weatherItem.price.toLocaleString()}원` : scoreRes?.price !== undefined ? `${scoreRes.price.toLocaleString()}원` : undefined,
            aiBriefing: rawBriefing || undefined,
            evidences: evRes?.evidences,
          });
        }
      } catch (e) {
        console.warn('[StockDetail] Live backend API fetch fallback:', e);
      }
    }
    fetchLiveData();
  }, [ticker]);

  const fallbackName = TICKER_NAME_MAP[ticker] || '종목 분석 리포트';
  const baseStock = STOCK_DATA[ticker] || { ...DEFAULT_STOCK, name: fallbackName };
  const currentDropProb = liveData?.dropProb !== undefined && liveData.dropProb !== null ? liveData.dropProb : baseStock.dropProb;
  const currentDirection = liveData?.direction || baseStock.direction;

  const syncedAiBriefing = (liveData?.aiBriefing && !liveData.aiBriefing.includes('준비 중입니다'))
    ? liveData.aiBriefing
    : `${baseStock.name} 종목은 한 달 내 주가가 떨어질 위험이 ${currentDropProb}%로 ${
        currentDropProb < 20
          ? '매우 안전한 상태예요! 회사의 탄탄한 실적이 주가를 든든히 지원하고 있습니다.'
          : '주의가 필요해요! 최근 악재 신호가 관측되고 있으니 매수 전 신중히 관망해 보세요.'
      }`;

  const stock = {
    ...baseStock,
    currentPrice: liveData?.currentPrice || baseStock.currentPrice,
    weather: liveData?.weather || baseStock.weather,
    direction: currentDirection,
    change: liveData?.change !== undefined && liveData.change !== null ? liveData.change : baseStock.change,
    dropProb: currentDropProb,
    aiBriefing: syncedAiBriefing,
    evidences: (liveData?.evidences && liveData.evidences.length > 0) ? liveData.evidences : (baseStock.evidences || []),
  };

  const wCfg = WEATHER_CFG[stock.weather] || WEATHER_CFG.cloudy;
  const isUp = stock.direction === 'up';

  // 기간별 주가 데이터 및 툴팁 연산
  const chartData = stock.sparklines[selectedPeriod] || stock.sparklines['1W'];
  const chartW = 600, chartH = 120;
  const minP = Math.min(...chartData), maxP = Math.max(...chartData), rangeP = (maxP - minP) || 1;
  const isPeriodUp = chartData.length >= 2 ? (chartData[chartData.length - 1] >= chartData[0]) : isUp;

  const points = chartData.map((v, i) => {
    const x = (i / (chartData.length - 1)) * chartW;
    const y = chartH - ((v - minP) / rangeP) * (chartH * 0.72) - chartH * 0.14;
    return { x, y, val: v };
  });
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
  const lineColor = isDark ? (isPeriodUp ? '#69dbad' : '#ff8b8b') : (isPeriodUp ? '#3eb489' : '#ef4444');

  // 내 자산 실시간 / 가상 매수 리스크 체감 연산
  const isHeld = Boolean(stock.weight && stock.weight > 0);
  const userTotalAsset = 40000000;
  const stockHoldingValue = Math.round((userTotalAsset * (stock.weight || 0)) / 100);
  const impactLossValue = isHeld
    ? Math.round(stockHoldingValue * (simDropPct / 100))
    : Math.round(simVirtualAmount * (simDropPct / 100));

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      <RainEffect weatherStatus={stock.weather} isDark={isDark} />

      {/* ── 🚀 풀 화면 (100% 1920px 대형 해상도 대응) 컨테이너 ── */}
      <main className="relative z-10 pt-14 pb-10 px-4 sm:px-6 max-w-[1920px] lg:ml-60 lg:w-[calc(100%-240px)]">

        {/* ── 🌟 [통합 1] 단일 통합 헬스체크 히어로 타일 ── */}
        <div className={`mt-6 mb-4 p-5 sm:p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141715] border-white/10 shadow-lg' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* 좌측 종목 기본 정보 */}
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{stock.name}</h1>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${isDark ? 'bg-white/15 text-slate-200 border border-white/10' : 'bg-slate-200 text-slate-600'}`}>
                    {ticker}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                  <span className={`font-black text-sm sm:text-base ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-rose-400'}`}>
                    {stock.currentPrice} ({isUp ? '▲ +' : '▼ '}{stock.change.toFixed(1)}%)
                  </span>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>|</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-500'}>시총 {stock.marketCap}</span>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>|</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-500'}>52주 최고·최저 {stock.high52w} ~ {stock.low52w}</span>
                </div>
              </div>
            </div>

            {/* 우측 단일 통합 헬스체크 뱃지 묶음 (날씨 + 하락확률) */}
            <div className="flex items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
              {/* 기상도 뱃지 */}
              <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-slate-50 border-slate-200'
              }`}>
                <Icon name={wCfg.icon} className={`w-5 h-5 ${wCfg.color}`} />
                <span className="text-xs font-black">{wCfg.label}</span>
              </div>

              {/* -10% 하락 확률 뱃지 */}
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                stock.dropProb < 20
                  ? (isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                  : (isDark ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700')
              }`}>
                <span className="text-xs font-bold">20일 하락 확률</span>
                <span className="text-sm font-black font-mono">{stock.dropProb}%</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2컬럼 레이아웃 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ┌── 👈 좌측 메인 분석 영역 (8컬럼) ──┐ */}
          <div className="lg:col-span-8 space-y-4">

            {/* 📈 1. 인터랙티브 대형 주가 차트 카드 */}
            <div className={`rounded-2xl border p-5 sm:p-6 ${isDark ? 'bg-[#141715] border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    인터랙티브 주가 추이
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    그래프 데이터 지점에 마우스를 올리면 당일 종가를 확인하실 수 있습니다.
                  </p>
                </div>

                {/* 기간 선택 탭 (1D / 1W / 1M / 1Y) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 p-1 rounded-xl border border-transparent dark:border-white/10">
                  {['1D', '1W', '1M', '1Y'].map(t => (
                    <button
                      key={t}
                      onClick={() => { setSelectedPeriod(t); setHoveredIdx(null); }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                        selectedPeriod === t
                          ? (isDark ? 'bg-[#3eb489] text-white shadow-sm' : 'bg-[#3eb489] text-[#0f1713] shadow-sm font-bold')
                          : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-800')
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 대형 SVG 차트 */}
              <div className="relative">
                <svg
                  width="100%"
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  preserveAspectRatio="none"
                  className="h-36 w-full cursor-crosshair overflow-visible"
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <defs>
                    <linearGradient id="stockGradDashFullCons9" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* 가이드 점선 */}
                  <line x1="0" y1={chartH * 0.25} x2={chartW} y2={chartH * 0.25} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeDasharray="4 4" />
                  <line x1="0" y1={chartH * 0.5} x2={chartW} y2={chartH * 0.5} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeDasharray="4 4" />
                  <line x1="0" y1={chartH * 0.75} x2={chartW} y2={chartH * 0.75} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeDasharray="4 4" />

                  <polyline points={pointsStr + ` ${chartW},${chartH} 0,${chartH}`} fill="url(#stockGradDashFullCons9)" stroke="none" />
                  <polyline points={pointsStr} fill="none" stroke={lineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {points.map((p, idx) => {
                    const isHovered = hoveredIdx === idx;
                    const isEndpoint = idx === 0 || idx === points.length - 1;
                    return (
                      <g key={idx} onMouseEnter={() => setHoveredIdx(idx)}>
                        {(isHovered || isEndpoint) && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 6 : 3}
                            fill={lineColor}
                            className="transition-all duration-200"
                          />
                        )}
                        <rect
                          x={p.x - 20}
                          y={0}
                          width={40}
                          height={chartH}
                          fill="transparent"
                          className="cursor-pointer"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* 툴팁 */}
                {hoveredIdx !== null && points[hoveredIdx] && (
                  <div
                    className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-xl text-xs font-black font-mono border shadow-xl pointer-events-none ${
                      isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {points[hoveredIdx].val.toLocaleString()}원
                  </div>
                )}
              </div>
            </div>

            {/* 📋 2. 핵심 위험 근거 타임라인 카드 */}
            {stock.evidences && stock.evidences.length > 0 && (
              <div className={`rounded-2xl border p-5 sm:p-6 ${isDark ? 'bg-[#141715] border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h2 className={`text-base font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>핵심 위험 근거</h2>
                <div className="space-y-3">
                  {stock.evidences.map((ev, i) => (
                    <div key={i} className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-all ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                          ev.direction === '부정' ? (isDark ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-rose-100 text-rose-600') : (isDark ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 text-emerald-600')
                        }`}>{ev.type}</span>
                        <p className={`text-xs sm:text-sm leading-relaxed font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ev.title}</p>
                      </div>
                      <span className={`text-xs font-mono flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                        {ev.date || '2026.07.23'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ☂️ 3. 개미의 우산 AI 종합 리포트 카드 */}
            <div className={`rounded-2xl border p-5 sm:p-6 ${isDark ? 'bg-[#141715] border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="umbrella" className={`w-5 h-5 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`} />
                  <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    개미의 우산 AI 종합 리포트
                  </h2>
                </div>
                <button
                  onClick={() => setShowAiModal(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isDark ? 'bg-white/10 border-white/15 text-slate-200 hover:bg-white/15' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>💡</span>
                  <span>AI 산출 원리</span>
                </button>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                {stock.aiBriefing}
              </p>
            </div>

          </div>

          {/* └── 👉 우측 스마트 사이드 영역 (4컬럼 - 자산 계산기 & ESG 브레이크다운) ──┘ */}
          <div className="lg:col-span-4 space-y-4">

            {/* 💰 1. 내 자산 / 가상 매수 리스크 체감 시뮬레이터 듀얼 카드 */}
            <div className={`rounded-2xl border p-5 transition-all ${
              isDark ? 'bg-[#141715] border-emerald-500/30 shadow-[0_4px_20px_rgba(62,180,137,0.08)]' : 'bg-white border-emerald-200 shadow-md'
            }`}>
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{isHeld ? '💰' : '🔮'}</span>
                  <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    {isHeld ? '내 보유 자산 리스크 영향도' : '가상 매수 리스크 체감 시뮬레이터'}
                  </h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isHeld
                    ? (isDark ? 'bg-[#3eb489]/20 text-[#69dbad] border border-[#3eb489]/30' : 'bg-emerald-100 text-[#2d966e]')
                    : (isDark ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700')
                }`}>
                  {isHeld ? '보유 종목 체감' : '미보유 가상 체험'}
                </span>
              </div>

              {/* 보유 종목 ➔ 실시간 보유 현황 / 미보유 종목 ➔ 가상 매수금 선택 탭 */}
              {isHeld ? (
                <div className={`p-3 rounded-xl border mb-3 flex items-center justify-between ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>내 포트폴리오 비중</p>
                    <p className={`text-sm font-black font-mono ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                      {stock.weight}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>평가 금액 (4,000만 기준)</p>
                    <p className={`text-sm font-black font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {(stockHoldingValue / 10000).toLocaleString()}만 원
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`p-3 rounded-xl border mb-3 ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`text-[10px] font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    💡 이 종목을 얼마큼 매수해볼까요? (가상 투자금 선택)
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '100만', val: 1000000 },
                      { label: '300만', val: 3000000 },
                      { label: '500만', val: 5000000 },
                      { label: '1,000만', val: 10000000 },
                    ].map(item => (
                      <button
                        key={item.val}
                        onClick={() => setSimVirtualAmount(item.val)}
                        className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
                          simVirtualAmount === item.val
                            ? (isDark ? 'bg-[#3eb489] text-white shadow-sm' : 'bg-[#3eb489] text-white shadow-xs')
                            : (isDark ? 'bg-white/10 text-slate-300 hover:bg-white/15' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100')
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 하락율 조절 슬라이더 및 시뮬레이션 결과 */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-rose-950/30 border-rose-500/30 text-rose-300' : 'bg-rose-50/80 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span>
                    {isHeld ? '내 자산 주가' : `가상 매수금 (${(simVirtualAmount / 10000).toLocaleString()}만 원) 대비`}{' '}
                    <strong className="font-mono text-rose-400">{simDropPct}%</strong> 하락 시
                  </span>
                  <span className="font-black font-mono text-sm text-rose-400">
                    -{(impactLossValue).toLocaleString()}원
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="20"
                  value={simDropPct}
                  onChange={(e) => setSimDropPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-rose-200 dark:bg-rose-900/40 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />

                <div className="flex justify-between text-[9px] font-mono mt-1 opacity-70">
                  <span>-1%</span>
                  <span>-5% (표준)</span>
                  <span>-20% (급락)</span>
                </div>
              </div>

              {/* AI 팁 문구 */}
              <p className={`text-[10px] mt-2.5 leading-relaxed font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHeld
                  ? `💡 AI 예상 하락 확률(${stock.dropProb}%)과 연동되어 주가 변동 시 내 자산 손익을 실시간 계산합니다.`
                  : `💡 포트폴리오 미보유 종목입니다. 신규 매수 전 예상 위험 금액을 미리 체험해보세요!`}
              </p>
            </div>

            {/* 🌿 2. ESG 3대 영역 건강 진단 카드 (친근한 명칭, 여유로운 세로 영역 및 시인성 높은 글씨 크기) */}
            <div className={`rounded-2xl border p-5 sm:p-6 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  🌱 ESG 3대 영역 건강 진단
                </h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  실시간 이슈
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'e', title: '🌿 환경 (Environment)', item: stock.esgBreakdown?.e },
                  { key: 's', title: '🤝 사회 (Social)',       item: stock.esgBreakdown?.s },
                  { key: 'g', title: '🏛️ 지배구조 (Governance)',item: stock.esgBreakdown?.g },
                ].map(pillar => {
                  const isSafe = pillar.item?.status === 'safe';
                  const isDanger = pillar.item?.status === 'danger';
                  return (
                    <div
                      key={pillar.key}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isSafe
                          ? (isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/70 border-emerald-200')
                          : isDanger
                          ? (isDark ? 'bg-rose-950/20 border-rose-500/20' : 'bg-rose-50/70 border-rose-200')
                          : (isDark ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50/70 border-amber-200')
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-black block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {pillar.title}
                        </span>
                        <p className={`text-xs font-bold leading-snug mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {pillar.item?.text || '표준 모니터링 수칙 준수 중'}
                        </p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1 rounded-xl flex-shrink-0 shadow-sm ${
                        isSafe
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isDanger
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isSafe ? '안전 🟢' : isDanger ? '위험 🔴' : '주의 🟡'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ── 💡 AI 예측 원리 모달 팝업 ── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#181b19] border-white/10 text-white' : 'bg-white border-slate-200 text-[#0f1713]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black flex items-center gap-2">
                💡 XGBoost AI 예측 산출 원리
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                <strong>1. 업종별 ESG 중요 이슈 판정</strong>: 해당 업종에 직접 영향을 미치는 핵심 리스크(탄소배출, 지배구조 등)를 선별합니다.
              </p>
              <p>
                <strong>2. 머신러닝 하락 위험 예측</strong>: 20거래일 내 주가가 떨어질 확률을 최근 주가 흐름 및 거시경제 지표와 종합 분석합니다.
              </p>
              <p>
                <strong>3. 예측 검증 수치</strong>: 과거 1,382건 데이터 검증 결과 88.4%의 높은 예측 정확도를 보여주고 있습니다.
              </p>
            </div>

            <button
              onClick={() => setShowAiModal(false)}
              className="w-full py-3 rounded-xl bg-[#3eb489] text-[#0a1f14] text-xs font-black hover:bg-[#69dbad] transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
