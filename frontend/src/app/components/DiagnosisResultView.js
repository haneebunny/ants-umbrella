"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 💡 초보자도 찰떡같이 이해하는 뉴닉(NEWNEEK) 톤앤매너 쉬운 브리핑 및 추천 캐시 맵
 */
const NEWNEEK_RECOMMENDATION_REASON_CACHE = {      
  // 보수형 (CONSERVATIVE)
  CONSERVATIVE: {
    characterName: '든든한 방패 개미',
    characterEmoji: '🛡️',
    shieldDesc: '원금 손실은 절대 못 참아! 소폭의 악재 소식에도 든든한 방패로 하방을 딱 막아낸다구 🛡️',
    fullDescription: '내 피 같은 원금은 단 1원도 잃을 수 없다구! 🛡️ 주가가 널뛰는 무서운 파도 대신, 은행 예적금보다 살짝 똑똑하게 "꼬박꼬박 배당금 나오는 튼튼한 회사의 주식"이랑 "안전한 채권"에 내 보물상자를 나눠 묻어두는 든든한 파수꾼이야!',
    mentalMindset: '주가가 살짝 출렁여도 조급해하거나 쫄지 말자구!',
    mentalAction: '혜자로운 고배당주의 분기 배당금 챙기면서 날씨가 맑아질 때까지 안전 대피하기 ☂️',
    badgeBg: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    colorTheme: '#3b82f6',
    riskProbThreshold: 15,
    maxLossDefault: 5,
    rule1: '보유 종목 관련 중대 ESG 악재 소식이나 공시가 뜨면 즉시 삐삐 알림!',
    rule2: 'AI 하락 확률 연산 결과 20일 내 -10% 하락 확률이 >15% 넘어서면 비상 경보!',
    rule3: '비상 경보가 켜지면 해당 종목 계좌 비중을 25% 이하로 칼같이 축소 권장!',
    recommendationPools: [
      [
        { ticker: '032830', name: '삼성생명', tag: '#전통방어주', reason: '탄탄한 재무구조랑 지배구조 방어력이 든든해서 주가 하방을 딱 잡아준다구! 🛡️', weight: '35%' },
        { ticker: '105560', name: 'KB금융', tag: '#고배당금융', reason: '탄탄한 이자이익에 혜자로운 주주환원 분기 배당까지 챙겨주는 배당 효자주야 💰', weight: '30%' },
        { ticker: '033780', name: 'KT&G', tag: '#경기방어', reason: '장세가 흔들려도 변동성 영향을 적게 받는 대표 경기 방어 대장주라구 🚬', weight: '20%' },
        { ticker: '005380', name: '현대차', tag: '#대형우량', reason: '글로벌 완성차 실적도 좋고 자사주 소각 밸류업 모멘텀이 모락모락 피어올라 🚗', weight: '15%' },
      ],
      [
        { ticker: '055550', name: '신한지주', tag: '#배당안정', reason: '지속가능한 ESG 금융 경영에 분기 배당으로 계좌를 오순도순 지켜줘 🏦', weight: '25%' },
        { ticker: '017670', name: 'SK텔레콤', tag: '#통신방어주', reason: '탄탄한 통신 인프라 기반으로 매달 쏠쏠한 현금흐름 and 높은 배당을 챙겨줘 📱', weight: '25%' },
        { ticker: '028260', name: '삼성물산', tag: '#지배구조우수', reason: '그룹 지배구조의 핵심이자 친환경 신사업까지 챙기는 안전한 버팀목이야 🏗️', weight: '20%' },
        { ticker: '010950', name: 'S-Oil', tag: '#정유대표', reason: '에너지 수급 안정성이 뛰어나고 단기 시장 변동성에도 끄떡없는 정유 대장이야 ⛽', weight: '15%' },
        { ticker: '032830', name: '삼성생명', tag: '#안정배당', reason: '탄탄한 자산 건전성으로 매 분기마다 따뜻한 배당금을 안겨주는 효자야 🛡️', weight: '15%' },
      ],
      [
        { ticker: '005490', name: 'POSCO홀딩스', tag: '#친환경원자재', reason: '글로벌 철강 수요 안정성에 친환경 소재까지 포트폴리오를 예쁘게 분산해줘 ⚙️', weight: '35%' },
        { ticker: '005380', name: '현대차', tag: '#밸류업대형주', reason: '주주 환원책 확대에 저평가 밸류에이션이라 방어력이 아주 훌륭하다구! 🚘', weight: '30%' },
        { ticker: '028260', name: '삼성물산', tag: '#지배구조핵심', reason: '안정적인 지분 가치에 친환경 인프라까지 갖춘 우량 자산이라구 🏢', weight: '20%' },
        { ticker: '033780', name: 'KT&G', tag: '#인플레이션방어', reason: '가격 전가능력이 우수해서 물가 상승기에도 탄탄한 배당 방어선을 자랑해 ☕', weight: '15%' },
      ]
    ]
  },

  // 안정추구형 (MODERATE_CONSERVATIVE)
  MODERATE_CONSERVATIVE: {
    characterName: '신중한 파수꾼 개미',
    characterEmoji: '🦉',
    shieldDesc: '예적금 이자는 아쉽지만 무리한 위험은 싫어! 대형 우량주로 차분하게 위험을 분산해 🦉',
    fullDescription: '은행 이자만 받기엔 아깝지만 큰 위험은 질색이야! 🦉 이름만 대면 누구나 아는 대한민국 1등 대표 우량주들에 살포시 뿌리내리고, 주가가 좀 흔들려도 차분하게 배당 받으면서 야금야금 자산을 늘려가는 돌다리도 두들기는 신중파라구!',
    mentalMindset: '과도한 악재 찌라시 소문이나 뉴스에 뇌동매매 금지!',
    mentalAction: '우량주의 실적 체력을 믿되, AI 하락 확률 25% 진입 시 비중 30% 차분하게 조절하기 💡',
    badgeBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    colorTheme: '#10b981',
    riskProbThreshold: 25,
    maxLossDefault: 8,
    rule1: '보유 종목 관련 중대 ESG 악재나 공시 정보가 포착되면 실시간으로 알려줘!',
    rule2: 'AI 하락 확률 연산 결과 20일 내 -10% 하락 확률이 >25% 넘어서면 옐로우 경보!',
    rule3: '경보가 발생하면 포트폴리오 기상도를 확인하고 해당 비중을 30% 이하로 조절 권장!',
    recommendationPools: [
      [
        { ticker: '105560', name: 'KB금융', tag: '#고배당금융', reason: '안정적인 대출 포트폴리오에 금리 변동성 방어선까지 든든하게 갖췄어 🏦', weight: '30%' },
        { ticker: '032830', name: '삼성생명', tag: '#전통방어주', reason: '자산 운용의 안정성을 중심에 둔 대표적인 금융 방어 자산이라구 🛡️', weight: '30%' },
        { ticker: '005380', name: '현대차', tag: '#대형우량주', reason: '안정적인 글로벌 현금 흐름에 세계 점유율을 무섭게 유지하고 있어 🚙', weight: '20%' },
        { ticker: '033780', name: 'KT&G', tag: '#안정배당', reason: '안정적인 현금흐름 and 인플레이션을 방어해주는 든든한 효자 종목이야 🍃', weight: '20%' },
      ],
      [
        { ticker: '005490', name: 'POSCO홀딩스', tag: '#원자재다각화', reason: '전통 철강 소재에 친환경 이차전지 원소재 사업까지 다각화 성공했어 ⛓️', weight: '30%' },
        { ticker: '055550', name: '신한지주', tag: '#안정수익', reason: '금융지주 차원의 지속가능 ESG 경영으로 주주환원을 차곡차곡 확대 중이야 💳', weight: '30%' },
        { ticker: '017670', name: 'SK텔레콤', tag: '#통신배당', reason: '탄탄한 전국민 가입자 기반으로 높은 배당 수익률 방어선을 자랑해 📶', weight: '20%' },
        { ticker: '000270', name: '기아', tag: '#완성차우량', reason: '해외 수출 호조에 글로벌 밸류체인 실적 개선 가시성이 아주 우수해 🚘', weight: '20%' },
      ],
      [
        { ticker: '032830', name: '삼성생명', tag: '#안정금융', reason: '장기 자산 운용의 안정성이 뛰어나서 자본 유동성이 아주 탄탄해 🏛️', weight: '30%' },
        { ticker: '010950', name: 'S-Oil', tag: '#에너지인프라', reason: '글로벌 정유 업황 저점에서 매수하기 좋은 실적 안정주라구 🛢️', weight: '30%' },
        { ticker: '005380', name: '현대차', tag: '#자동차밸류', reason: '영업이익률도 좋고 장기 주주가치 제고 모멘텀이 솔솔 피어나 🏎️', weight: '20%' },
        { ticker: '017670', name: 'SK텔레콤', tag: '#배당수익률', reason: '고배당 주주환원 정책으로 내수 경기 실적을 딱 받쳐주는 효자야 📞', weight: '20%' },
      ]
    ]
  },

  // 위험중립형 (BALANCED)
  BALANCED: {
    characterName: '지혜로운 균형 개미',
    characterEmoji: '⚖️',
    shieldDesc: '안전과 수익 두 마리 토끼 다 잡을래! 성장성과 안전성의 황금 밸런스 ⚖️',
    fullDescription: '안전도 챙기고 수익도 챙기는 황금 밸런스왕이야! ⚖️ 어느 정도 주가가 오르내리는 파도는 즐겁게 타면서도, 회사에 혹시나 나쁜 소식(ESG 악재)이 터져 급락할까봐 개미의 우산을 준비해 두는 똑똑한 투자자라구! 어느 한쪽으로 쏠리지 않는 게 내 필살기야!',
    mentalMindset: '시장의 일상적인 주가 파도를 자연스러운 현상으로 받아들이기!',
    mentalAction: '특정 테크주 몰빵은 금물! 업종 분산 포트폴리오 밸런스 딱 준수하기 ⚖️',
    badgeBg: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    colorTheme: '#f59e0b',
    riskProbThreshold: 40,
    maxLossDefault: 12,
    rule1: '보유 종목의 SASB 업종별 Materiality 중대 악재 소식이 감지되면 즉시 포착!',
    rule2: 'AI 하락 확률 연산 결과 20일 내 -10% 하락 확률이 >40% 진입 시 경보 발송!',
    rule3: '경보 발생 시 해당 종목 보유 비중을 35% 이하로 가이드에 맞춰 스마트하게 조절!',
    recommendationPools: [
      [
        { ticker: '005490', name: 'POSCO홀딩스', tag: '#철강친환경', reason: '전통 친환경 소재랑 이차전지 원소재를 예쁘게 다각화한 우량 기업이야 ⚙️', weight: '25%' },
        { ticker: '068270', name: '셀트리온', tag: '#바이오헬스', reason: '글로벌 바이오시밀러 램시마 공급으로 지속적인 성장 슛을 쏘고 있어 💊', weight: '25%' },
        { ticker: '055550', name: '신한지주', tag: '#안정수익', reason: '금융지주 차원의 ESG 경영과 주주환원으로 포트폴리오 밸런스를 잡아줘 🏦', weight: '25%' },
        { ticker: '000270', name: '기아', tag: '#수출주도주', reason: '글로벌 친환경차 판매 호조로 실적 성장이 눈부시게 가시화되고 있어 🚗', weight: '25%' },
      ],
      [
        { ticker: '005930', name: '삼성전자', tag: '#대형테크', reason: '메모리 수급 반등과 글로벌 반도체를 상징하는 대한민국 대표 대장주야 💻', weight: '26%' },
        { ticker: '051910', name: 'LG화학', tag: '#첨단소재', reason: '배터리 첨단 소재와 친환경 화학 소재의 황금 밸런스를 자랑해 🧪', weight: '25%' },
        { ticker: '028260', name: '삼성물산', tag: '#지배구조', reason: '그룹 지배구조 핵심에 신재생 에너지 사업 확대로 밸런스를 딱 잡아 🏢', weight: '25%' },
        { ticker: '010950', name: 'S-Oil', tag: '#energy전환', reason: '샤힌 프로젝트 중심의 석유화학 대형 투자로 미래 성장성을 더했어 🛢️', weight: '24%' },
      ],
      [
        { ticker: '000660', name: 'SK하이닉스', tag: '#AI반도체주도', reason: '차세대 HBM 시장 리더십으로 성장주와 우량주의 완벽 조화를 보여줘 🚀', weight: '20%' },
        { ticker: '032830', name: '삼성생명', tag: '#전통금융방어', reason: '안정적인 배당 방어선으로 포트폴리오 안전장치 역할을 똑똑히 해내 🛡️', weight: '20%' },
        { ticker: '005380', name: '현대차', tag: '#글로벌완성차', reason: '수출 수익성 개선에 장기 주주환원을 확대하는 성장형 대장주야 🏎️', weight: '20%' },
        { ticker: '035420', name: 'NAVER', tag: '#IT플랫폼', reason: '디지털 커머스와 클라우드로 안정적인 현금창출력을 자랑하는 플랫폼이야 🌐', weight: '20%' },
        { ticker: '000270', name: '기아', tag: '#친환경차대표', reason: '글로벌 하이브리드 및 전기차 경쟁력을 갖춰 중립형의 든든한 날개가 돼 🚘', weight: '20%' },
      ]
    ]
  },

  // 성장형 (GROWTH)
  GROWTH: {
    characterName: '용감한 항해 개미',
    characterEmoji: '⛵',
    shieldDesc: '고수익을 위해서라면 파도쯤이야 감내한다구! 반도체·AI 성장 산업 항해사 ⛵',
    fullDescription: '큰 수익을 잡으려면 시원한 파도를 타야지! ⛵ 반도체·AI·2차전지처럼 앞으로 세상을 바꿀 핫한 테크 회사들에 돛을 달고 힘차게 나아가는 항해사야! 파도가 높아도 무서워하지 않고, 경보가 울릴 때만 스마트하게 위험을 피한다구!',
    mentalMindset: '테크·성장주의 높은 주가 변동성을 공포로 느끼지 않기!',
    mentalAction: 'AI 하락 경보가 울리면 머뭇거리지 않고 손절매 감축 원칙 사수하기 🌊',
    badgeBg: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
    colorTheme: '#06b6d4',
    riskProbThreshold: 60,
    maxLossDefault: 20,
    rule1: '성장/테크 종목군 관련 주요 산업 이슈와 ESG 부정 공시 소식을 실시간으로 포착!',
    rule2: 'AI 하락 확률 연산 결과 20일 내 -10% 하락 확률이 >60% 진입 시 경고 깃발 펄럭!',
    rule3: '고위험 경보가 뜨면 손절매 기준선을 점검하고 비중을 40% 이하로 칼같이 유지!',
    recommendationPools: [
      [
        { ticker: '000660', name: 'SK하이닉스', tag: '#HBM주도주', reason: '차세대 AI 메모리 HBM4 시장 독점력으로 고성장 파도를 씽씽 타고 있어! 🚀', weight: '35%' },
        { ticker: '005930', name: '삼성전자', tag: '#국민테크주', reason: '글로벌 반도체 밸류체인의 핵심이자 리딩 모멘텀을 쥐고 있는 대장이야 💻', weight: '30%' },
        { ticker: '373220', name: 'LG에너지솔루션', tag: '#2차전지', reason: '차세대 배터리 기술 상용화에 대규모 글로벌 공급망을 확보한 고성장주야 🔋', weight: '20%' },
        { ticker: '035420', name: 'NAVER', tag: '#AI플랫폼', reason: '대한민국 대표 AI 검색 플랫폼과 디지털 생성형 AI 생태계의 주인공이야 🤖', weight: '15%' },
      ],
      [
        { ticker: '068270', name: '셀트리온', tag: '#바이오신약', reason: '미국 짐펜트라 신약 직판으로 고마진 바이오 턴어라운드를 쏘아 올렸어 💉', weight: '35%' },
        { ticker: '005490', name: 'POSCO홀딩스', tag: '#리튬소재', reason: '아르헨티나 리튬 염호 상업 생산 개시로 이차전지 성장 돛을 달았어 🧂', weight: '30%' },
        { ticker: '051910', name: 'LG화학', tag: '#양극재성장', reason: '양극재 대규모 장기 공급 계약으로 첨단소재 성장을 드라이브하고 있어 🧪', weight: '20%' },
        { ticker: '000270', name: '기아', tag: '#EV모멘텀', reason: '전용 전기차 라인업 확대로 미국 시장 점유율을 무섭게 올리고 있어 ⚡', weight: '15%' },
      ],
      [
        { ticker: '051910', name: 'LG화학', tag: '#배터리첨단소재', reason: '양극재 생산 능력 폭발에 차세대 친환경 소재 성장성까지 우수해 🔬', weight: '35%' },
        { ticker: '035420', name: 'NAVER', tag: '#생성형AI플랫폼', reason: 'B2B AI 솔루션과 검색 광고 플랫폼으로 알파 수익을 창출해 📲', weight: '30%' },
        { ticker: '000270', name: '기아', tag: '#글로벌EV모멘텀', reason: '미국 조지아 신공장 가동으로 전기차 판매 호조 모멘텀을 탔어 🚘', weight: '20%' },
        { ticker: '000660', name: 'SK하이닉스', tag: '#HBM독점공급망', reason: '글로벌 엔비디아 AI 생태계 최선호 반도체 파트너로 고공 비행 중이야 🛰️', weight: '15%' },
      ]
    ]
  },

  // 공격형 (AGGRESSIVE)
  AGGRESSIVE: {
    characterName: '불꽃 개척 개미',
    characterEmoji: '🔥',
    shieldDesc: '변동성은 내 친구! 알파 수익률 극대화를 향해 불꽃처럼 돌진한다구 🔥',
    fullDescription: '하이리스크 하이리턴! 뜨거운 알파 수익을 향해 불꽃처럼 돌진하는 열정 개척자야! 🔥 주가가 심하게 흔들려도 절대 쫄지 않고 고성장 모멘텀을 사냥하러 다니지! 대신 급락 경보가 빨간불을 켤 때는 우산을 펼치는 센스도 잊지 않는다구!',
    mentalMindset: '알파 수익을 향해 돌진하되 시장 열기에 눈이 멀지 않기!',
    mentalAction: 'AI 급락 확률 예측 지표가 빨간불을 켤 때 자산 보호선부터 챙기기 🔥',
    badgeBg: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    colorTheme: '#f43f5e',
    riskProbThreshold: 75,
    maxLossDefault: 30,
    rule1: '고변동 종목군 관련 급락 위험 소식이나 부정 공시가 뜨면 즉시 사이렌 작동!',
    rule2: 'AI 하락 확률 연산 결과 20일 내 -10% 하락 확률이 >75% 진입 시 비상 레벨 최고조!',
    rule3: '극위험 경보가 발동되면 전량 자산 보호선(손절매 및 리밸런싱)을 즉시 가동!',
    recommendationPools: [
      [
        { ticker: '000660', name: 'SK하이닉스', tag: '#HBM주도주', reason: '글로벌 AI 빅테크 공급망 최선호 반도체 대장주로 주력 슛을 쏜다구! 🚀', weight: '40%' },
        { ticker: '373220', name: 'LG에너지솔루션', tag: '#고성장배터리', reason: '북미 전기차 공급 확대에 따른 높은 알파 변동성 모멘텀이야 ⚡', weight: '30%' },
        { ticker: '005930', name: '삼성전자', tag: '#반도체빅테크', reason: '메모리 수급 반등과 차세대 파운드리 턴어라운드 알파 타겟이야 💻', weight: '15%' },
        { ticker: '035420', name: 'NAVER', tag: '#생성형AI', reason: '클라우드와 생성형 AI 상용화로 주가 민감도가 아주 극대화되었어 🤖', weight: '15%' },
      ],
      [
        { ticker: '068270', name: '셀트리온', tag: '#바이오알파', reason: '신약 매출 비중 확대에 따른 고변동 성장주 타겟으로 손색없어 💉', weight: '25%' },
        { ticker: '051910', name: 'LG화학', tag: '#양극재알파', reason: '글로벌 양극재 공급망 모멘텀 수혜로 주가 레버리지가 높아 🧪', weight: '20%' },
        { ticker: '000660', name: 'SK하이닉스', tag: '#AI반도체', reason: '차세대 HBM 독점 지위로 영업이익률 극대화 알파를 누려 🛰️', weight: '15%' },
        { ticker: '373220', name: 'LG에너지솔루션', tag: '#차세대배터리', reason: '4680 원통형 배터리 양산 모멘텀으로 화끈하게 쏜다구! 🔋', weight: '15%' },
        { ticker: '035420', name: 'NAVER', tag: '#생성형AI', reason: '하이퍼클로바X B2B 수익화 모델 가시성으로 높은 변동성을 자랑해 🤖', weight: '15%' },
        { ticker: '005490', name: 'POSCO홀딩스', tag: '#리튬소재주', reason: '친환경 이차전지 핵심 원자재 리튬 업황의 레버리지 혜택을 듬뿍 받아 🧂', weight: '10%' },
      ],
      [
        { ticker: '035420', name: 'NAVER', tag: '#AI알파모멘텀', reason: '생성형 AI 하이퍼클로바X 상용화로 쏠쏠한 알파 수익 창출 가능 🌐', weight: '40%' },
        { ticker: '005490', name: 'POSCO홀딩스', tag: '#리튬원소재', reason: '글로벌 양극재 및 리튬 가격 반등 시 높은 주가 레버리지 발휘 🧂', weight: '30%' },
        { ticker: '000660', name: 'SK하이닉스', tag: '#반도체고변동', reason: 'AI 수요 폭증 시 주가 주도력을 최고 수준으로 보여주는 챔피언 🚀', weight: '15%' },
        { ticker: '373220', name: 'LG에너지솔루션', tag: '#북미배터리알파', reason: '미국 IRA 보조금 수혜와 고변동 테크 모멘텀의 화려한 만남이야 ⚡', weight: '15%' },
      ]
    ]
  },
};

const BANDS_CONFIG = [
  { key: 'CONSERVATIVE', label: '보수', emoji: '🛡️' },
  { key: 'MODERATE_CONSERVATIVE', label: '안정', emoji: '🦉' },
  { key: 'BALANCED', label: '중립', emoji: '⚖️' },
  { key: 'GROWTH', label: '성장', emoji: '⛵' },
  { key: 'AGGRESSIVE', label: '공격', emoji: '🔥' },
];

export default function DiagnosisResultView({ profile, isDark, onReDiagnose }) {
  const router = useRouter();

  // 사용자의 원본 진단 성향
  const userOriginalBand = profile?.target_risk_band || 'BALANCED';
  
  // 현재 사용자가 토글 스위치로 선택해 비교 관찰 중인 성향
  const [selectedBand, setSelectedBand] = useState(userOriginalBand);

  // 실시간 방어망 ON/OFF 상태 (기본값 ON: true)
  const [isDefenseOn, setIsDefenseOn] = useState(true);

  // 로컬 스토리지 방어망 설정 로드
  useEffect(() => {
    try {
      const savedDefense = localStorage.getItem('ants_shield_defense_active');
      if (savedDefense !== null) {
        setIsDefenseOn(savedDefense === 'true');
      }
    } catch (e) {
      console.warn('Failed to load defense toggle state:', e);
    }
  }, []);

  // 미니 슬라이더 스위치 토글 핸들러
  const handleToggleDefense = () => {
    const nextState = !isDefenseOn;
    setIsDefenseOn(nextState);
    try {
      localStorage.setItem('ants_shield_defense_active', String(nextState));
    } catch (e) {
      console.warn('Failed to save defense toggle state:', e);
    }
  };

  // 추천 종목 세트 새로고침 상태
  const [setIndex, setSetIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // 💡 백엔드 DB/로컬 캐시 동기화 상태
  const [dbCachedReasons, setDbCachedReasons] = useState({});

  const extras = NEWNEEK_RECOMMENDATION_REASON_CACHE[selectedBand] || NEWNEEK_RECOMMENDATION_REASON_CACHE.BALANCED;
  const isUserMatch = selectedBand === userOriginalBand;

  const recPools = extras.recommendationPools || [extras.recommendations];
  const currentRecs = recPools[setIndex % recPools.length];

  // 💡 백엔드 DB/로컬 캐시 비동기 동기화 (Cache-First Strategy)
  useEffect(() => {
    async function fetchBackendCachedReasons() {
      try {
        const promises = currentRecs.map(async (item) => {
          const url = `/api/v1/recommendations/reasons?ticker=${item.ticker}&risk_band=${selectedBand}&stock_name=${encodeURIComponent(item.name)}&tag=${encodeURIComponent(item.tag)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            return { ticker: item.ticker, reason: data.reason, source: data.source };
          }
          return null;
        });

        const results = await Promise.all(promises);
        const newMap = {};
        results.forEach((r) => {
          if (r && r.reason) {
            newMap[r.ticker] = r.reason;
          }
        });
        setDbCachedReasons(prev => ({ ...prev, ...newMap }));
      } catch (err) {
        // 백엔드 연결 불가 시 로컬 정적 캐시로 매끄럽게 지속 폴백
      }
    }

    if (currentRecs && currentRecs.length > 0) {
      fetchBackendCachedReasons();
    }
  }, [selectedBand, setIndex, currentRecs]);

  if (!profile) return null;

  const handleRefreshRecs = () => {
    setIsRotating(true);
    setSetIndex((prev) => (prev + 1) % recPools.length);
    setTimeout(() => setIsRotating(false), 500);
  };

  // 원클릭 방어 적용
  const handleApplyPortfolio = () => {
    setIsApplying(true);
    try {
      const newPortfolio = currentRecs.map((item) => ({
        ticker: item.ticker,
        name: item.name,
        weight: parseInt(item.weight, 10) || 25,
        tag: item.tag,
      }));

      localStorage.setItem('ants_portfolio', JSON.stringify(newPortfolio));

      const updatedProfile = {
        ...profile,
        target_risk_band: selectedBand,
        risk_band_name: NEWNEEK_RECOMMENDATION_REASON_CACHE[selectedBand]?.characterName || '맞춤 성향',
      };
      localStorage.setItem('ants_result_profile', JSON.stringify(updatedProfile));

      setTimeout(() => {
        setIsApplying(false);
        router.push('/?applied=true');
      }, 600);
    } catch (e) {
      console.error('Failed to apply portfolio:', e);
      setIsApplying(false);
    }
  };

  // 2단계 경보 트리거 하락 확률 Threshold (%)
  const riskProbThreshold = extras.riskProbThreshold || 40;

  // 최대 손실 허용 한도 (%)
  const maxLossPercent = isUserMatch
    ? (profile.maximum_loss_tolerance ? Math.round(profile.maximum_loss_tolerance * 100) : extras.maxLossDefault)
    : extras.maxLossDefault;

  return (
    <div className="w-full space-y-6">
      {/* ── 와이드 웹 대시보드 2컬럼 그리드 (8 : 4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── [좌측 8컬럼] 메인 리포트 영역 ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. 메인 개미 캐릭터 & 성향 브리핑 카드 */}
          <div
            className={`relative overflow-hidden rounded-3xl border p-6 lg:p-8 transition-all ${
              isDark
                ? 'bg-gradient-to-br from-[#161a17] via-[#1c221e] to-[#0f1210] border-white/10 shadow-2xl'
                : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 border-emerald-100 shadow-xl'
            }`}
          >
            {/* 글로우 장식 */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* 헤더 행: 성향 뱃지 & 일체형 토글 스위치 */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${extras.badgeBg}`}>
                  {BANDS_CONFIG.find(b => b.key === selectedBand)?.label}형
                </span>
                {isUserMatch ? (
                  <span className="text-[11px] font-bold text-emerald-500">
                    🎯 내 성향이야!
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-500">
                    👀 엿보는 중이야!
                  </span>
                )}
              </div>

              {/* ⚡ 미니멀 일체형 알약 토글 스위치 */}
              <div className={`p-1 rounded-xl flex items-center gap-0.5 border ${
                isDark ? 'bg-black/30 border-white/10' : 'bg-emerald-500/[0.06] border-emerald-200/50'
              }`}>
                {BANDS_CONFIG.map((b) => {
                  const isSelected = selectedBand === b.key;
                  return (
                    <button
                      key={b.key}
                      onClick={() => {
                        setSelectedBand(b.key);
                        setSetIndex(0);
                      }}
                      title={`${b.label} 성향 보기`}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? (isDark
                            ? 'bg-[#3eb489] text-[#002115] font-black shadow-sm'
                            : 'bg-[#3eb489] text-white font-black shadow-sm')
                          : (isDark
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            : 'text-emerald-900/60 hover:text-emerald-900 hover:bg-emerald-500/10')
                      }`}
                    >
                      <span>{b.emoji}</span>
                      <span className="hidden sm:inline">{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 프로필 및 타이틀 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner border flex-shrink-0 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-emerald-100 shadow-md'
                  }`}
                >
                  {extras.characterEmoji}
                </div>

                <div>
                  <h1 className={`text-2xl lg:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {extras.characterName}
                  </h1>
                  <p className={`text-xs lg:text-sm mt-1 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {extras.shieldDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* 설명 본문 */}
            <div className={`mt-5 p-4 rounded-2xl text-xs lg:text-sm leading-relaxed border ${
              isDark ? 'bg-white/[0.03] border-white/5 text-slate-300' : 'bg-emerald-50/60 border-emerald-100 text-slate-700'
            }`}>
              💡 <strong className="font-bold">한눈에 보는 쉬운 성향 브리핑:</strong> {extras.fullDescription}
            </div>

            {/* 🔄 성향 다시 진단하기 보조 버튼 (2번 문제 방지 장치) */}
            {onReDiagnose && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={onReDiagnose}
                  className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/80 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span>🔄 설문 다시 응답하기 (처음부터 재진단)</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. 성향 맞춤 추천 포트폴리오 대표 종목 리스트 */}
          <div className={`p-6 lg:p-8 rounded-3xl border ${isDark ? 'bg-[#181c19] border-white/5 shadow-xl' : 'bg-white border-slate-100 shadow-md'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  💡 [{extras.characterName}] 맞춤 포트폴리오 레시피 📜
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {extras.characterName} 성향에 꼭 맞춘 대표 추천 종목 조합이라구! (조합 {(setIndex % recPools.length) + 1}/{recPools.length})
                </p>
              </div>

              {/* 새로고침 버튼 */}
              <button
                onClick={handleRefreshRecs}
                className={`self-start sm:self-auto px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800 shadow-sm'
                }`}
              >
                <span className={`inline-block transition-transform duration-500 ${isRotating ? 'rotate-[360deg]' : ''}`}>
                  🔄
                </span>
                <span>다른 종목 섞어보기 (조합 {(setIndex % recPools.length) + 1}/{recPools.length})</span>
              </button>
            </div>

            {/* 종목 카드 그리드 (DB / 로컬 캐시 우선 표시!) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {currentRecs.map((item) => {
                const finalReason = dbCachedReasons[item.ticker] || item.reason;
                return (
                  <div
                    key={item.ticker}
                    onClick={() => router.push(`/stock/${item.ticker}`)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                      isDark
                        ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-white/10'
                        : 'bg-slate-50 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                          {item.ticker}
                        </span>
                      </div>
                      <span className="text-xs font-black text-[#3eb489] px-2 py-0.5 rounded-full bg-[#3eb489]/10">
                        황금비중 {item.weight}
                      </span>
                    </div>

                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 mb-2">
                      {item.tag}
                    </span>

                    <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      💬 <strong className="font-semibold">추천 이유:</strong> {finalReason}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 🎯 이 추천 종목들로 내 대시보드 기상도 바로 시작하기 버튼 */}
            <button
              onClick={handleApplyPortfolio}
              disabled={isApplying}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg border ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/30'
                  : 'bg-gradient-to-r from-[#3eb489] to-teal-500 hover:from-[#349e77] hover:to-teal-600 text-white border-emerald-300'
              }`}
            >
              {isApplying ? (
                <>
                  <span className="inline-block animate-spin">🔄</span>
                  <span>포트폴리오 조립 중...</span>
                </>
              ) : (
                <>
                  <span>🎯 이 종목 조합으로 내 우산 기상도 모니터링 시작할래!</span>
                  <span className="text-base">☔ ➔</span>
                </>
              )}
            </button>
          </div>

        </div>


        {/* ── [우측 4컬럼] 개미의 우산 쉴드 3단계 작동 규칙 & 뉴닉 대화체 멘탈 팁 말풍선 ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. ☔ 내 맞춤 우산 쉴드 3단계 작동 규칙 카드 (일체형 통합 완료!) */}
          <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
            isDark
              ? 'bg-gradient-to-br from-[#19221d] to-[#121614] border-emerald-500/20 shadow-xl'
              : 'bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border-emerald-100 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                isDefenseOn ? 'text-emerald-500' : (isDark ? 'text-slate-500' : 'text-slate-400')
              }`}>
                ☔ [{extras.characterName}] 우산 쉴드
              </span>

              {/* 🔘 미니 슬라이더 스위치 */}
              <button
                onClick={handleToggleDefense}
                className="flex items-center gap-2 cursor-pointer group"
                title={`실시간 방어망 ${isDefenseOn ? '비활성화' : '활성화'}`}
              >
                <span className={`text-[11px] font-bold ${
                  isDefenseOn ? 'text-emerald-500' : (isDark ? 'text-slate-500' : 'text-slate-400')
                }`}>
                  방어망 {isDefenseOn ? 'ON' : 'OFF'}
                </span>

                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  isDefenseOn ? 'bg-emerald-500' : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    isDefenseOn ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            </div>

            {/* 3단계 방어 규칙 리스트 */}
            <div className={`space-y-3 py-1 transition-all ${
              isDefenseOn ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
            }`}>
              {/* 1단계 */}
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/80 border-emerald-100/60 shadow-sm'}`}>
                <div className="text-[11px] font-black text-emerald-500 mb-0.5 flex items-center gap-1">
                  <span>📰 1단계: 악재 포착</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {extras.rule1}
                </p>
              </div>

              {/* 2단계 (💡 하락 경보 모니터링 기준선 일체형 통합!) */}
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/80 border-emerald-100/60 shadow-sm'}`}>
                <div className="text-[11px] font-black text-rose-400 mb-1 flex items-center justify-between">
                  <span>🚨 2단계: AI 경보 삐삐</span>
                  
                  {/* 미니 수치 뱃지 */}
                  <div className="flex gap-1 text-[9px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">확률 &gt;{riskProbThreshold}%</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">손실선 -{maxLossPercent}%</span>
                  </div>
                </div>
                
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {extras.rule2}
                </p>

                {/* 2단계 하단 수치 안내 꼬리표 */}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 border-t border-slate-200 dark:border-white/5 pt-1">
                  * {riskProbThreshold}%를 초과하는 순간 삐삐 알림이 발송되며, 전체 계좌 손실 방어선은 -{maxLossPercent}%로 모니터링해!
                </p>
              </div>

              {/* 3단계 */}
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/80 border-emerald-100/60 shadow-sm'}`}>
                <div className="text-[11px] font-black text-blue-400 mb-0.5 flex items-center gap-1">
                  <span>🛡️ 3단계: 내 대응 행동</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {extras.rule3}
                </p>
              </div>
            </div>
          </div>

          {/* 2. 💬 업그레이드된 뉴닉 톤 캐릭터 멘탈 케어 팁 말풍선 카드 */}
          <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${
            isDark
              ? 'bg-[#181c19] border-white/5 shadow-xl'
              : 'bg-white border-slate-100 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{extras.characterEmoji}</span>
                <div>
                  <h4 className={`text-xs font-black tracking-tight ${isDark ? 'text-[#3eb489]' : 'text-[#2d966e]'}`}>
                    [{extras.characterName}]의 위기 대응 멘탈 수칙
                  </h4>
                  <p className={`text-[10px] ${isDark ? 'text-[#3eb489]/70' : 'text-[#2d966e]/70'}`}>
                    💬 캐릭터가 직접 알려주는 뉴닉 가이드
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${extras.badgeBg}`}>
                멘탈 수칙
              </span>
            </div>

            {/* 대화 말풍선 시각화 */}
            <div className="space-y-2 text-xs relative">
              {/* 마음가짐 */}
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-white/90 border-emerald-100 text-slate-800 shadow-sm'
              }`}>
                <div className="text-[10px] font-black text-amber-400 mb-0.5 flex items-center gap-1">
                  <span>🧠 1. 마음가짐</span>
                </div>
                <p className="leading-relaxed font-medium">
                  {`"${extras.mentalMindset}"`}
                </p>
              </div>

              {/* 행동지침 */}
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-white/90 border-emerald-100 text-slate-800 shadow-sm'
              }`}>
                <div className="text-[10px] font-black text-emerald-400 mb-0.5 flex items-center gap-1">
                  <span>⚡ 2. 행동 수칙</span>
                </div>
                <p className="leading-relaxed font-medium">
                  {`"${extras.mentalAction}"`}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
