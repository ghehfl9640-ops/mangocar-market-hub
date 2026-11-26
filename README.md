# 망고카 국가별 수입 마진 허브

세계 지도에서 아무 나라나 고르면 → 리포트가 있는 나라는 비용 구조도 · 근거표 · 리포트 원본이 열림.
리포트가 없는 나라는 「준비 전」과 채워야 할 항목이 나옴.

## 두 가지 버전
| | GitHub / 파일로 열기 (`index.html`) | 팀 공유 페이지 (claude.ai) |
|---|---|---|
| 리포트 데이터 | 매번 최신으로 읽음 | 올릴 때 찍은 사본 (`build_artifact.py`) |
| 리포트 원본 탭 | 화면 안에 보임 | 새 탭 링크 |
| 영업 수정 · 잠금 | 이 브라우저에만 저장 | 팀 전체가 같이 봄 · 잠금은 편집자만 |

## 파일
- `index.html` — 허브 화면
- `registry.js` — 나라별 계산식 + 항목별 근거 (값 · 상태 · 출처 · 메모). **숫자 근거는 전부 여기**
- `ko.js` — 나라 이름 한국어
- `build_artifact.py` — 팀 공유 페이지용 묶음 만들기 (`_artifact/`, GitHub에는 안 올림)

## 값이 정해지는 순서
영업 수정값 → 근거 확인값(`base`) → 원본 리포트 값(`path` / `report`)
- 근거 범위 안에 있으면 리포트 값을 그대로 두고, 범위 밖이면 가장 가까운 근거값을 씀
- 수정하면 구조도 · 예시 계산 · 전체 차량 재계산에 바로 반영
- 「원본 리포트 값으로」 계산은 실제 리포트 페이지 숫자와 같아야 함 (2026-11-26 세 나라 모두 일치 확인)

## 최신화 (한 달에 한 번 또는 리포트가 바뀌었을 때)
1. Claude 에게 「망고카 허브 근거 재확인해줘」
2. `registry.js` 의 base · status · sources · note · `checkedAt` 갱신
3. 팀 공유 페이지도 다시 올림: `python3 build_artifact.py` → Claude 에게 재배포 요청

## 나라 추가
리포트(data.json)가 생기면 `registry.js` 의 `COUNTRIES` 에 한 덩어리 추가 (iso 는 ISO 3166 숫자 코드).

## GitHub Pages 배포
```powershell
cd workspace/mangocar-market-hub
git init -b main
git add index.html registry.js ko.js README.md build_artifact.py .gitignore
git commit -m "망고카 국가별 수입 마진 허브"
git remote add origin https://github.com/<내계정>/mangocar-market-hub.git
git push -u origin main
```
GitHub 저장소 → Settings → Pages → Branch: main / root.
