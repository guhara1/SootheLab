# 간다GO · 경기북부 출장마사지 지역 안내 사이트

경기북부 10개 시군(고양·남양주·파주·의정부·양주·구리·포천·동두천·가평·연천)의
생활권·역세권·외곽 이동 기준을 안내하는 **정적 사이트 생성기**입니다.
Google 검색 가이드라인(E-E-A-T, Who/How/Why, 스팸 정책, 구조화 데이터)을 반영해
데이터(JSON) 기반으로 페이지를 자동 생성합니다.

## 실행

```bash
node build.js      # dist/ 에 정적 HTML 생성
npm run serve      # 빌드 후 http://localhost:4173 로 미리보기
```

## 구조

```
data/gyeonggi-north/   # 콘텐츠 데이터 (JSON)
  site.json            # 브랜드·전화·텔레그램·조직 스키마 설정
  cities.json          # 10개 시군 + 고양 3개 구
  regions.json         # 7개 권역
  life-areas.json      # 18개 생활권
  stations.json        # 38개 지하철역 (역명 기준 1 URL, 출구·노선별 분리 금지)
  outer-areas.json     # 5개 외곽 이동권
  admin-dongs.json     # 102개 행정동 전체 (읍·면 제외, 고양은 구 하위 중첩)
  use-cases.json       # 8개 이용 장소
  checks.json          # 8개 예약 전 확인
  policies.json        # 운영 기준·문의하기
src/css/
  tokens.css           # 프리미엄 팔레트 디자인 토큰 + 컴포넌트 오버레이 (Pretendard)
  styles.css           # 컴포넌트 스타일
build.js               # 생성기 (레이아웃·스키마·내부링크·푸터 CTA)
dist/                  # 생성 결과 (gitignore)
```

## 반영한 요구사항

- **푸터 CTA**: `웹사이트 제작문의`·`제휴문의` 오렌지 버튼 → 텔레그램 링크
  (`site.json`의 `telegram.website` / `telegram.partner`, 현재 플레이스홀더).
- **브랜드·연락처**: 상호 `간다GO`, 전화예약 `0508-202-4719` — 헤더·푸터·전 페이지 노출.
- **메타 디스크립션**: 전 페이지 80자 이내 자동 clamp.
- **구조화 데이터**: 모든 페이지 `Organization`·`WebPage`·`BreadcrumbList`,
  주요 페이지 `FAQPage`·`ImageObject` (JSON-LD `@graph`).
  실제 매장·후기가 없으므로 `LocalBusiness`·`Review`·`AggregateRating` 미사용.
- **디자인 토큰**: 프리미엄 팔레트(딥 차콜·시그니처 오렌지·딥 틸·골드)로 교체,
  히어로/카드/글래스 헤더/골드 룰 등 컴포넌트 오버레이 추가. 다크모드 대응.
- **내부링크 강화**: 메인 → 권역 → 시군 → 생활권 → 역세권 → 외곽 → 예약 전 확인으로
  롱테일·비반복 앵커텍스트 링크 연결.
- **E-E-A-T / Who·How·Why**: 모든 주요 페이지 하단 작성자·검수자 + Who/How/Why 블록.
- **스팸 방지**: 출구별·노선별 역 페이지 미생성, 지역명 단순 치환 금지,
  불법·선정적 서비스 불가 안내·개인정보 처리방침 연결.
- **기술 SEO**: `sitemap.xml`, `robots.txt`, canonical, og/schema image,
  404 페이지, 루트 리다이렉트, `noindex` 관리.

## 남은 작업(2차)

- 실제 텔레그램 주소로 `site.json` 교체.
- 행정동 목록·관할 구역 검증: 위키백과/나무위키/시청 사이트가 현재 환경의 egress
  정책으로 차단되어 검색 요약 기반으로 구성함. 번호동(운정1~6동 등) 관할 구역은
  정확한 법정동 단정 대신 지역 성격 중심으로 서술. 공식 행정복지센터 목록과
  대조해 `admin-dongs.json`의 `covers`·행정동 구성 확정 필요.
- 세부 행정동·읍면동 데이터 추가 등록 후 검색 수요 확인 시 순차 색인.
- 대표 이미지(실사) 교체 — 현재는 자동 생성 SVG(og/logo) 사용.
- 도메인(`baseUrl`) 확정 후 canonical/sitemap 재빌드.
