/* =====================================================================
   망고카 국가별 수입 마진 — 근거 기록 + 계산식
   - params: 계산에 들어가는 값. report = 원본 리포트가 쓰는 값(data.json path),
             base = 근거 확인 후 허브가 기본으로 쓰는 값 (없으면 report 값)
   - status: 확인 | 부분확인 | 추정 | 불일치
   - vtype : 공식 | 업체공개가 | 근접대체값 | 리포트값
   - 최신화: 값을 바꾸면 checkedAt 도 바꿈. 30일 지나면 허브에 「재확인 필요」.
   ===================================================================== */
const REG_UPDATED = "2026-11-26";
const STALE_DAYS = 30;

const S = { // 자주 쓰는 출처
  twCustomsUsed: {title: "財政部關務署 · 進口舊汽車課稅說明", url: "https://web.customs.gov.tw/singlehtml/1207?cntId=cus1_93223_1207", date: "2026-11-25 갱신"},
  twFee: {title: "財政部關務署 · 進口貨物應繳之稅費", url: "https://web.customs.gov.tw/singlehtml/1207?cntId=cus1_93288_1207", date: "2026-11-25 갱신"},
  twCtAct: {title: "貨物稅條例 §12 · §18", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=G0340076", date: "2025-12-30 개정"},
  twEvAct: {title: "貨物稅條例 §12-3 개정 (총통부공보)", url: "https://www.president.gov.tw/File/Doc/65f72365-747f-4cf5-ad13-9beb1fca9a94", date: "2025-12-30 공포"},
  twFx: {title: "中央社 · 新台幣收33.126元", url: "https://www.cna.com.tw/news/afe/202611250192.aspx", date: "2026-11-25"},
  twCustomsAct: {title: "關稅法施行細則", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=G0350002", date: "2024-12-23 개정"},
  deZoll: {title: "Zoll · Beispiele Einfuhrabgabensätze (Pkw 10 %)", url: "https://www.zoll.de/SharedDocs/Boxen/DE/Fragen/0082_beispiele_zollsaetze.html", date: "2026-11-26 열람"},
  deFta: {title: "Zoll WuP · Länderinformationen KR", url: "https://wup.zoll.de/wup_online/laenderinformationen.php?landinfo=KR", date: "2026-11-23"},
  deUzk: {title: "Art. 71 UZK (VO (EU) 952/2013)", url: "https://lxgesetze.de/uzk/71", date: "현행"},
  deEcb: {title: "ECB euro reference rates", url: "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", date: "2026-11-25"},
  deUstg: {title: "§15 UStG", url: "https://www.gesetze-im-internet.de/ustg_1980/__15.html", date: "현행"},
  deTuev: {title: "TÜV NORD · Import-Fahrzeuge Einzelgenehmigung", url: "https://www.tuev-nord.de/de/dienstleistungen/pruefung-und-gutachten/ifm/import-fahrzeuge-einzelgenehmigung/", date: "2026-11-26 열람"},
  kgEtt: {title: "ЕТТ ЕАЭС 87류 PDF (22.01.2026판)", url: "https://eec.eaeunion.org/comission/department/catr/ett/ru.2022/ru.87_2022_22.01.2026.pdf", date: "2026-01-22"},
  kgEvNews: {title: "ЕЭК · 전기차 관세 혜택 22.01.2026 시행", url: "https://eec.eaeunion.org/news/tarifnaya-lgota-na-vvoz-elektromobiley-v-armeniyu-belarus-i-kyrgyzstan-zarabotaet-s-22-yanvarya-2026/", date: "2026-01"},
  kgTax: {title: "Налоговый кодекс КР ст.297, 307, 310 (사본)", url: "https://prg.kz/m/amp/document/31756556/18/3060000", date: "2026-08-06판"},
  kgFee: {title: "economist.kg · 세관(ГТС) 답변", url: "https://economist.kg/transport/2025/04/03/v-kyrghyzstanie-podorozhala-rastamozhka-avtomobiliei-otviet-tamozhiennoi-sluzhby.md", date: "2025-04-03"},
  kgNbkr: {title: "НБКР daily.xml", url: "https://www.nbkr.kg/XML/daily.xml", date: "2026-11-26"},
  kgEncar: {title: "encar.kg · 배송·통관 안내", url: "https://encar.kg/", date: "2026-11-26 열람"},
  kgReg: {title: "economist.kg · ГЦРТС 요금표", url: "https://economist.kg/transport/2025/12/06/rieghistratsiia-avto-vydacha-prav-ekzamieny-ghosnomiera-pieriechien-tarifov-gtsrts/", date: "2025-12-06"},
  krMalso: {title: "동대문구청 · 자동차 말소등록 안내 (등록면허세 15,000원 + 증지 1,000원)", url: "https://www.ddm.go.kr/www/contents.do?key=45", date: "2026-11-26 열람"},
  lmn: {title: "LMN Auto · Auction to Port Cost Breakdown", url: "https://news.lmnauto.com/auction-to-port-cost-breakdown", date: "2026-03-10"},
  shShip: {title: "SH Global · Shipping Used Car from Korea: Costs & Timeline", url: "https://shglobalauto.com/blog/shipping-used-car-from-korea", date: "2026-04-03"},
  shRoro: {title: "SH Global · Korean Used Car RoRo Shipping Guide", url: "https://shglobalauto.com/blog/korean-used-car-roro-shipping-guide", date: "2026-04-26"},
  shCost: {title: "SH Global · Korean Used Car Import Cost Breakdown", url: "https://shglobalauto.com/blog/korean-used-car-import-cost-guide", date: "2026-04-09"},
  fwTw: {title: "FW Freight · Korea → Taiwan 해상운임 (20ft US$406 / 40ft US$605)", url: "https://fwfreight.com/freight-shipping/from-south-korea-to-taiwan/", date: "날짜 표기 없음"},
  vscc: {title: "車安中心 VSCC · 安全審驗 收費標準 (進口舊車 NT$3,225 등)", url: "https://www.vscc.org.tw/File/Download/ac9127e5-26fa-48c0-96f4-8f2555977382?FileName=%E8%BB%8A%E8%BC%9B%E5%9E%8B%E5%BC%8F%E5%AE%89%E5%85%A8%E5%AF%A9%E9%A9%97%E5%8F%8A%E6%AA%A2%E6%B8%AC%E6%A9%9F%E6%A7%8B%E8%AA%8D%E5%8F%AF%E6%94%B6%E8%B2%BB%E6%A8%99%E6%BA%96.pdf", date: "2025-01-01"},
  car2tw: {title: "car2tw · 進口車 車測安審 費用 소개", url: "https://www.car2tw.com/test/safty-inspection.html", date: "2021"},
  twPlate: {title: "公路證照及監理規費 費額表 (번호판 600 · 면허 200 · 검사 450)", url: "https://law.moj.gov.tw/LawClass/LawGetFile.ashx?FileId=0000418828&lan=C", date: "2026-05-29"},
  onePub: {title: "ONE · Asia to North Europe 컨테이너 공시운임", url: "https://cms-resources-eua.one-line.com/sites/eua/files/tariff/2026-01/Asia%20to%20Europe%20Template%20%28ONE%20Publication%29.pdf", date: "2026-01-01 시행"},
  wcsPort: {title: "West Coast Shipping · Hafengebühren Bremerhaven (항만 €600–650, 내륙 €455–680)", url: "https://www.wcshipping.com/de/blog/import-duties-cars-germany-tax-guide", date: "2026-01-30"},
  gebost: {title: "GebOSt Anlage (등록 €30 · §21 €39.50 · 배출검사 €23.70–109.80)", url: "https://www.gesetze-im-internet.de/stgebo_2011/anlage.html", date: "2026-11-26 열람"},
  motorDe: {title: "motor.com.de · Auto-Import Ratgeber (TÜV Einzelabnahme €300–1,500)", url: "https://motor.com.de/ratgeber/auto-import", date: "2026"},
  emsKg: {title: "EMS Auto · 한국→키르기스 배송 (예시 운송 166,000솜 ≈ $1,898)", url: "https://emsauto.kg/", date: "날짜 표기 없음"},
  shKg: {title: "SH Global · Kyrgyzstan Import Guide (운송 $2,000–2,600 · 브로커 $150–300)", url: "https://shglobalauto.com/blog/korean-used-cars-kyrgyzstan-import-guide", date: "2026-04-10"},
  hanam: {title: "하남시 · 자동차 말소등록 안내 (16,000원)", url: "https://www.hanam.go.kr/www/contents.do?key=5203", date: "2026-09-18"},
  kgCv: {title: "ТК ЕАЭС ст.40", url: "https://www.alta.ru/codex-2018/R1/GL5/", date: "현행"}
};

/* ------------------------------------------------------------------ */
const COUNTRIES = {

/* ============================== 대만 ============================== */
taiwan: {
  iso: "158", ko: "대만", en: "Taiwan",
  url: "https://hyunwook-in.github.io/mangocar-taiwan/",
  data: "https://hyunwook-in.github.io/mangocar-taiwan/data.json",
  market: "8891", listingsKey: "twListings", checkedAt: "2026-11-26",
  // 리포트 화면(원본 페이지)에 적용값을 넣을 때: 리포트 data.json 의 cost 칸으로 옮김
  toReportCost: (E, cost) => Object.assign({}, cost, {twd: E.twd, krSide: E.krSide, sea: E.sea, ins: E.ins, duty: E.duty, bt: E.bt, fee: E.fee,
    lux: E.lux, luxLow: E.luxLow, luxHigh: E.luxHigh, evBase: E.evBase, insp: E.insp, local: E.local}),
  notInReport: ["ct25", "ct30", "evRate"],
  cur: "NT$", calcCur: "usd", toDisp: (v, P) => v * P.twd,
  rowMap: r => ({usd: r[5], market: r[6], year: r[2], fuel: r[3], cc: r[9], sc: 0}),
  sample: {usd: 25000, cc: 1991, year: 2022, fuel: "Petrol", sc: 0, market: 1600000},
  marketInDisp: true,
  params: [
    {id: "twd", label: "환율 US$1 = NT$", unit: "rate", path: "cost.twd", base: 33.126, status: "부분확인", vtype: "공식",
     sources: [S.twFx], note: "11/25 타이베이 외환시장 종가 33.126. 리포트 32.7은 약 1% 낮음. 실제 과세는 관무서 열흘 고시 환율."},
    {id: "krSide", label: "한국 내 비용 (내륙·수출통관·말소)", unit: "usd", path: "cost.krSide", status: "부분확인", vtype: "업체공개가",
     sources: [S.krMalso, S.lmn, S.shShip], note: "말소 공과금 16,000원(공식) + 탁송·통관·항만·서류 업체 공개가 합계 US$300–700. 리포트 US$700은 범위 상단이라 그대로 둠."},
    {id: "sea", label: "해상운임 한국→대만", unit: "usd", path: "cost.sea", status: "부분확인", vtype: "근접대체값",
     sources: [S.shShip, S.fwTw], note: "한국→대만 RoRo 공시가 없음. 비슷한 단거리 노선 한국→블라디보스토크 RoRo US$800–1,200 (SH Global). 컨테이너는 40ft US$605에 4대 + 적입·항만비로 대당 약 US$350–600. 리포트 US$800은 범위 안이라 그대로 둠."},
    {id: "ins", label: "해상보험 (차값 대비)", unit: "pct", path: "cost.ins", status: "부분확인", vtype: "업체공개가",
     sources: [S.lmn, S.shShip, S.twCustomsAct], note: "업체 공개 요율 FOB 1.2% (LMN), All-Risk 1.5–2% (SH Global). 법정 기본 요율은 없음. 리포트 1.5%는 범위 안."},
    {id: "duty", label: "수입관세 (HS 8703)", unit: "pct", path: "cost.duty", status: "확인", vtype: "공식",
     sources: [S.twCustomsUsed], note: "WTO 회원국산 승용차 신차·중고 모두 17.5%. 과세가격 = 차값+운임+보험."},
    {id: "ct25", label: "화물세 2,000cc 이하", unit: "pct", report: 0.25, status: "확인", vtype: "공식", sources: [S.twCtAct], note: "과세표준 = 과세가격 + 관세."},
    {id: "ct30", label: "화물세 2,001cc 이상", unit: "pct", report: 0.30, status: "확인", vtype: "공식", sources: [S.twCtAct], note: "과세표준 = 과세가격 + 관세."},
    {id: "evRate", label: "전기차 화물세율", unit: "pct", report: 0.25, base: 0.125, status: "불일치", vtype: "공식",
     sources: [S.twEvAct, {title: "財政部 해석령 (2027-01-01 시행)", url: "https://law-out.mof.gov.tw/LawContent.aspx?id=GL011753", date: "2026-08-18"}],
     note: "전기차는 세율 절반 (12.5%, 고출력은 15%). 리포트는 25%로 계산해 전기차 세금이 크게 잡힘. 허브는 12.5% 적용."},
    {id: "evBase", label: "전기차 면세 한도 (과세가격)", unit: "ntd", path: "cost.evBase", status: "확인", vtype: "공식",
     sources: [S.twEvAct], note: "과세가격 140만까지 화물세 면제, 2030년 말까지."},
    {id: "bt", label: "영업세", unit: "pct", path: "cost.bt", status: "확인", vtype: "공식", sources: [S.twCustomsUsed], note: "(과세가격+관세+화물세) × 5%. 매입세액 공제 가능하지만 원가에 넣음."},
    {id: "fee", label: "무역추진서비스비", unit: "pct", path: "cost.fee", status: "확인", vtype: "공식", sources: [S.twFee], note: "과세가격 × 0.04%."},
    {id: "lux", label: "사치세율", unit: "pct", path: "cost.lux", status: "확인", vtype: "공식", sources: [S.twCustomsUsed], note: "(과세가격+관세+화물세+영업세) × 10%."},
    {id: "luxLow", label: "사치세 기준 2,000cc 이하 (과세가격)", unit: "ntd", path: "cost.luxLow", status: "확인", vtype: "공식", sources: [S.twCustomsUsed], note: "세금 포함 300만 기준을 과세가격으로 되돌린 값."},
    {id: "luxHigh", label: "사치세 기준 2,001cc 이상 (과세가격)", unit: "ntd", path: "cost.luxHigh", status: "확인", vtype: "공식", sources: [S.twCustomsUsed], note: "300만 ÷ 1.175 ÷ 1.30 ÷ 1.05."},
    {id: "insp", label: "차량 검사 (안전·배출·연비·소음)", unit: "ntd", path: "cost.insp", status: "추정", vtype: "리포트값",
     sources: [S.vscc, S.car2tw, S.twCustomsUsed], note: "공식 요금표로 확인되는 건 VSCC 심사 행정비 약 NT$4,300–6,400뿐. 시험소(ARTC) 검사비는 공개 자료 없음, 업체는 「30여만까지」라고 씀. 리포트 NT$100,000은 근거 없는 값. 2026-11-26 견적 받기 전까지 이 값으로 두기로 함."},
    {id: "local", label: "대만 통관대행·항만·내륙·등록", unit: "usd", path: "cost.local", status: "부분확인", vtype: "근접대체값",
     sources: [S.twPlate, S.shShip], note: "번호판·면허·검사 규비 NT$1,250 (공식) + 도착항 처리비 US$150–400 (업체 일반 단가). 관세사 수수료·내륙운송은 모름. 리포트 US$800 그대로 둠."}
  ],
  nodes: [
    {stage: 0, id: "car", label: "한국 차값", rule: "망고카 매입가", params: []},
    {stage: 0, id: "krSide", label: "한국 내 비용", rule: "내륙운송 · 수출통관 · 말소", params: ["krSide"]},
    {stage: 1, id: "sea", label: "해상운임", rule: "부산·인천 → 대만", params: ["sea"]},
    {stage: 1, id: "ins", label: "보험", rule: "차값 × 요율", params: ["ins"]},
    {stage: 2, id: "duty", label: "수입관세", rule: "과세가격(CIF) × 17.5%", params: ["duty", "twd"]},
    {stage: 2, id: "ct", label: "화물세", rule: "(CIF+관세) × 25% / 30%, 전기차 따로", params: ["ct25", "ct30", "evRate", "evBase"]},
    {stage: 2, id: "vat", label: "영업세 + 추진비", rule: "5% + 0.04%", params: ["bt", "fee"]},
    {stage: 2, id: "lux", label: "사치세", rule: "기준 넘으면 10%", params: ["lux", "luxLow", "luxHigh"]},
    {stage: 3, id: "insp", label: "차량 검사", rule: "ARTC / VSCC", params: ["insp"]},
    {stage: 3, id: "local", label: "통관·항만·등록", rule: "현지 관세사 · 監理", params: ["local"]}
  ],
  compute(c, P) {
    const ship = P.krSide + P.sea + c.usd * P.ins, cif = c.usd + ship, duty = cif * P.duty;
    const ev = c.fuel === "Electric", rate = ev ? P.evRate : (c.cc > 2000 ? P.ct30 : P.ct25);
    const ct = ev ? Math.max(0, (cif + duty) * rate - P.evBase / P.twd * rate) : (cif + duty) * rate;
    const bt = (cif + duty + ct) * P.bt, fee = cif * P.fee, th = (!ev && c.cc > 2000) ? P.luxHigh : P.luxLow;
    const lux = cif * P.twd >= th ? (cif + duty + ct + bt) * P.lux : 0;
    const a = {car: c.usd, krSide: P.krSide, sea: P.sea, ins: c.usd * P.ins, duty, ct, vat: bt + fee, lux, insp: P.insp / P.twd, local: P.local};
    a.final = Object.values(a).reduce((s, v) => s + v, 0);
    return a;
  }
},

/* ============================== 독일 ============================== */
germany: {
  iso: "276", ko: "독일", en: "Germany",
  url: "https://hyunwook-in.github.io/mangocar-germany/",
  data: "https://hyunwook-in.github.io/mangocar-germany/data.json",
  market: "mobile.de", listingsKey: "deListings", checkedAt: "2026-11-26",
  toReportCost: (E, cost) => Object.assign({}, cost, {usdEur: E.usdEur, ship: E.ship + E.krSide, duty: E.duty, trans: E.port + E.inland + E.tuev + E.reg}),
  notInReport: [],
  cur: "€", calcCur: "eur", toDisp: v => v,
  rowMap: r => ({usd: r[5], market: r[6], year: r[2], fuel: r[3], cc: 0, sc: 0}),
  sample: {usd: 20000, cc: 1598, year: 2022, fuel: "Petrol", sc: 0, market: 24000},
  marketInDisp: true,
  params: [
    {id: "usdEur", label: "환율 US$1 = €", unit: "rate", path: "cost.usdEur", base: 0.9145, status: "부분확인", vtype: "공식",
     sources: [S.deEcb], note: "ECB 11/25 기준 0.9145. 리포트 0.92는 약 0.6% 높음."},
    {id: "krSide", label: "한국 내 비용 (내륙·수출통관·말소)", unit: "eur", report: 0, base: 192, status: "부분확인", vtype: "업체공개가",
     sources: [S.shRoro, S.hanam], note: "리포트에는 없는 항목. 업체 공개가 탁송 US$80–250 + 항만 80–150 + 서류 50–80 = US$210–480 (€192–439). 리포트 0이 범위 밖이라 하단 €192 적용."},
    {id: "ship", label: "해상운임 한국→독일", unit: "eur", path: "cost.ship", status: "부분확인", vtype: "근접대체값",
     sources: [S.shRoro, S.onePub], note: "평택→브레머하펜 RoRo 대당 공시가 없음. 한국발 RoRo 공개 범위 €690–1,830, 컨테이너 공시운임으로는 대당 €2,440–3,250. 리포트 €2,100은 두 값 사이라 그대로 둠."},
    {id: "duty", label: "관세율 (HS 8703)", unit: "pct", path: "cost.duty", status: "부분확인", vtype: "공식",
     sources: [S.deZoll, S.deFta, S.deUzk], note: "원산지 증명 없을 때 10%. 한국산 + 원산지신고(인증수출자)면 한-EU FTA 0% 가능. 과세가격은 EU 반입지까지(CIF)."},
    {id: "port", label: "독일 항만 처리 (통관대행 별도)", unit: "eur", report: 0, base: 600, status: "부분확인", vtype: "근접대체값",
     sources: [S.wcsPort], note: "미국→브레머하펜 수입업체 공개 항만비 €600–650 (같은 항구라 비교 가능). 통관대행 수수료는 모름. 리포트는 운송+TÜV €1,500 한 덩어리라 나눠 넣음."},
    {id: "inland", label: "독일 내륙운송", unit: "eur", report: 0, base: 455, status: "부분확인", vtype: "근접대체값",
     sources: [S.wcsPort], note: "브레머하펜 → 쾰른 €455 / 베를린 €555 / 뮌헨 €680 (업체 공개가). 가장 가까운 쾰른 값 적용."},
    {id: "tuev", label: "TÜV §21 감정 + 승인 + 배출검사", unit: "eur", path: "cost.trans", base: 415, status: "부분확인", vtype: "공식",
     sources: [S.gebost, S.motorDe, S.deTuev], note: "공식 수수료 §21 €39.50 + 배출검사 €23.70–109.80, 감정(Vollgutachten) €300–1,500 (비공식 가이드). 리포트 €1,500(운송+TÜV 합계)에서 항만·내륙·등록을 뺀 €415 적용 → 네 항목 합계는 리포트와 같음. EU 사양 개조가 필요하면 크게 늘어남."},
    {id: "reg", label: "등록 (Zulassung) 수수료", unit: "eur", report: 0, base: 30, status: "확인", vtype: "공식",
     sources: [S.gebost], note: "GebOSt 221.1 등록 €30. 번호판 제작비 별도."}
  ],
  nodes: [
    {stage: 0, id: "car", label: "한국 차값", rule: "망고카 매입가 × 환율", params: ["usdEur"]},
    {stage: 0, id: "krSide", label: "한국 내 비용", rule: "내륙운송 · 수출통관 · 말소", params: ["krSide"]},
    {stage: 1, id: "ship", label: "해상운임", rule: "한국 → 브레머하펜", params: ["ship"]},
    {stage: 2, id: "duty", label: "관세", rule: "(차값+운임) × 10% · FTA면 0%", params: ["duty"]},
    {stage: 2, id: "vatnote", label: "수입부가세 19%", rule: "과세사업자 공제 → 원가 제외", params: [], info: true,
     sources: [S.deUstg], status: "확인", note: "통관 때 먼저 내고 공제받음. 판매가에 19%가 붙을 수 있음 (세무 확인 필요)."},
    {stage: 3, id: "port", label: "통관대행 · 항만", rule: "Verzollung · 터미널", params: ["port"]},
    {stage: 3, id: "inland", label: "내륙운송", rule: "항구 → 딜러", params: ["inland"]},
    {stage: 3, id: "tuev", label: "TÜV 승인·검사", rule: "§21 StVZO", params: ["tuev"]},
    {stage: 3, id: "reg", label: "등록", rule: "Zulassung (GebOSt)", params: ["reg"]}
  ],
  compute(c, P) {
    const eur = c.usd * P.usdEur, duty = (eur + P.krSide + P.ship) * P.duty;
    const a = {car: eur, krSide: P.krSide, ship: P.ship, duty, vatnote: 0, port: P.port, inland: P.inland, tuev: P.tuev, reg: P.reg};
    a.final = Object.values(a).reduce((s, v) => s + v, 0);
    return a;
  }
},

/* =========================== 키르기스스탄 =========================== */
kyrgyzstan: {
  iso: "417", ko: "키르기스스탄", en: "Kyrgyzstan",
  url: "https://hyunwook-in.github.io/mangocar-kyrgyzstan/",
  data: "https://hyunwook-in.github.io/mangocar-kyrgyzstan/data.json",
  market: "mashina.kg", listingsKey: "kgListings", checkedAt: "2026-11-26",
  toReportCost: (E, cost) => Object.assign({}, cost, {eurUsd: E.eurUsd, ship: [E.shipS + E.krSide, E.shipM + E.krSide, E.shipL + E.krSide],
    broker: E.broker, reg: E.reg, vat: E.vat, fee: E.fee}),
  notInReport: ["evDuty", "evVatAge"],
  cur: "$", calcCur: "usd", toDisp: v => v,
  rowMap: r => ({usd: r[5], market: r[6], year: r[2], fuel: r[3], cc: r[9], sc: r[10]}),
  sample: {usd: 15000, cc: 2000, year: 2021, fuel: "Petrol", sc: 2, market: 24000},
  marketInDisp: true,
  bodies: ["소형차", "세단", "SUV · 밴"],
  params: [
    {id: "eurUsd", label: "환율 €1 = US$", unit: "rate", path: "cost.eurUsd", base: 1.0944, status: "부분확인", vtype: "공식",
     sources: [S.kgNbkr], note: "NBKR 11/26 교차환율 1.0944."},
    {id: "krSide", label: "한국 내 비용 (내륙·수출통관·말소)", unit: "usd", report: 0, base: 310, status: "부분확인", vtype: "업체공개가",
     sources: [S.shCost, S.hanam], note: "리포트에는 없는 항목. 말소 16,000원(공식) + 탁송·항만·서류 업체 공개가 합계 US$310–700. 리포트 0이 범위 밖이라 하단 US$310 적용. 업체에 따라 FOB 가격에 포함되기도 함."},
    {id: "shipS", label: "운송비 · 소형차", unit: "usd", path: "cost.ship.0", status: "확인", vtype: "업체공개가", sources: [S.kgEncar, S.emsKg, S.shKg], note: "encar.kg 공개가. 다른 업체: EMS Auto 예시 ≈$1,898, SH Global $2,000–2,600 (차종 구분 없음). 중국 페리 → 철도 → 트레일러, 약 20일."},
    {id: "shipM", label: "운송비 · 세단", unit: "usd", path: "cost.ship.1", status: "확인", vtype: "업체공개가", sources: [S.kgEncar, S.emsKg, S.shKg], note: "encar.kg 공개가. 다른 업체 범위 $1,900–2,600 안."},
    {id: "shipL", label: "운송비 · SUV·밴", unit: "usd", path: "cost.ship.2", status: "확인", vtype: "업체공개가", sources: [S.kgEncar, S.emsKg, S.shKg], note: "encar.kg 공개가. 다른 업체 범위 $1,900–2,600 안."},
    {id: "evDuty", label: "전기차 관세 (쿼터 소진)", unit: "pct", report: 0.15, status: "부분확인", vtype: "공식", sources: [S.kgEtt, S.kgEvNews], note: "15%. 2026 무관세 쿼터는 9월 소진 보도."},
    {id: "vat", label: "부가세", unit: "pct", path: "cost.vat", status: "부분확인", vtype: "공식", sources: [S.kgTax], note: "(과세가격 + 관세) × 12%."},
    {id: "evVatAge", label: "전기차 부가세 면제 연식 (년 이하)", unit: "yr", report: 99, base: 5, status: "불일치", vtype: "공식",
     sources: [S.kgTax], note: "세법 297조: 5년 이하 순수 전기차만 면제. 리포트는 전기차 전부 면제(99로 표시). 허브는 5년 적용."},
    {id: "fee", label: "세관 수수료", unit: "pct", path: "cost.fee", status: "부분확인", vtype: "공식", sources: [S.kgFee], note: "과세가격 × 0.4%."},
    {id: "broker", label: "통관 브로커", unit: "usd", path: "cost.broker", status: "부분확인", vtype: "업체공개가",
     sources: [S.kgEncar, S.shKg, S.emsKg], note: "encar.kg 7,000솜 ≈ $80, SH Global $150–300, EMS Auto는 무료(대신 서비스료 26,000솜). 업체 구조에 따라 $0–300. 리포트 $80 범위 안."},
    {id: "reg", label: "등록 · 번호판 · 검사", unit: "usd", path: "cost.reg", base: 22, status: "부분확인", vtype: "공식",
     sources: [S.kgReg], note: "ГЦРТС 요금표 검사 400 + DB 등록 400 + 번호판 300 + 제작 450 + 소유권 350 = 1,900솜 ≈ $22. 리포트 $150이 범위 밖이라 $22 적용. 첫 등록 때 시장가 비례 등록 сбор(2020년 보도 5%)가 따로 있을 수 있음 — 현재 요율 모름."}
  ],
  nodes: [
    {stage: 0, id: "car", label: "한국 차값", rule: "망고카 매입가", params: []},
    {stage: 0, id: "krSide", label: "한국 내 비용", rule: "내륙운송 · 수출통관 · 말소", params: ["krSide"]},
    {stage: 1, id: "ship", label: "운송비", rule: "한국 → 중국 → 비슈케크 (차종별)", params: ["shipS", "shipM", "shipL"]},
    {stage: 2, id: "duty", label: "관세 (EAEU)", rule: "3년 미만 15% · 3~7년 20%(최소 €/cm³) · 7년 초과 €/cm³", params: ["eurUsd", "evDuty"],
     sources: [S.kgEtt], status: "확인", note: "연식·배기량별 세율표는 EAEU 공식표와 전부 일치 (고정 규칙)."},
    {stage: 2, id: "vat", label: "부가세 + 세관 수수료", rule: "(과세가격+관세) × 12% + 0.4%", params: ["vat", "evVatAge", "fee"]},
    {stage: 3, id: "broker", label: "통관 브로커", rule: "비슈케크 세관", params: ["broker"]},
    {stage: 3, id: "reg", label: "등록 · 번호판 · 검사", rule: "ГУ «Унаа» / ГЦРТС", params: ["reg"]}
  ],
  compute(c, P) {
    const ship = [P.shipS, P.shipM, P.shipL][c.sc] ?? P.shipM, value = c.usd + P.krSide + ship;
    const dz = c.fuel === "Diesel";
    const perCc = (cc, diesel, over7) => diesel
      ? (over7 ? (cc <= 1500 ? 1.5 : cc <= 2500 ? 2.2 : 3.2) : (cc <= 1500 ? .32 : cc <= 2500 ? .40 : .80))
      : (over7 ? (cc <= 1000 ? 1.4 : cc <= 1500 ? 1.5 : cc <= 1800 ? 1.6 : cc <= 3000 ? 2.2 : 3.2) : (cc <= 1000 ? .36 : cc <= 1500 ? .40 : cc <= 1800 ? .36 : cc <= 3000 ? .44 : .80));
    let duty;
    if (c.fuel === "Electric") duty = value * P.evDuty;
    else if (c.year >= 2024) duty = value * ((!dz && c.cc > 2800) ? .125 : .15);
    else if (c.year >= 2020) duty = Math.max(value * .2, perCc(c.cc, dz, false) * c.cc * P.eurUsd);
    else duty = perCc(c.cc, dz, true) * c.cc * P.eurUsd;
    const vatFree = c.fuel === "Electric" && (2026 - c.year) <= P.evVatAge;
    const vat = value * P.fee + (vatFree ? 0 : (value + duty) * P.vat);
    const a = {car: c.usd, krSide: P.krSide, ship, duty, vat, broker: P.broker, reg: P.reg};
    a.final = Object.values(a).reduce((s, v) => s + v, 0);
    return a;
  }
}
};

const STAGES = ["① 한국", "② 운송", "③ 통관 · 세금", "④ 현지 비용"];
const GENERIC_NODES = [
  {stage: 0, label: "한국 차값", rule: "망고카 매입가"}, {stage: 0, label: "한국 내 비용", rule: "내륙운송 · 수출통관 · 말소"},
  {stage: 1, label: "해상·육상 운임", rule: "한국 → 현지 항구"}, {stage: 1, label: "보험", rule: "차값 × 요율"},
  {stage: 2, label: "관세", rule: "그 나라 관세율표 (HS 8703)"}, {stage: 2, label: "부가세 · 소비세 · 특별세", rule: "그 나라 세법"},
  {stage: 3, label: "통관대행 · 항만", rule: "현지 관세사 견적"}, {stage: 3, label: "검사 · 인증 · 등록", rule: "현지 검사기관 · 등록청"}
];
