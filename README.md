# Pokémon — Mew's Escape · Phase 1

실제 포켓몬 스프라이트를 사용하는 한 방 전투 프로토타입. 기존 sd-capsule 프로젝트와 분리된 웹 앱입니다.

## 웹 배포

GitHub Pages: https://yum-sy.github.io/mews-escape/

`main`에 push하면 GitHub Actions에서 테스트·빌드 후 Pages로 배포됩니다. Vite는 상대 경로를 사용하여 저장소 하위 URL에서도 에셋을 불러옵니다.

## 실행

Node.js 22 이상 권장.

```sh
npm install
npm run dev
```

브라우저에서 표시된 Local URL을 엽니다. 같은 Wi-Fi의 모바일에서는 개발 서버가 표시하는 Network URL을 사용합니다.

```sh
npm run build
npm test
```

`dist/`는 정적 호스팅용 결과물입니다. 파일을 직접 더블클릭하는 file:// 방식 대신 HTTP 서버를 사용하세요.

## 조작과 범위

- WASD: 이동. 대각선 속도 정규화.
- 방향키: 4방향 연속 염동력 공격. 이동과 독립.
- Esc / 우측 상단 버튼: 일시정지와 이어하기.
- 터치 기기: 좌측 이동·우측 공격 스틱. pointerId별 캡처로 동시 입력.
- 소리 버튼: 선택적으로 합성 효과음 재생. 초기 음소거.
- 고오스 3마리: 거리 유지 및 조준 탄환. 주뱃 3마리: 추적, 예고, 돌진.
- 체력 6, 피격 후 1.1초 무적, 넉백. 시작 후 1.2초 안전 시간.
- 6마리 처치 시 문 잠금 해제 및 완료 화면. 사망 시 실패 화면. 재시작은 체력·적·탄환·시간 전부 초기화.
- 창 비활성화 및 탭 숨김 시 자동 일시정지.

Phase 2 이후 범위인 랜덤 방, 기술 조합, 보상, 영구 기록, 저장 복원, 보스, PWA 설치·오프라인 캐시는 아직 구현하지 않았습니다. Space/E 액티브·상호작용 버튼도 해당 기능이 추가될 때 연결합니다.

## 기술 선택과 아키텍처

Phaser 3.90.0 + TypeScript + Vite. Phaser는 데스크톱/모바일 WebGL 및 Canvas와 TypeScript를 지원하므로 같은 코드로 고정 카메라 2D 전투를 구성하기 적합합니다.

- `src/data.ts`: 방 경계, 능력치, 적 데이터, 배치.
- `src/combat.ts`: 방향 정규화, 4방향 조준, 충돌, 피해/무적 순수 계산.
- `src/input.ts`: 키보드 및 독립 포인터 기반 듀얼 스틱.
- `src/scene.ts`: 전투 라이프사이클, 적 AI, 렌더링, 탄환 수명 및 이펙트.
- `src/audio.ts`: 선택적 Web Audio 효과음.
- `src/style.css`, `index.html`: 캔버스 위 HUD, 메뉴, 터치 컨트롤.

다음 단계에서는 scene의 적/투사체 업데이트를 별도 시스템으로 추출하고 BaseAttack → MoveModifier → ProjectileBehavior → OnHitEffect 파이프라인을 추가합니다. 지금은 염동력 한 종류만 구현했습니다. 탄환 상한은 120, 프레임 dt 상한은 33ms이며 제거된 탄환과 효과 객체는 파기합니다. 60 FPS는 설정 목표이며 모바일 실기기 수치는 아직 측정하지 않았습니다.

## 확보한 외부 에셋

다운로드 확인일: 2026-11-14. 모든 파일은 `public/assets/`에 포함됩니다. 게임 실행 중 API 호출 없음.

|파일|실제 리소스|사용|
|---|---|---|
|mew.png|PokéAPI sprites Gen V black-white 151, 96×96 PNG|주인공|
|gastly.png|PokéAPI sprites Gen V black-white 92, 96×96 PNG|원거리 적|
|zubat.png|PokéAPI sprites Gen V black-white 41, 96×96 PNG|돌진 적|
|lab-tiles.png|Kenney Topdown Shooter, 1728×1280 PNG|바닥·벽·콘솔, 런타임 프레임 지정 및 색상 틴트|

출처 및 라이선스는 `public/assets/CREDITS.txt`와 `Kenney-LICENSE.txt` 참조. 포켓몬 스프라이트는 방향별 걷기 애니메이션이 없는 정적 전투 이미지이며 반전·기울기·피격 깜빡임으로 동작을 표현합니다. 독자적인 포켓몬 도트 리소스는 제작하지 않았습니다.

## 검증

- TypeScript 검사 및 production build 통과.
- 이동 정규화, 4방향/데드존, 무적/체력 하한, 충돌 반경/탄환 상한, 안전한 초기 배치 테스트.
- 브라우저: 시작, 연속 발사/처치, 일시정지/재개, 완료 화면, 체력 0 게임 오버, 재시작 초기화 확인.
- 844×390 가로 화면과 세로 화면의 렌더링 확인.
- 터치 실기기의 동시 두 손가락 입력, Safari/Android 기기별 성능은 미검증.

## 참고

- https://docs.phaser.io/phaser/getting-started/what-is-phaser
- https://github.com/PokeAPI/sprites
- https://opengameart.org/content/topdown-shooter
