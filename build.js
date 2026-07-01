// =====================================================================
// 간다GO 경기북부 출장마사지 · 정적 사이트 생성기
// 데이터(JSON) → dist/ 정적 HTML. 스키마·내부링크·푸터 CTA 포함.
// 실행: node build.js
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data", "gyeonggi-north");
const OUT = path.join(__dirname, "dist");
const BASE = "/gyeonggi-north/";
const ASSETS = BASE + "assets/";

const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
const site = load("site.json");
const cities = load("cities.json");
const regions = load("regions.json");
const lifeAreas = load("life-areas.json");
const stations = load("stations.json");
const outerAreas = load("outer-areas.json");
const useCases = load("use-cases.json");
const checks = load("checks.json");
const policies = load("policies.json");
const adminDongs = load("admin-dongs.json");

const cityBy = Object.fromEntries(cities.map((c) => [c.slug, c]));
const lifeBy = Object.fromEntries(lifeAreas.map((l) => [l.slug, l]));
const stationBy = Object.fromEntries(stations.map((s) => [s.slug, s]));
const regionBy = Object.fromEntries(regions.map((r) => [r.slug, r]));

const dongsByCity = {};
const dongsByDistrict = {};
adminDongs.forEach((d) => {
  (dongsByCity[d.city] = dongsByCity[d.city] || []).push(d);
  if (d.district) (dongsByDistrict[d.district] = dongsByDistrict[d.district] || []).push(d);
});
const dongUrl = (d) => (d.district ? `${BASE}${d.city}/${d.district}/${d.slug}/` : `${BASE}${d.city}/${d.slug}/`);

const LAST_MOD = "2026-07-01"; // build.js는 Date.now() 미사용 — 배포 시 갱신

// ---- helpers --------------------------------------------------------
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clampDesc = (s) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length <= 80 ? t : t.slice(0, 79).trimEnd() + "…"; // 디스크립션 80자 이내
};
const abs = (p) => site.baseUrl + p;
const registry = []; // {url, priority, changefreq, noindex}

function writePage(urlPath, html, { priority = 0.6, changefreq = "monthly", noindex = false } = {}) {
  const dir = path.join(OUT, urlPath.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  registry.push({ url: urlPath, priority, changefreq, noindex });
}

// ---- shared chrome --------------------------------------------------
const cityLinks = () => cities.map((c) => `<li><a href="${BASE}${c.slug}/">${c.name}</a></li>`).join("");

function header(current = "") {
  const nav = [
    ["", "경기북부 홈"],
    ["area/seoul-adjacent/", "권역 안내"],
    ["goyang/", "시군 안내"],
    ["life/ilsan-kintex/", "생활권"],
    ["station/uijeongbu-station/", "지하철역"],
    ["outer/pocheon-songu/", "외곽 이동"],
    ["use/home/", "이용 장소"],
    ["check/address/", "예약 전 확인"],
    ["policy/contact/", "문의하기"],
  ];
  return `<header class="site-header">
  <div class="container">
    <a class="brand" href="${BASE}"><span class="brand-mark">G</span>간다<span class="brand-go">GO</span></a>
    <a class="header-phone" href="${site.phoneHref}" aria-label="전화 예약 ${site.phone}">📞 ${site.phone}</a>
  </div>
  <div class="container">
    <nav class="nav" aria-label="주요 메뉴"><ul>
      ${nav.map(([h, t]) => `<li><a href="${BASE}${h}"${current === h ? ' aria-current="page"' : ""}>${t}</a></li>`).join("\n      ")}
    </ul></nav>
  </div>
</header>`;
}

const tgIcon =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.94 4.6 18.9 19c-.23 1-.83 1.26-1.68.78l-4.65-3.43-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.74 8.63-7.8c.38-.33-.08-.52-.58-.19L7.44 13.2l-4.6-1.44c-1-.31-1.02-1 .21-1.48l17.98-6.93c.83-.31 1.56.2 1.29 1.25z"/></svg>';

function footer() {
  const yr = "2026";
  const col = (title, items) =>
    `<div><h4>${title}</h4><ul>${items.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>`;
  return `<footer class="site-footer">
  <div class="footer-cta">
    <div class="container">
      <h2>사이트 제작·제휴 문의</h2>
      <p>간다GO 스타일의 지역 안내 사이트 제작과 제휴를 텔레그램으로 상담하세요.</p>
      <div class="cta-row">
        <a class="btn btn-telegram" href="${site.telegram.website}" target="_blank" rel="noopener nofollow">${tgIcon} 웹사이트 제작문의</a>
        <a class="btn btn-telegram" href="${site.telegram.partner}" target="_blank" rel="noopener nofollow">${tgIcon} 제휴문의</a>
      </div>
    </div>
  </div>
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="${BASE}" style="color:#fff"><span class="brand-mark">G</span>간다<span class="brand-go">GO</span></a>
        <p class="footer-brand-desc">${esc(site.defaultDescription)}</p>
        <p class="footer-brand-desc"><strong style="color:#fff">전화 예약</strong> · <a href="${site.phoneHref}" style="color:var(--c-orange-300)">${site.phone}</a></p>
      </div>
      ${col("지역 안내", cities.slice(0, 6).map((c) => [`${BASE}${c.slug}/`, c.name]))}
      ${col("바로가기", [
        [`${BASE}life/ilsan-kintex/`, "생활권 안내"],
        [`${BASE}station/uijeongbu-station/`, "지하철역 안내"],
        [`${BASE}outer/pocheon-songu/`, "외곽 이동 기준"],
        [`${BASE}check/address/`, "예약 전 확인"],
        [`${BASE}policy/contact/`, "문의하기"],
      ])}
    </div>
    <div class="footer-bottom">
      <span>상호 <strong style="color:var(--c-ink-300)">간다GO</strong> · 전화예약 ${site.phone} · © ${yr} 간다GO</span>
      <span>
        <a href="${BASE}policy/privacy/">개인정보 처리방침</a> ·
        <a href="${BASE}policy/service-standard/">불법·선정적 서비스 불가 안내</a> ·
        <a href="${BASE}policy/author/">작성자·검수자</a>
      </span>
    </div>
  </div>
</footer>`;
}

// ---- reusable blocks ------------------------------------------------
function eeat(who, how, why) {
  return `<aside class="eeat">
    <strong>작성자</strong> ${esc(site.author.name)} · <strong>검수</strong> ${esc(site.reviewer.name)}
    <div class="whw">
      <div><strong>Who.</strong> ${esc(who)}</div>
      <div><strong>How.</strong> ${esc(how)}</div>
      <div><strong>Why.</strong> ${esc(why)}</div>
    </div>
  </aside>`;
}

const policyNotice = `<div class="notice"><strong>안내.</strong> 간다GO는 건전한 방문형 관리 서비스의 지역 안내만 제공하며, <a href="${BASE}policy/service-standard/">불법·선정적 서비스는 제공하거나 안내하지 않습니다</a>. 개인정보는 <a href="${BASE}policy/privacy/">개인정보 처리방침</a>에 따라 최소한만 처리합니다.</div>`;

function checklistBlock(items) {
  return `<ul class="checklist">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function linkChips(links) {
  return `<ul class="linklist">${links.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join("")}</ul>`;
}

const DEFAULT_FAQ = [
  ["경기북부 전 지역 방문이 가능한가요?", "실제 방문 주소, 가까운 생활권, 예약 가능 시간, 이동 기준을 확인한 뒤 안내합니다."],
  ["역세권이 많은 지역은 어떻게 찾나요?", "시군 페이지에서 생활권과 역세권을 함께 확인하고, 실제 방문 주소와 건물 출입 방식을 확인하는 것이 좋습니다."],
  ["포천·가평·연천은 추가 확인이 필요한가요?", "외곽 지역은 차량 이동 가능 여부, 예약 가능 시간, 추가 이동비, 숙소 위치를 먼저 확인해야 합니다."],
  ["호텔이나 숙소에서도 이용할 수 있나요?", "숙소 정책과 객실 출입 가능 여부를 먼저 확인해야 합니다."],
  ["오피스텔은 어떤 점을 확인해야 하나요?", "공동현관, 엘리베이터, 관리 규정, 방문 가능 시간대를 확인해야 합니다."],
  ["개인정보는 어떻게 처리하나요?", "예약 확인과 연락에 필요한 최소 정보만 안내하며, 개인정보 처리방침 페이지로 연결합니다."],
  ["불법·선정적 서비스도 가능한가요?", "불법·선정적 서비스는 제공하거나 안내하지 않습니다."],
];

function faqBlock(faq) {
  return `<section class="faq"><h2>자주 묻는 질문</h2>
    ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n    ")}
  </section>`;
}

// ---- schema (JSON-LD) ----------------------------------------------
function organizationNode() {
  return {
    "@type": "Organization",
    "@id": abs(BASE) + "#organization",
    name: site.organization.name,
    url: abs(BASE),
    logo: abs(site.organization.logo),
    areaServed: site.organization.areaServed,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: site.organization.telephone,
      contactType: "reservations",
    },
  };
}

function schemaGraph({ urlPath, title, description, breadcrumb, faq, image }) {
  const graph = [organizationNode()];
  graph.push({
    "@type": "WebPage",
    "@id": abs(urlPath) + "#webpage",
    url: abs(urlPath),
    name: title,
    description,
    inLanguage: "ko-KR",
    isPartOf: { "@id": abs(BASE) + "#organization" },
    dateModified: LAST_MOD,
    author: { "@type": "Person", name: site.author.name },
    ...(image ? { primaryImageOfPage: { "@id": abs(urlPath) + "#primaryimage" } } : {}),
  });
  if (breadcrumb && breadcrumb.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": abs(urlPath) + "#breadcrumb",
      itemListElement: breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: abs(b.url),
      })),
    });
  }
  if (image) {
    graph.push({
      "@type": "ImageObject",
      "@id": abs(urlPath) + "#primaryimage",
      url: abs(image.url),
      caption: image.alt,
    });
  }
  if (faq && faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": abs(urlPath) + "#faq",
      mainEntity: faq.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

// ---- breadcrumb UI --------------------------------------------------
function breadcrumbUI(items) {
  return `<nav class="breadcrumb" aria-label="위치"><ol>
    ${items.map((b) => `<li><a href="${b.url}">${esc(b.name)}</a></li>`).join("")}
  </ol></nav>`;
}

// ---- page shell -----------------------------------------------------
function page({ urlPath, title, description, current, breadcrumb, image, faq, noindex, body, priority, changefreq }) {
  const desc = clampDesc(description);
  const canonical = abs(urlPath);
  const ogImg = abs(image ? image.url : site.ogImage);
  const crumbUI = breadcrumb && breadcrumb.length > 1 ? breadcrumbUI(breadcrumb) : "";
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex,follow">\n' : ""}<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="간다GO">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImg}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="icon" href="${ASSETS}logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="${ASSETS}styles.css">
<script type="application/ld+json">${schemaGraph({ urlPath, title, description: desc, breadcrumb, faq, image })}</script>
</head>
<body>
<a class="skip-link" href="#main">본문 바로가기</a>
${header(current)}
<div class="container">${crumbUI}</div>
<main id="main">
${body}
</main>
${footer()}
</body>
</html>`;
  writePage(urlPath, html, { priority, changefreq, noindex });
}

// ---- content helpers ------------------------------------------------
const nameList = (arr) => arr.join(", ");
const cityLifeChips = (c) => c.lifeAreas.filter((s) => lifeBy[s]).map((s) => [`${BASE}life/${s}/`, lifeBy[s].name]);
const cityStationChips = (c) => c.stations.filter((s) => stationBy[s]).map((s) => [`${BASE}station/${s}/`, stationBy[s].name]);
const adjChips = (c) => c.adjacent.filter((s) => cityBy[s]).map((s) => [`${BASE}${s}/`, cityBy[s].name]);

// =====================================================================
// PAGE BUILDERS
// =====================================================================

// ---- 1) MAIN --------------------------------------------------------
function buildMain() {
  const urlPath = BASE;
  const crumb = [{ name: "홈", url: BASE }];
  const cityCards = cities
    .map(
      (c) => `<article class="card">
      <span class="tag">${cityBy[c.slug].isOuter ? "외곽 이동권" : "생활권"}</span>
      <h3><a href="${BASE}${c.slug}/">${c.name}</a></h3>
      <p>${esc(c.summary)}</p>
    </article>`
    )
    .join("\n    ");

  const lifeCards = lifeAreas
    .map((l) => `<li><a href="${BASE}life/${l.slug}/">${l.name} 생활권 안내</a></li>`)
    .join("");

  const stationByCity = cities
    .filter((c) => c.stations.length)
    .map(
      (c) =>
        `<p><strong>${c.name}:</strong> ${c.stations
          .map((s) => `<a href="${BASE}station/${s}/">${stationBy[s].name}</a>`)
          .join(", ")}</p>`
    )
    .join("\n      ");

  const body = `
<section class="container">
  <div class="hero">
    <h1>경기북부 출장마사지 · 10개 시군 생활권별 지역 안내</h1>
    <p class="lede">고양, 남양주, 파주, 의정부, 양주, 구리, 포천, 동두천, 가평, 연천 주요 생활권과 지하철역·외곽 이동 기준을 안내합니다. 상호 <strong>간다GO</strong> · 전화예약 ${site.phone}.</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="${BASE}goyang/">시군 안내</a>
      <a class="btn btn-ghost" href="${BASE}life/ilsan-kintex/">생활권 보기</a>
      <a class="btn btn-ghost" href="${BASE}station/uijeongbu-station/">지하철역 보기</a>
      <a class="btn btn-ghost" href="${BASE}outer/pocheon-songu/">외곽 이동 기준</a>
      <a class="btn btn-ghost" href="${BASE}check/address/">예약 전 확인</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>경기북부는 시군 이름만으로 판단하기 어렵습니다</h2>
      <p>경기북부는 서울 인접권, 신도시, 접경 지역, 외곽 관광권이 함께 있는 넓은 지역입니다.</p>
    </div>
    <p class="muted">고양은 일산·킨텍스, 화정·삼송, 행신·능곡 생활권이 다르고, 남양주는 다산·별내·평내호평·진접 생활권이 다릅니다. 파주는 운정신도시와 문산·금촌 생활권을 분리해야 하고, 의정부와 양주는 역세권과 신도시 이동 기준을 함께 확인해야 합니다. 포천, 가평, 연천은 지하철역보다 차량 이동, 예약 가능 시간, 추가 이동비 확인이 더 중요할 수 있습니다. 간다GO는 지역명만 바꾸는 대신 생활권과 이동 기준을 기준으로 안내합니다.</p>
    ${linkChips(regions.map((r) => [`${BASE}area/${r.slug}/`, r.name]))}
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head"><h2>경기북부 시군별 지역 안내</h2><p>10개 시군을 생활권·역세권·이동 기준으로 나눠 안내합니다.</p></div>
    <div class="grid cols-3">
    ${cityCards}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head"><h2>경기북부 주요 생활권</h2><p>신도시형·역세권형·외곽 이동형 생활권을 구분해 확인하세요.</p></div>
    <ul class="linklist">${lifeCards}</ul>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head"><h2>경기북부 지하철역 기준으로 찾기</h2><p>출구별·노선별이 아닌 역명 기준 1개 안내입니다.</p></div>
    <div class="article mt-0">
      ${stationByCity}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head"><h2>외곽 지역은 예약 전 이동 기준을 확인해야 합니다</h2></div>
    <p class="muted">포천, 가평, 연천, 양주 외곽, 파주 북부 지역은 도심형 생활권과 다릅니다. 방문 주소, 차량 이동 가능 여부, 예약 가능 시간, 추가 이동비, 숙소·펜션 위치, 야간 이동 기준을 먼저 확인해야 합니다.</p>
    ${linkChips(outerAreas.map((o) => [`${BASE}outer/${o.slug}/`, `${o.name} 외곽 이동 기준`]))}
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head"><h2>예약 전 확인해야 할 내용</h2></div>
    ${checklistBlock([
      "방문 주소를 정확히 확인했나요?",
      "경기북부 10개 시군 중 어느 지역인지 확인했나요?",
      "가까운 생활권과 지하철역을 확인했나요?",
      "외곽 또는 차량 이동 지역인지 확인했나요?",
      "공동현관 또는 건물 출입 방식이 있나요?",
      "호텔·숙소·펜션 이용 가능 여부를 확인했나요?",
      "오피스텔 관리 규정이 있나요?",
      "추가 이동비가 필요한 지역인가요?",
      "개인정보 처리 기준을 확인했나요?",
      "불법·선정적 서비스 불가 안내를 확인했나요?",
    ])}
    ${linkChips(checks.map((c) => [`${BASE}check/${c.slug}/`, c.name]))}
    ${policyNotice}
    ${eeat(
      "이 페이지는 경기북부 지역 방문형 관리 서비스 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.",
      "경기북부 10개 시군, 행정구역, 주요 생활권, 가까운 지하철역, 차량 이동 기준, 이용 장소별 예약 전 확인사항을 기준으로 구성했습니다.",
      "경기북부에서 방문형 서비스를 찾는 사용자가 자신의 지역과 이용 장소를 안전하게 확인할 수 있도록 돕기 위해 작성했습니다."
    )}
  </div>
</section>`;

  page({
    urlPath,
    title: "경기북부 출장마사지｜간다GO 10개 시군 생활권 안내",
    description: "간다GO 경기북부 출장마사지·홈타이. 10개 시군 생활권·역세권·외곽 이동과 예약 전 확인을 안내합니다.",
    current: "",
    breadcrumb: crumb,
    faq: DEFAULT_FAQ,
    image: { url: site.ogImage, alt: "경기북부 10개 시군 생활권 방문형 관리 안내 이미지" },
    body,
    priority: 1.0,
    changefreq: "weekly",
  });
}

// ---- 2) REGION ------------------------------------------------------
function buildRegions() {
  regions.forEach((r) => {
    const urlPath = `${BASE}area/${r.slug}/`;
    const crumb = [
      { name: "홈", url: BASE },
      { name: "권역 안내", url: `${BASE}area/${regions[0].slug}/` },
      { name: r.name, url: urlPath },
    ];
    const memberCities = r.cities.filter((s) => cityBy[s]);
    const cards = memberCities
      .map(
        (s) => `<article class="card"><h3><a href="${BASE}${s}/">${cityBy[s].name}</a></h3><p>${esc(cityBy[s].summary)}</p></article>`
      )
      .join("");
    const body = `
<section class="container">
  <div class="hero"><h1>${esc(r.name)} 출장마사지 지역 안내</h1><p class="lede">${esc(r.summary)}</p></div>
</section>
<section class="section"><div class="container"><article class="article">
  <p>${esc(r.detail)}</p>
  <h2>포함 시군</h2>
  <div class="grid cols-2">${cards}</div>
  <h2>다른 권역 보기</h2>
  ${linkChips(regions.filter((x) => x.slug !== r.slug).map((x) => [`${BASE}area/${x.slug}/`, x.name]))}
  ${policyNotice}
  ${eeat(
    "이 페이지는 경기북부 지역 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.",
    `${r.name}에 속한 시군의 생활권·역세권·이동 기준을 기준으로 구성했습니다.`,
    "권역 단위로 자신의 지역과 이동 기준을 먼저 확인할 수 있도록 돕기 위해 작성했습니다."
  )}
</article></div></section>`;
    page({
      urlPath,
      title: `${r.name} 출장마사지 지역 안내 | 간다GO`,
      description: `간다GO ${r.name} 출장마사지. ${r.summary}`,
      current: "area/seoul-adjacent/",
      breadcrumb: crumb,
      body,
      priority: 0.6,
    });
  });
}

// ---- 3) CITY --------------------------------------------------------
function cityContent(c) {
  const life = c.lifeAreas.filter((s) => lifeBy[s]).map((s) => lifeBy[s].name);
  const st = c.stations.filter((s) => stationBy[s]).map((s) => stationBy[s].name);
  const region = regionBy[c.region];
  const p = [];
  p.push(`<h2>${c.name} 지역 개요</h2><p>${esc(c.overview)}</p>`);
  if (c.districts.length) {
    p.push(
      `<h2>대표 행정구</h2><p>${c.name}은 ${c.districts.length}개 일반구 구조로, 각 구의 생활권 성격이 다릅니다.</p>` +
        `<ul>${c.districts
          .map((d) => {
            const dd = (dongsByDistrict[d.slug] || []).map((x) => `<a href="${dongUrl(x)}">${x.name}</a>`).join(", ");
            return `<li><a href="${BASE}${c.slug}/${d.slug}/"><strong>${d.name}</strong></a> — ${esc(d.note)}${dd ? `<br><span class="small muted">대표 행정동: ${dd}</span>` : ""}</li>`;
          })
          .join("")}</ul>`
    );
  } else if (dongsByCity[c.slug]) {
    p.push(
      `<h2>대표 행정동·읍면동</h2><p>${c.name}의 대표 행정동·읍면동을 생활권·이동 기준으로 나눠 안내합니다.</p>` +
        linkChips(dongsByCity[c.slug].map((d) => [dongUrl(d), d.name]))
    );
  } else {
    p.push(`<h2>대표 지역</h2><p>${c.name}의 대표 행정동·읍면동으로는 ${nameList(c.neighborhoods)} 등이 있으며, 생활권 기준으로 이동 기준을 나눠 확인합니다.</p>`);
  }
  p.push(
    `<h2>대표 생활권</h2><p>${c.name}의 대표 생활권은 ${nameList(life)}입니다. ${esc(c.focus)}</p>` +
      linkChips(cityLifeChips(c))
  );
  if (st.length) {
    p.push(
      `<h2>가까운 지하철역</h2><p>${c.name}에서 확인할 수 있는 주요 역은 ${nameList(st)}입니다. 출구별·노선별로 나누지 않고 역명 기준 1개로 안내하므로, 실제 방문 주소와 가장 가까운 역을 함께 확인하세요.</p>` +
        linkChips(cityStationChips(c))
    );
  } else {
    p.push(
      `<h2>차량 이동 기준</h2><p>${c.name}은 지하철역보다 차량 이동과 사전 예약 확인이 중요합니다. 방문 주소, 차량 진입 가능 여부, 예약 가능 시간, 추가 이동비를 먼저 확인해야 합니다.</p>` +
        linkChips(outerAreas.filter((o) => o.city === c.slug).map((o) => [`${BASE}outer/${o.slug}/`, `${o.name} 외곽 이동 기준`]))
    );
  }
  p.push(
    `<h2>이용 장소별 기준</h2><p>${c.name}에서는 자택, 호텔·숙소, 오피스텔 등 이용 장소에 따라 확인 사항이 달라집니다. 자택은 정확한 주소와 공동현관 출입 방식을, 호텔·숙소는 외부인 방문 정책과 객실 출입 가능 여부를, 오피스텔은 공동현관·엘리베이터·관리 규정을 먼저 확인해야 합니다. ${c.isOuter ? "외곽·관광권에서는 펜션·숙소 위치와 차량 이동 기준을 추가로 확인합니다." : "역세권에서는 상권과 주거지가 섞여 있어 방문 주소 기준 확인이 특히 중요합니다."}</p>` +
      linkChips([
        [`${BASE}use/home/`, "자택 이용 기준"],
        [`${BASE}use/hotel/`, "호텔·숙소 이용 기준"],
        [`${BASE}use/officetel/`, "오피스텔 이용 기준"],
        c.isOuter ? [`${BASE}use/pension-lodging/`, "펜션·숙소권 이용"] : [`${BASE}use/station-area/`, "역세권 이용 기준"],
      ])
  );
  if (c.isOuter) {
    p.push(`<h2>외곽 지역 추가 확인사항</h2><p>${c.name} 외곽 지역은 차량 이동 가능 여부, 예약 가능 시간, 추가 이동비, 숙소·펜션 위치, 야간 이동 기준을 예약 전에 먼저 확인해야 합니다. 도심 생활권과 이동 기준이 다르므로 방문 주소를 정확히 확인하는 것이 우선입니다.</p>`);
  }
  p.push(`<h2>예약 전 체크리스트</h2>${checklistBlock([
    `${c.name} 어느 생활권인지 확인했나요?`,
    "방문 주소와 동·호수를 정확히 확인했나요?",
    st.length ? "가까운 지하철역을 확인했나요?" : "차량 이동 가능 여부를 확인했나요?",
    "공동현관·건물 출입 방식이 있나요?",
    "이용 장소(자택·호텔·오피스텔) 기준을 확인했나요?",
    c.isOuter ? "추가 이동비가 필요한 지역인가요?" : "예약 가능 시간을 확인했나요?",
  ])}${linkChips(checks.slice(0, 4).map((x) => [`${BASE}check/${x.slug}/`, x.name]))}`);
  p.push(`<h2>개인정보 처리 기준 · 불법·선정적 서비스 불가 안내</h2>${policyNotice}`);
  const faq = [
    [`${c.name} 전 지역 방문이 가능한가요?`, `실제 방문 주소, 가까운 생활권, 예약 가능 시간, 이동 기준을 확인한 뒤 안내합니다.`],
    st.length
      ? [`${c.name}은 어느 역 기준으로 찾나요?`, `${nameList(st.slice(0, 3))} 등 역명 기준으로 확인하고, 실제 방문 주소와 건물 출입 방식을 함께 확인하세요.`]
      : [`${c.name}은 차량 이동 지역인가요?`, `${c.name}은 차량 이동과 사전 예약 확인이 중요합니다. 예약 가능 시간과 추가 이동비를 먼저 확인하세요.`],
    ["불법·선정적 서비스도 가능한가요?", "불법·선정적 서비스는 제공하거나 안내하지 않습니다."],
  ];
  p.push(faqBlock(faq));
  p.push(
    eeat(
      `이 페이지는 ${c.name} 지역 방문형 관리 서비스 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.`,
      `${c.name}의 행정구역, 주요 생활권, 가까운 지하철역 또는 차량 이동 기준, 이용 장소별 예약 전 확인사항을 기준으로 구성했습니다.`,
      `${c.name}에서 방문형 서비스를 찾는 사용자가 자신의 지역과 이용 장소를 안전하게 확인할 수 있도록 돕기 위해 작성했습니다.`
    )
  );
  p.push(`<h2>관련 지역 보기</h2>${linkChips([
    [BASE, "경기북부 메인"],
    [`${BASE}area/${c.region}/`, `${region ? region.name : "권역"} 안내`],
    ...adjChips(c),
  ])}`);
  return { html: p.join("\n  "), faq };
}

function buildCities() {
  cities.forEach((c) => {
    const urlPath = `${BASE}${c.slug}/`;
    const crumb = [
      { name: "홈", url: BASE },
      { name: "시군 안내", url: `${BASE}goyang/` },
      { name: c.name, url: urlPath },
    ];
    const { html, faq } = cityContent(c);
    const body = `
<section class="container"><div class="hero"><h1>${esc(c.h1)}</h1><p class="lede">${esc(c.summary)} 상호 간다GO · 전화예약 ${site.phone}.</p>
  <div class="cta-row"><a class="btn btn-primary" href="${site.phoneHref}">전화 예약</a><a class="btn btn-ghost" href="${BASE}check/address/">예약 전 확인</a></div></div></section>
<section class="section"><div class="container"><article class="article">
  ${html}
</article></div></section>`;
    page({
      urlPath,
      title: `${c.name} 출장마사지 | 간다GO 생활권 안내`,
      description: `간다GO ${c.name} 출장마사지·홈타이. ${c.summary}`,
      current: "goyang/",
      breadcrumb: crumb,
      faq,
      image: { url: site.ogImage, alt: `${c.name} 생활권 방문형 관리 안내 이미지` },
      body,
      priority: 0.8,
      changefreq: "weekly",
    });

    // districts (goyang)
    c.districts.forEach((d) => {
      const dUrl = `${BASE}${c.slug}/${d.slug}/`;
      const dCrumb = [...crumb, { name: d.name, url: dUrl }];
      const relLife = c.lifeAreas.filter((s) => lifeBy[s]);
      const dbody = `
<section class="container"><div class="hero"><h1>${c.name} ${d.name} 출장마사지 · 생활권 안내</h1><p class="lede">${esc(d.note)}</p></div></section>
<section class="section"><div class="container"><article class="article">
  <h2>${d.name} 개요</h2><p>${esc(d.note)} ${c.name}의 다른 구·생활권과 이동 기준이 다르므로 방문 주소가 ${d.name}에 속하는지 먼저 확인하세요.</p>
  ${(dongsByDistrict[d.slug] || []).length ? `<h2>대표 행정동</h2>${linkChips((dongsByDistrict[d.slug] || []).map((x) => [dongUrl(x), x.name]))}` : ""}
  <h2>대표 생활권</h2>${linkChips(relLife.map((s) => [`${BASE}life/${s}/`, lifeBy[s].name]))}
  <h2>이용 장소별 기준</h2>${linkChips([[`${BASE}use/home/`, "자택 이용"], [`${BASE}use/officetel/`, "오피스텔 이용"], [`${BASE}use/station-area/`, "역세권 이용"]])}
  <h2>예약 전 체크리스트</h2>${checklistBlock(["방문 주소와 동·호수 확인", "공동현관 출입 방식 확인", "가까운 생활권·역 확인", "이용 장소 기준 확인"])}
  ${policyNotice}
  ${eeat(`${c.name} ${d.name} 지역 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.`, `${d.name}의 생활권·역세권·이용 장소 기준으로 구성했습니다.`, `${d.name} 방문 사용자가 이동 기준을 안전하게 확인하도록 돕기 위해 작성했습니다.`)}
  <h2>관련 지역 보기</h2>${linkChips([[`${BASE}${c.slug}/`, `${c.name} 전체 보기`], [BASE, "경기북부 메인"]])}
</article></div></section>`;
      page({
        urlPath: dUrl,
        title: `${c.name} ${d.name} 출장마사지 | 간다GO`,
        description: `간다GO ${c.name} ${d.name} 출장마사지. ${d.note}`,
        current: "goyang/",
        breadcrumb: dCrumb,
        body: dbody,
        priority: 0.6,
      });
    });
  });
}

// ---- 3b) ADMIN DONGS (행정동·읍면동) --------------------------------
function buildAdminDongs() {
  adminDongs.forEach((d) => {
    const c = cityBy[d.city];
    const district = d.district ? c.districts.find((x) => x.slug === d.district) : null;
    const life = d.life ? lifeBy[d.life] : null;
    const st = (d.stations || []).filter((s) => stationBy[s]);
    const urlPath = dongUrl(d);
    const typeLabel = { newtown: "신도시형", "station-area": "역세권형", residential: "주거형", business: "상업·업무형", outer: "외곽 이동형" }[d.type] || "생활권";
    const covers = d.covers || d.summary || d.name;
    const summary = d.summary || `${d.name}은 ${covers} 중심의 ${typeLabel} 행정동입니다.`;
    const crumb = [
      { name: "홈", url: BASE },
      { name: "시군 안내", url: `${BASE}goyang/` },
      { name: c.name, url: `${BASE}${c.slug}/` },
      ...(district ? [{ name: district.name, url: `${BASE}${c.slug}/${district.slug}/` }] : []),
      { name: d.name, url: urlPath },
    ];
    const siblings = (dongsByCity[d.city] || []).filter((x) => x.slug !== d.slug).slice(0, 6);
    const useLink =
      d.type === "outer"
        ? [`${BASE}use/pension-lodging/`, "펜션·숙소권 이용"]
        : d.type === "newtown"
        ? [`${BASE}use/newtown/`, "신도시 생활권 이용"]
        : d.type === "station-area" || d.type === "business"
        ? [`${BASE}use/station-area/`, "역세권 이용"]
        : [`${BASE}use/home/`, "자택 이용"];

    const parts = [];
    parts.push(`<h2>${d.name} 지역 개요</h2><p>${esc(summary)} 상위 시군은 <a href="${BASE}${c.slug}/">${c.name}</a>${district ? `, 상위 행정구는 <a href="${BASE}${c.slug}/${district.slug}/">${district.name}</a>` : ""}이며, ${typeLabel} 생활권으로 분류합니다. 같은 ${c.name} 안에서도 ${d.name}은 이동 기준이 다를 수 있어 방문 주소가 ${d.name}에 속하는지 먼저 확인하는 것이 정확합니다.</p>`);
    if (life) {
      parts.push(`<h2>포함 생활권</h2><p>${d.name}은 <a href="${BASE}life/${life.slug}/">${life.name}</a> 생활권에 포함됩니다. ${esc(life.summary)}</p>`);
    }
    if (st.length) {
      parts.push(
        `<h2>가까운 지하철역</h2><p>${d.name}에서 가까운 역은 ${nameList(st.map((s) => stationBy[s].name))}입니다. 출구별로 나누지 않고 역명 기준으로 안내하므로, 실제 방문 주소와 가장 가까운 역을 함께 확인하세요.</p>` +
          linkChips(st.map((s) => [`${BASE}station/${s}/`, stationBy[s].name]))
      );
    } else {
      parts.push(`<h2>이동 기준</h2><p>${d.name}은 ${c.isOuter || d.type === "outer" ? "지하철역보다 차량 이동과 사전 예약 확인이 중요합니다. 방문 주소, 차량 진입 가능 여부, 예약 가능 시간, 추가 이동비를 먼저 확인해야 합니다." : "가까운 지하철역과 버스 이동을 함께 확인하고, 정확한 방문 주소를 기준으로 안내합니다."}</p>`);
    }
    parts.push(
      `<h2>이용 장소별 기준</h2><p>${d.name}에서는 이용 장소에 따라 확인 사항이 달라집니다. 자택은 정확한 주소와 공동현관 출입 방식을, 오피스텔은 공동현관·엘리베이터·관리 규정을, ${d.type === "outer" ? "펜션·숙소는 위치와 차량 진입 방식을" : "호텔·숙소는 외부인 방문 정책과 객실 출입 가능 여부를"} 먼저 확인하세요.</p>` +
        linkChips([useLink, [`${BASE}use/officetel/`, "오피스텔 이용"], [`${BASE}use/home/`, "자택 이용"]])
    );
    parts.push(
      `<h2>예약 전 체크리스트</h2>` +
        checklistBlock([
          `방문 주소가 ${d.name}이 맞는지 확인했나요?`,
          "동·호수와 공동현관 출입 방식을 확인했나요?",
          st.length ? "가까운 지하철역을 확인했나요?" : "차량 이동 가능 여부를 확인했나요?",
          d.type === "outer" ? "추가 이동비와 예약 가능 시간을 확인했나요?" : "예약 가능 시간을 확인했나요?",
        ]) +
        linkChips(checks.slice(0, 3).map((x) => [`${BASE}check/${x.slug}/`, x.name]))
    );
    parts.push(policyNotice);
    parts.push(
      faqBlock([
        [`${d.name}도 방문 가능한가요?`, `실제 방문 주소, 가까운 ${st.length ? "지하철역" : "이동 기준"}, 예약 가능 시간을 확인한 뒤 안내합니다.`],
        ["불법·선정적 서비스도 가능한가요?", "불법·선정적 서비스는 제공하거나 안내하지 않습니다."],
      ])
    );
    parts.push(
      eeat(
        `${c.name} ${d.name} 지역 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.`,
        `${d.name}의 상위 시군·행정구, 포함 생활권, 가까운 역 또는 차량 이동 기준, 이용 장소별 예약 전 확인사항을 기준으로 구성했습니다.`,
        `${d.name} 방문 사용자가 자신의 지역과 이용 장소를 안전하게 확인할 수 있도록 돕기 위해 작성했습니다.`
      )
    );
    parts.push(
      `<h2>관련 지역 보기</h2>` +
        linkChips([
          [`${BASE}${c.slug}/`, `${c.name} 전체`],
          ...(district ? [[`${BASE}${c.slug}/${district.slug}/`, `${district.name}`]] : []),
          ...(life ? [[`${BASE}life/${life.slug}/`, `${life.name} 생활권`]] : []),
          ...siblings.map((x) => [dongUrl(x), x.name]),
        ])
    );

    const body = `
<section class="container"><div class="hero"><h1>${c.name} ${d.name} 출장마사지 · 생활권 안내</h1><p class="lede">${esc(summary)} 상호 간다GO · 전화예약 ${site.phone}.</p></div></section>
<section class="section"><div class="container"><article class="article">
  ${parts.join("\n  ")}
</article></div></section>`;
    page({
      urlPath,
      title: `${c.name} ${d.name} 출장마사지 | 간다GO`,
      description: `간다GO ${c.name} ${d.name} 출장마사지. ${covers} 예약 전 확인 안내.`,
      current: "goyang/",
      breadcrumb: crumb,
      image: { url: site.ogImage, alt: `${c.name} ${d.name} 방문형 관리 안내 이미지` },
      body,
      priority: 0.5,
    });
  });
}

// ---- 4) LIFE AREAS --------------------------------------------------
function buildLifeAreas() {
  lifeAreas.forEach((l) => {
    const urlPath = `${BASE}life/${l.slug}/`;
    const city = cityBy[l.city];
    const crumb = [
      { name: "홈", url: BASE },
      { name: "생활권", url: `${BASE}life/${lifeAreas[0].slug}/` },
      { name: l.name, url: urlPath },
    ];
    const st = l.stations.filter((s) => stationBy[s]);
    const typeLabel = { newtown: "신도시형", "station-area": "역세권형", residential: "주거형", outer: "외곽 이동형" }[l.type] || "생활권";
    const body = `
<section class="container"><div class="hero"><h1>${l.name} 출장마사지 생활권 안내</h1><p class="lede">${esc(l.summary)}</p></div></section>
<section class="section"><div class="container"><article class="article">
  <h2>생활권 개요</h2><p>${esc(l.summary)} 상위 시군은 <a href="${BASE}${city.slug}/">${city.name}</a>이며, ${typeLabel} 생활권으로 분류합니다.</p>
  <h2>포함 지역</h2><p>대표 행정동·읍면동으로는 ${nameList(l.dongs)} 등이 포함됩니다.</p>
  ${st.length ? `<h2>가까운 지하철역</h2>${linkChips(st.map((s) => [`${BASE}station/${s}/`, stationBy[s].name]))}` : `<h2>차량 이동 여부</h2><p>${l.name}은 차량 이동과 사전 예약 확인이 중요한 생활권입니다.</p>`}
  <h2>이용 장소별 기준</h2><p>${l.name}에서는 자택·오피스텔·${l.type === "outer" ? "펜션·숙소" : "역세권"} 이용 시 방문 주소, 공동현관·건물 출입 방식, 예약 가능 시간을 먼저 확인합니다.</p>
  ${linkChips([[`${BASE}use/home/`, "자택 이용"], [`${BASE}use/officetel/`, "오피스텔 이용"], l.type === "outer" ? [`${BASE}use/pension-lodging/`, "펜션·숙소권 이용"] : [`${BASE}use/station-area/`, "역세권 이용"]])}
  <h2>예약 전 체크리스트</h2>${checklistBlock(["방문 주소와 동·호수 확인", st.length ? "가까운 역 확인" : "차량 이동 가능 여부 확인", "공동현관·건물 출입 방식 확인", "예약 가능 시간 확인"])}
  ${policyNotice}
  ${faqBlock([[`${l.name}은 어떤 생활권인가요?`, `${l.name}은 ${city.name}에 속한 ${typeLabel} 생활권으로, ${esc(l.summary)}`], ["불법·선정적 서비스도 가능한가요?", "불법·선정적 서비스는 제공하거나 안내하지 않습니다."]])}
  ${eeat(`${l.name} 생활권 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.`, `포함 시군·행정동, 가까운 역, 이용 장소 기준으로 구성했습니다.`, `${l.name} 방문 사용자가 이동 기준을 안전하게 확인하도록 돕기 위해 작성했습니다.`)}
  <h2>관련 지역 보기</h2>${linkChips([
    [`${BASE}${city.slug}/`, `${city.name} 전체`],
    ...l.neighbors.filter((n) => lifeBy[n]).map((n) => [`${BASE}life/${n}/`, `${lifeBy[n].name} 생활권`]),
    [BASE, "경기북부 메인"],
  ])}
</article></div></section>`;
    page({
      urlPath,
      title: `${l.name} 출장마사지 생활권 안내 | 간다GO`,
      description: `간다GO ${l.name} 출장마사지 생활권 안내. ${l.summary}`,
      current: "life/ilsan-kintex/",
      breadcrumb: crumb,
      image: { url: site.ogImage, alt: `${l.name} 생활권 방문형 관리 안내 이미지` },
      body,
      priority: 0.7,
    });
  });
}

// ---- 5) STATIONS ----------------------------------------------------
function buildStations() {
  stations.forEach((s) => {
    const urlPath = `${BASE}station/${s.slug}/`;
    const city = cityBy[s.city];
    const life = lifeBy[s.lifeArea];
    const crumb = [
      { name: "홈", url: BASE },
      { name: "지하철역", url: `${BASE}station/${stations[0].slug}/` },
      { name: s.name, url: urlPath },
    ];
    const nearStations = stations.filter((x) => x.city === s.city && x.slug !== s.slug).slice(0, 5);
    const body = `
<section class="container"><div class="hero"><h1>${s.name} 출장마사지 · ${city.name} 역세권 안내</h1><p class="lede">${city.name} ${life ? life.name + " 생활권" : ""} 인근 ${s.name} 역세권 이동 기준을 안내합니다.</p></div></section>
<section class="section"><div class="container"><article class="article">
  <h2>역세권 개요</h2><p>${s.name}은 ${city.name}(${s.line})에 위치한 역으로, ${life ? `<a href="${BASE}life/${life.slug}/">${life.name}</a> 생활권` : "인근 생활권"}과 이어집니다. 상위 시군은 <a href="${BASE}${city.slug}/">${city.name}</a>입니다.</p>
  <h2>가까운 행정동</h2><p>${s.name} 인근 대표 행정동으로는 ${nameList(s.dongs)} 등이 있습니다.</p>
  <h2>${s.transfer ? "환승역 안내" : "출구별 페이지를 만들지 않는 이유"}</h2><p>${s.transfer ? `${s.name}은 ${s.line} 환승 성격이 있는 역이지만, 노선별로 페이지를 나누지 않고 역명 기준 1개로 안내합니다.` : `${s.name}은 출구별로 페이지를 나누지 않습니다. 출구가 아닌 실제 방문 주소를 기준으로 확인하는 것이 정확합니다.`} 방문 주소와 건물 출입 방식을 함께 확인하세요.</p>
  <h2>이용 장소별 기준</h2><p>${s.name} 역세권은 상권과 주거지가 섞여 있어 자택·오피스텔·역세권 이용 시 방문 주소 기준 확인이 특히 중요합니다.</p>
  ${linkChips([[`${BASE}use/station-area/`, "역세권 이용"], [`${BASE}use/officetel/`, "오피스텔 이용"], [`${BASE}use/home/`, "자택 이용"]])}
  <h2>예약 전 체크리스트</h2>${checklistBlock(["출구가 아닌 실제 방문 주소 확인", "공동현관·건물 출입 방식 확인", "가까운 생활권 확인", "예약 가능 시간 확인"])}
  ${policyNotice}
  ${faqBlock([[`${s.name} 출구별로 안내가 다른가요?`, "출구별로 페이지를 나누지 않습니다. 실제 방문 주소와 건물 출입 방식을 기준으로 확인합니다."], ["불법·선정적 서비스도 가능한가요?", "불법·선정적 서비스는 제공하거나 안내하지 않습니다."]])}
  ${eeat(`${s.name} 역세권 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.`, `상위 시군·가까운 행정동·생활권·이용 장소 기준으로 구성했습니다.`, `${s.name} 인근 방문 사용자가 이동 기준을 안전하게 확인하도록 돕기 위해 작성했습니다.`)}
  <h2>관련 지역 보기</h2>${linkChips([
    [`${BASE}${city.slug}/`, `${city.name} 전체`],
    ...(life ? [[`${BASE}life/${life.slug}/`, `${life.name} 생활권`]] : []),
    ...nearStations.map((x) => [`${BASE}station/${x.slug}/`, x.name]),
  ])}
</article></div></section>`;
    page({
      urlPath,
      title: `${s.name} 출장마사지 | 간다GO ${city.name} 역세권`,
      description: `간다GO ${s.name} 출장마사지. ${city.name} 역세권 이동 기준과 예약 전 확인 안내.`,
      current: "station/uijeongbu-station/",
      breadcrumb: crumb,
      image: { url: site.ogImage, alt: `${s.name} 역세권 방문형 관리 안내 이미지` },
      body,
      priority: 0.6,
    });
  });
}

// ---- 6) OUTER -------------------------------------------------------
function buildOuter() {
  outerAreas.forEach((o) => {
    const urlPath = `${BASE}outer/${o.slug}/`;
    const city = cityBy[o.city];
    const crumb = [
      { name: "홈", url: BASE },
      { name: "외곽 이동", url: `${BASE}outer/${outerAreas[0].slug}/` },
      { name: o.name, url: urlPath },
    ];
    const body = `
<section class="container"><div class="hero"><h1>${o.name} 출장마사지 외곽 이동 기준 안내</h1><p class="lede">${esc(o.summary)}</p></div></section>
<section class="section"><div class="container"><article class="article">
  <h2>외곽 지역 개요</h2><p>${esc(o.summary)} 상위 시군은 <a href="${BASE}${city.slug}/">${city.name}</a>이며, 도심형 생활권과 이동 기준이 다릅니다.</p>
  <h2>포함 읍면동</h2><p>${nameList(o.dongs)} 등이 포함됩니다.</p>
  <h2>차량 이동 기준</h2><p>${o.name}은 지하철역보다 차량 이동이 중심입니다. 방문 주소, 차량 진입 가능 여부, 예약 가능 시간, 추가 이동비를 예약 전에 먼저 확인해야 합니다.</p>
  <h2>예약 가능 시간 · 추가 이동비</h2><p>외곽·심야 이동 시 추가 이동비가 발생할 수 있으며, 정확한 기준은 예약 시 안내합니다. 펜션·숙소를 이용하는 경우 위치와 진입 방식을 함께 확인하세요.</p>
  ${linkChips([[`${BASE}use/pension-lodging/`, "펜션·숙소권 이용"], [`${BASE}use/outer-area/`, "외곽 지역 이용"], [`${BASE}check/travel-fee/`, "추가 이동비 기준"], [`${BASE}check/time/`, "예약 가능 시간"]])}
  <h2>예약 전 체크리스트</h2>${checklistBlock(["방문 주소를 정확히 확인했나요?", "차량 이동이 가능한 위치인가요?", "예약 가능 시간을 확인했나요?", "추가 이동비가 필요한가요?", "펜션·숙소 위치를 확인했나요?"])}
  ${policyNotice}
  ${faqBlock([[`${o.name}은 추가 확인이 필요한가요?`, "외곽 지역은 차량 이동 가능 여부, 예약 가능 시간, 추가 이동비, 숙소 위치를 먼저 확인해야 합니다."], ["불법·선정적 서비스도 가능한가요?", "불법·선정적 서비스는 제공하거나 안내하지 않습니다."]])}
  ${eeat(`${o.name} 외곽 이동 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.`, `포함 읍면동·차량 이동·예약 가능 시간·추가 이동비 기준으로 구성했습니다.`, `${o.name} 외곽 방문 사용자가 이동 기준을 안전하게 확인하도록 돕기 위해 작성했습니다.`)}
  <h2>관련 지역 보기</h2>${linkChips([[`${BASE}${city.slug}/`, `${city.name} 전체`], [BASE, "경기북부 메인"]])}
</article></div></section>`;
    page({
      urlPath,
      title: `${o.name} 출장마사지 외곽 이동 기준 | 간다GO`,
      description: `간다GO ${o.name} 외곽 이동 기준. 차량 이동·예약 가능 시간·추가 이동비 안내.`,
      current: "outer/pocheon-songu/",
      breadcrumb: crumb,
      image: { url: site.ogImage, alt: `${o.name} 외곽 이동 기준 안내 이미지` },
      body,
      priority: 0.6,
    });
  });
}

// ---- 7) USE CASES / 8) CHECKS (generic list-body) -------------------
function simpleDetailPage(item, kind) {
  const seg = kind === "use" ? "use" : "check";
  const navCur = kind === "use" ? "use/home/" : "check/address/";
  const label = kind === "use" ? "이용 장소" : "예약 전 확인";
  const siblings = (kind === "use" ? useCases : checks).filter((x) => x.slug !== item.slug);
  const urlPath = `${BASE}${seg}/${item.slug}/`;
  const crumb = [
    { name: "홈", url: BASE },
    { name: label, url: `${BASE}${seg}/${(kind === "use" ? useCases : checks)[0].slug}/` },
    { name: item.name, url: urlPath },
  ];
  const body = `
<section class="container"><div class="hero"><h1>${esc(item.h1)}</h1><p class="lede">${esc(item.summary)}</p></div></section>
<section class="section"><div class="container"><article class="article">
  <h2>확인 항목</h2><p>${esc(item.summary)} 경기북부는 시군·생활권·역세권·외곽 지역에 따라 확인 사항이 달라지므로 방문 주소 기준으로 확인하는 것이 정확합니다.</p>
  <h2>핵심 확인 사항</h2>${checklistBlock(item.points)}
  <h2>시군·생활권별 차이</h2><p>고양·의정부 같은 역세권 지역과 포천·가평·연천 같은 외곽 지역은 이 항목의 확인 방식이 다릅니다. 자신의 방문 지역이 어느 생활권인지 먼저 확인하세요.</p>
  ${linkChips([[BASE, "경기북부 메인"], [`${BASE}goyang/`, "시군 안내"], [`${BASE}outer/pocheon-songu/`, "외곽 이동 기준"]])}
  ${policyNotice}
  ${eeat(`경기북부 지역 안내 콘텐츠 담당자가 작성하고 운영 책임자가 검수합니다.`, `${item.name} 항목을 시군·생활권·역세권·외곽 기준으로 구성했습니다.`, `방문 사용자가 예약 전 필요한 사항을 안전하게 확인하도록 돕기 위해 작성했습니다.`)}
  <h2>관련 ${label} 보기</h2>${linkChips(siblings.map((x) => [`${BASE}${seg}/${x.slug}/`, x.name]))}
</article></div></section>`;
  page({
    urlPath,
    title: `${item.h1} | 간다GO`,
    description: `간다GO ${item.name} 안내. ${item.summary}`,
    current: navCur,
    breadcrumb: crumb,
    image: { url: site.ogImage, alt: `${item.name} 안내 이미지` },
    body,
    priority: 0.55,
  });
}

// ---- 9) POLICIES ----------------------------------------------------
function buildPolicies() {
  policies.forEach((pol) => {
    const urlPath = `${BASE}policy/${pol.slug}/`;
    const crumb = [
      { name: "홈", url: BASE },
      { name: "운영 기준", url: `${BASE}policy/author/` },
      { name: pol.name, url: urlPath },
    ];
    const contactExtra =
      pol.slug === "contact"
        ? `<div class="cta-row" style="display:flex;gap:12px;flex-wrap:wrap;margin:16px 0">
             <a class="btn btn-primary" href="${site.phoneHref}">전화 예약 ${site.phone}</a>
             <a class="btn btn-telegram" href="${site.telegram.reserve}" target="_blank" rel="noopener nofollow">${tgIcon} 텔레그램 예약</a>
           </div>`
        : "";
    const body = `
<section class="container"><div class="hero"><h1>${esc(pol.h1)}</h1><p class="lede">${esc(pol.summary)}</p></div></section>
<section class="section"><div class="container"><article class="article">
  ${contactExtra}
  ${pol.body.map((b) => `<p>${esc(b)}</p>`).join("\n  ")}
  ${policyNotice}
  <h2>운영 기준 바로가기</h2>${linkChips(policies.filter((x) => x.slug !== pol.slug).map((x) => [`${BASE}policy/${x.slug}/`, x.name]))}
</article></div></section>`;
    page({
      urlPath,
      title: `${pol.name} | 간다GO`,
      description: `간다GO ${pol.name}. ${pol.summary}`,
      current: "policy/contact/",
      breadcrumb: crumb,
      body,
      priority: pol.slug === "contact" ? 0.7 : 0.4,
      changefreq: "yearly",
    });
  });
}

// ---- assets: css + svg ---------------------------------------------
function buildAssets() {
  const assetDir = path.join(OUT, "gyeonggi-north", "assets");
  fs.mkdirSync(assetDir, { recursive: true });
  // inline @import 대신 두 파일 모두 복사
  fs.copyFileSync(path.join(__dirname, "src", "css", "tokens.css"), path.join(assetDir, "tokens.css"));
  fs.copyFileSync(path.join(__dirname, "src", "css", "styles.css"), path.join(assetDir, "styles.css"));
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#f26b1d"/><text x="32" y="43" font-family="Pretendard,sans-serif" font-size="34" font-weight="800" fill="#fff" text-anchor="middle">G</text></svg>`;
  fs.writeFileSync(path.join(assetDir, "logo.svg"), logo);
  const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#201b18"/><stop offset="1" stop-color="#2f2823"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect y="0" width="1200" height="6" fill="#c9a24b"/><text x="80" y="300" font-family="Pretendard,sans-serif" font-size="72" font-weight="800" fill="#fff">간다GO 경기북부</text><text x="80" y="390" font-family="Pretendard,sans-serif" font-size="44" font-weight="600" fill="#ffb37a">10개 시군 생활권 지역 안내</text><text x="80" y="470" font-family="Pretendard,sans-serif" font-size="34" fill="#c2b6aa">전화예약 0508-202-4719</text></svg>`;
  fs.writeFileSync(path.join(assetDir, "og-default.svg"), og);
}

// ---- sitemap / robots / 404 ----------------------------------------
function buildMeta() {
  const urls = registry
    .filter((r) => !r.noindex)
    .map(
      (r) =>
        `  <url><loc>${abs(r.url)}</loc><lastmod>${LAST_MOD}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority.toFixed(1)}</priority></url>`
    )
    .join("\n");
  fs.writeFileSync(
    path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  fs.writeFileSync(
    path.join(OUT, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${abs("/sitemap.xml")}\n`
  );
  // 404
  const body404 = `<section class="container"><div class="hero"><h1>페이지를 찾을 수 없습니다</h1><p class="lede">주소가 변경되었거나 준비 중인 페이지일 수 있습니다.</p><div class="cta-row"><a class="btn btn-primary" href="${BASE}">경기북부 메인으로</a></div></div></section>`;
  page({
    urlPath: BASE + "404/",
    title: "404 · 페이지를 찾을 수 없습니다 | 간다GO",
    description: "요청하신 페이지를 찾을 수 없습니다. 경기북부 메인에서 다시 찾아보세요.",
    breadcrumb: [{ name: "홈", url: BASE }],
    body: body404,
    noindex: true,
  });
  fs.copyFileSync(path.join(OUT, "gyeonggi-north", "404", "index.html"), path.join(OUT, "404.html"));
  // 루트 리다이렉트
  fs.writeFileSync(
    path.join(OUT, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>간다GO</title><meta http-equiv="refresh" content="0; url=${BASE}"><link rel="canonical" href="${abs(BASE)}"><a href="${BASE}">경기북부 출장마사지 안내로 이동</a>`
  );
}

// =====================================================================
function run() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  buildAssets();
  buildMain();
  buildRegions();
  buildCities();
  buildAdminDongs();
  buildLifeAreas();
  buildStations();
  buildOuter();
  useCases.forEach((u) => simpleDetailPage(u, "use"));
  checks.forEach((c) => simpleDetailPage(c, "check"));
  buildPolicies();
  buildMeta();
  const idx = registry.filter((r) => !r.noindex).length;
  console.log(`✅ 빌드 완료 · 총 ${registry.length}개 페이지 (색인 ${idx}, noindex ${registry.length - idx})`);
}
run();
