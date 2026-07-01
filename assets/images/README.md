# 이미지 업로드 폴더

여기에 이미지를 올리면 빌드 시 `dist/assets/images/`로 복사되어
사이트에서 `/assets/images/<파일명>` 경로로 사용됩니다.

## 히어로 밑 이미지 교체 방법 (가장 간단)

1. 이 폴더에 **`hero.jpg`** (또는 `hero.png` / `hero.webp`) 이름으로 이미지를 업로드합니다.
   - 권장 비율 **16:7** (예: 1600×700), 용량은 300KB 이하 권장.
2. 커밋/푸시하면 빌드가 자동으로 히어로 밑 이미지를 교체합니다.
   - `hero.jpg`가 있으면 자동 우선 적용됩니다(코드 수정 불필요).
   - 없으면 `hero.svg` 플레이스홀더가 표시됩니다.

## GitHub 웹에서 업로드하는 법

아래 주소로 접속하면 이 폴더에 바로 업로드할 수 있습니다(작업 브랜치 기준):

```
https://github.com/guhara1/soothelab/upload/claude/happy-brown-8imysb/assets/images
```

- "Upload files" 화면에서 이미지를 끌어다 놓고 **Commit changes**.
- 업로드 후 배포되면 이미지 주소: `https://soothelab.netlify.app/assets/images/hero.jpg`

## 다른 이름/여러 장을 쓰고 싶을 때

- 파일명을 자유롭게 올린 뒤(`예: banner1.jpg`), `data/gyeonggi-north/site.json`의
  `heroImage` 값을 `/assets/images/banner1.jpg`로 바꾸면 됩니다.
