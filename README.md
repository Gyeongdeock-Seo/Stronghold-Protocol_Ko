# 위수협의: 맹약 · Stronghold Protocol: Covenant

《명일방주》의 시즌 오토체스 타워 디펜스 모드 「위수협의: 맹약」을 **비공식 팬 메이크로 재현한 작품**입니다. 브라우저에서 바로 플레이할 수 있으며, 싱글 플레이 또는 1–4인 온라인 협동을 지원합니다.

![version](https://img.shields.io/badge/version-0.1.3-2ea44f)
![license](https://img.shields.io/badge/code%20license-GPL--3.0--or--later-blue)
![node](https://img.shields.io/badge/node-22%20%7C%2024-339933)

## 고지사항

> [!IMPORTANT]
> - 본 프로젝트는 플레이어가 제작한 **비공식 팬 메이드 작품**으로, 상하이 하이퍼그리프 네트워크 테크놀로지 유한회사(Hypergryph), Yostar 및 그 관계사와 **아무런 관계가 없으며**, 이들의 허가나 승인을 받지 않았습니다.
> - 《명일방주》 및 「위수협의」과 관련된 명칭, 캐릭터, 일러스트, 음악, 음향 효과, 텍스트 및 데이터 등의 소재에 대한 저작권은 원 권리자에게 있습니다. 이러한 소재에는 본 프로젝트의 GPL-3.0 라이선스가 **적용되지 않으며**, GPL은 본 프로젝트에서 직접 작성한 코드에만 적용됩니다.
> - 학습 및 교류와 개인적인 비상업적 사용만을 목적으로 합니다. **어떠한 형태의 영리 행위도 엄격히 금지**됩니다. 여기에는 프로젝트 또는 통합 패키지 판매, 유료 다운로드 또는 유료 배포, 유료 서버 또는 유료 대행 운영, 광고 / 후원 / 멤버십 등의 수익화 방식 및 기타 모든 상업적 이용이 포함되며 이에 국한되지 않습니다.
> - 저장소의 소스 코드에는 게임의 미술 및 오디오 소재가 포함되어 있지 않습니다(공식 데이터 테이블로 생성한 데이터와 몇 장의 게임 스크린샷만 포함되어 있으며, 이들 역시 GPL의 적용을 받지 않습니다). [Releases](../../releases/latest)의 통합 패키지에는 플레이어의 편의를 위해 소재가 포함되어 있으며, 다운로드하는 것은 본 고지사항에 동의하는 것으로 간주됩니다. 소재를 본 프로젝트 외의 용도로 사용하거나 별도로 재배포하지 마십시오. 자세한 약관은 [NOTICE.md](NOTICE.md)를 참조하십시오.
> - 권리자가 본 프로젝트가 자신의 권리를 침해한다고 판단하는 경우 Issue를 통해 연락해 주시면 **즉시** 관련 내용을 삭제하겠습니다.
> - 본 프로젝트는 「있는 그대로」 제공되며 **어떠한 보증도 제공하지 않습니다**. 사용에 따른 위험은 사용자 본인이 부담합니다.

| 동맹 방 | 전략 선택 | 정비 기간（상점 / 맹약） |
|---|---|---|
| ![房间](docs/img/room.jpg) | ![策略](docs/img/band-draft.jpg) | ![休整期](docs/img/prep.jpg) |
| **배치 방향 휠** | **전투** | **최종 공세** |
| ![方向](docs/img/facing-wheel.jpg) | ![作战](docs/img/combat.jpg) | ![最终攻势](docs/img/final-assault.jpg) |

## 목차

- [고지사항](#고지사항) · [소개](#소개) · [기능 개요](#기능-개요)
- [빠른 시작](#빠른-시작)：[통합 패키지](#방법-1-통합-패키지-권장) · [소스 코드에서 실행](#방법-2-소스-코드에서-실행) · [시스템 요구 사항](#시스템-요구-사항) · [포트 및 설정](#포트-및-설정) · [친구와 함께 LAN으로 플레이](#친구와-함께-플레이-lan)
- [온라인 플레이 방법](#온라인-플레이-방법) · [조작](#조작) · [문서](#문서) · [개발 및 테스트](#개발-및-테스트) · [프로젝트 구조](#프로젝트-구조)
- [라이선스](#라이선스) · [감사 및 데이터 출처](#감사-및-데이터-출처) · [기여](#기여)

## 소개

「위수협의: 맹약」은 오토체스 + 타워 디펜스 게임입니다. 정비 기간에는 지휘 센터에서 오퍼레이터를 모집하고, 진형을 구성하며, 장비를 배치합니다. 전투 기간에는 오퍼레이터가 자동으로 배치되어 빨간 문에서 몰려오는 적을 상대하며, 놓친 적은 목표의 생명력을 감소시킵니다. 본 프로젝트는 이 게임플레이를 브라우저에서 재현했으며, 규칙과 수치는 가능한 한 공식 데이터 테이블 및 PRTS를 대조하여 구현했습니다.

「위수협의: 맹약」은 오토체스 + 타워 디펜스 게임입니다. 정비 기간에는 지휘 센터에서 오퍼레이터를 모집하고, 진형을 구성하며, 장비를 배치합니다. 전투 기간에는 오퍼레이터가 자동으로 배치되어 빨간 문에서 몰려오는 적을 상대하며, 놓친 적은 목표의 생명력을 감소시킵니다. 본 프로젝트는 이 게임플레이를 브라우저에서 재현했으며, 규칙과 수치는 가능한 한 공식 데이터 테이블 및 PRTS를 대조하여 구현했습니다.

- **싱글 시뮬레이션**(1인)과 **동맹 시뮬레이션**(1–4인 **협동**, PvP 없음, 빈 자리는 AI 팀원을 추가할 수 있음).
- 서버는 Node.js 프로그램이며, **전투는 각 플레이어의 브라우저에서 시뮬레이션**됩니다(공식과 동일). 서버는 경제와 라운드만 관리하므로 저전력 소형 PC 한 대로도 서버를 열 수 있습니다.
- 현재 버전은 0.1.3입니다. 0.1.1 릴리스 이후 GitHub에 보고된 문제를 수정했으며, 자세한 내용은 [CHANGELOG.md](CHANGELOG.md)를 참조하십시오. 아직 일부 규칙은 추론을 바탕으로 구현되어 있으며, 공식과 일치하지 않는 부분은 Issue로 알려주시면 감사하겠습니다.

## 기능 개요

- **한 판의 전체 진행**: 이번 판 정보 확인 → 전략 선택(40개 전략) → 14라운드 → 칭호 정산. 위험 난이도 이상에서 조건을 만족하면 15라운드 「비밀 핵심」으로 진입합니다.
- **4가지 난이도**: 표준 / 위험 / 절망 / 궁극. 싱글과 동맹에 각각 별도의 파라미터가 적용되며 모두 공식 데이터를 기반으로 합니다.
- **정비 기간**: 모집, 새로고침, 동결, 지휘 센터 업그레이드. 정비 구역과 임시 정비 구역이 있으며, 정비 구역에서 체스판으로 드래그하여 배치하고 **방향 휠**로 방향을 선택합니다. 동맹 시뮬레이션에서는 카드 풀이 공유됩니다.
- **정예 승급**: 같은 오퍼레이터 3명을 자동으로 합성하여 정예로 만들고, 한 단계 높은 등급의 무료 모집을 한 번 얻습니다.
- **오퍼레이터 및 편성**: 모집 가능한 오퍼레이터 112명(+ 정예)과 그들의 스킬, 재능 및 특성을 지원합니다. 게임 시작 전에 각 오퍼레이터가 사용할 스킬(총 283개 스킬을 모두 수작업으로 구현)과 정예의 모듈을 선택할 수 있습니다.
- **맹약 및 중첩**: 23개의 맹약(8개 세력 핵심 맹약 + 추가 맹약)을 지원합니다. 중첩 수는 한 판 전체에서 유지되며, 각 맹약은 최대 999중첩입니다.
- **장비 및 기변**: 장비와 주문을 사용하며, 같은 이름의 장비를 합성하고 특정 조합으로 맹약 효과를 부여할 수 있습니다. 이미 장착한 장비는 오퍼레이터에게 귀속됩니다. 일부 라운드 시작 전에는 기변 카드(장비, 자금, 오퍼레이터, 중첩, 현상금 등)를 선택할 수 있습니다.
- **자동 전투**: 스킬은 공식 「스킬 전략」에 따라 자동으로 발동합니다. 접촉 반경에 따라 저지하며, 저지 중인 오퍼레이터가 쓰러지면 접촉 중인 다른 오퍼레이터가 대신합니다. 원소 피해와 원소 폭발을 지원하며, 소환물은 플레이어가 직접 배치합니다. 밀치기 / 당기기는 힘과 무게를 기준으로 계산하고, 쓰러진 오퍼레이터는 그 자리에 남아 재배치 대기 시간을 표시합니다.
- **지형 및 적**: 방벽, 사격대, 오리지늄 유체 송풍기, 늪, 배기 그릴, 만조 등의 지형 장치를 지원합니다. 공중 및 지면 근처 부유 적, 현상금 적도 포함됩니다.
- **공동 방어**: 한 사람이 적을 놓치고 다른 사람이 완벽 작전을 달성한 경우, 완벽 작전을 달성한 팀원이 자신의 편성과 함께 놓친 적을 가로막으러 갑니다.
- **최종 공세 및 비밀 핵심**: 두 사람이 하나의 전장을 공유하며, 모든 팀원이 하나의 리더 체력 게이지를 함께 감소시킵니다. 10명의 적 리더와 약 5×3칸의 피격 범위를 가진 거대 리더, 그리고 공식 제한 피해 규칙을 지원합니다.
- **정산 칭호**: 위수의 별, 불멸의 맹약, 견고부동 등을 포함한 6개의 칭호.
- **접속 끊김 후 재접속**: 동맹 시뮬레이션은 접속이 끊긴 후 10분 이내에 페이지를 다시 열면 원래 자리로 돌아갈 수 있습니다. 접속이 끊긴 동안에는 기존 편성으로 자동 전투를 진행하며, 「잠시 자리 비우기」를 선택해 AI에게 맡길 수도 있습니다. 싱글 시뮬레이션은 24시간 이내에 같은 브라우저에서 돌아와 계속할 수 있습니다.
- **상호작용 세부 사항**: 적을 놓치면 상단의 목표 생명력이 실시간으로 감소합니다(최종 수치는 정산 시 확정). 선택, 드래그 앤 드롭, 장비 배치는 모두 바닥의 격자를 기준으로 합니다. 구매, 업그레이드 및 기변 카드 선택은 두 번 클릭하여 확인해야 합니다. 플레이어가 한 명뿐인 경우 전투 외에는 시간이 흐르지 않습니다.
- **그래픽 및 사운드**: 실제 Spine 캐릭터, 공식 BGM 및 효과음, 이모트(6세트 × 6개), 전투 효과를 지원합니다. 선택적으로 공식 3D 체스판을 사용할 수 있습니다(로컬 클라이언트에서 텍스처를 추출해야 합니다).
- **모바일 및 PC**: 터치 드래그와 길게 눌러 상세 정보 보기를 지원하며, 가로 화면을 권장합니다. 설정에서 그래픽 품질을 낮출 수 있습니다.

## 빠른 시작

### 방법 1: 통합 패키지 (권장)

통합 패키지에는 코드, 실행에 필요한 의존성 및 모든 미술 / 오디오 소재(공식 3D 체스판 텍스처 포함)가 이미 들어 있으므로 압축을 풀기만 하면 바로 플레이할 수 있으며, 별도로 다운로드할 필요가 없습니다.

통합 패키지에는 코드, 실행에 필요한 의존성 및 모든 미술 / 오디오 소재(공식 3D 체스판 텍스처 포함)가 이미 들어 있으므로 압축을 풀기만 하면 바로 플레이할 수 있으며, 별도로 다운로드할 필요가 없습니다.

1. **Node.js 22 또는 24 (LTS) 설치**
   - Windows: PowerShell에서 `winget install OpenJS.NodeJS.LTS`를 실행하거나 <https://nodejs.org/zh-cn/download>에서 설치 프로그램을 다운로드합니다.
   - macOS: `brew install node@22`를 실행하거나 공식 웹사이트에서 설치 프로그램을 다운로드합니다.
   - Linux: 배포판의 패키지 관리자, nvm 또는 fnm을 사용합니다.
2. **다운로드**: [Releases](../../releases/latest) 페이지에서 최신 버전(v0.1.3)의 통합 패키지(zip)를 다운로드하고, 경로가 짧은 폴더에 압축을 풉니다(Windows에서는 OneDrive 동기화 폴더에 넣지 않는 것을 권장합니다).
3. **실행**
   - Windows: **`scripts\\start-windows.bat`**를 더블 클릭합니다. 「보안 경고」가 표시되면 「실행」을 클릭합니다. Windows 방화벽 팝업에서는 「개인 네트워크」를 선택하고 허용합니다.
   - macOS / Linux: 압축을 푼 폴더에서 `./scripts/start.sh`(또는 `bash scripts/start.sh`)를 실행합니다.
4. 브라우저가 자동으로 `http://localhost:3000`을 엽니다. 창에 표시된 LAN 주소를 같은 네트워크의 친구에게 바로 공유할 수 있습니다. 창을 닫거나 `Ctrl+C`를 누르면 서버가 중지됩니다.

### 방법 2: 소스 코드에서 실행

```bash
git clone https://github.com/sganggs/Stronghold-Protocol.git
cd Stronghold-Protocol
npm install        # 安装依赖（postinstall 会把 pixi / preact / three 复制到 public/vendor）
npm run setup      # 检查环境，并从公开镜像下载约 270 MB 美术 / 音频（可中断，再次运行会续传）
npm start          # 启动服务器：http://localhost:3000
```

시작 스크립트(Windows `scripts\start-windows.bat`, macOS / Linux `scripts/start.sh`)를 직접 실행할 수도 있습니다. 처음 실행할 때 자동으로 의존성을 설치하고 소재를 다운로드한 뒤 서버를 시작하고 브라우저를 엽니다.

시작 스크립트(Windows `scripts\\start-windows.bat`, macOS / Linux `scripts/start.sh`)를 직접 실행할 수도 있습니다. 처음 실행할 때 자동으로 의존성을 설치하고 소재를 다운로드한 뒤 서버를 시작하고 브라우저를 엽니다.

- **로컬 클라이언트 소재(선택 사항)**: 공식 3D 체스판, 일부 공식 인터페이스 아이콘(대화 버튼 및 표정 패널 테두리, 모듈형 아이콘 등)과 화열 / 초열 원석충의 공식 모델은 로컬의 《명일방주》 PC 클라이언트에서 추출해야 합니다(Windows 네이티브 클라이언트, macOS의 CrossOver 또는 PlayCover). `npm run setup`이 클라이언트를 감지하면 추출 여부를 묻습니다(Python 3.8+ 필요, 의존성은 프로젝트 내부의 `.venv-extract`에 설치되어 시스템에는 영향을 주지 않음). 이후 `node tools/setup.mjs --local`로 다시 추출하거나 `--game "<…/StreamingAssets/AB/Windows>"`로 경로를 지정할 수 있습니다. 클라이언트가 없으면 자동으로 2D 체스판을 사용하며, 다른 기능에는 영향을 주지 않습니다. 대신 사용할 스타일: 2D 체스판, 비슷한 아이콘, 염색된 일반 원석충. 표정과 「플레이 방법」 튜토리얼 이미지는 공개 미러에서 함께 다운로드되므로 클라이언트가 없어도 됩니다. 클라이언트가 없는 서버(예: Linux VPS)도 **같은 버전**의 통합 패키지에서 `public/assets/local/` 및 `data/local-assets.json`을 복사해 사용할 수 있습니다. 자세한 내용은 [docs/DEPLOY.md](docs/DEPLOY.md)의 「로컬 클라이언트 소재」를 참조하십시오.
- 소재 다운로드는 GitHub를 우선 사용하며, 실패하면 자동으로 jsDelivr 미러로 전환합니다.
- `npm run doctor`(즉 `node tools/doctor.mjs`)를 언제든 실행하여 Node 버전, 소재의 완전성, 포트 사용 여부, LAN 주소 및 방화벽을 진단할 수 있습니다.

### 시스템 요구 사항

| 항목 | 요구 사항 |
|---|---|
| 서버를 실행하는 컴퓨터 | Windows / macOS / Linux, Node.js 22 또는 24 (LTS); 디스크 약 400–500 MB(소재, 의존성 및 선택적 로컬 추출 텍스처); 여유 메모리 약 100 MB, 게임 한 판당 몇 MB 추가 |
| 플레이어 | WebGL을 지원하는 최신 브라우저(Chrome / Edge / Firefox / Safari 최신 버전), PC·휴대폰·태블릿(가로 화면) |
| 네트워크 | 게임에 처음 접속할 때 각 플레이어가 서버 컴퓨터에서 수십 MB의 소재를 다운로드합니다(이후에는 브라우저 캐시 사용). 게임 중 네트워크 트래픽은 매우 적습니다. |

그래픽 카드가 약한 경우 「설정」에서 화질을 낮추거나 URL 뒤에 `?board=2d`(2D 체스판 강제 사용) / `?render=fallback`(WebGL을 사용하지 않는 간소화 화면)를 추가할 수 있습니다.

### 포트 및 설정

기본적으로 **TCP 3000** 포트를 수신합니다. 포트를 변경하려면 시작 스크립트에 `--port 3001`을 추가하거나 환경 변수 `PORT`를 설정합니다.

| 환경 변수 | 기본값 | 설명 |
|---|---|---|
| `PORT` | `3000` | 수신 포트 |
| `HOST` | `0.0.0.0` | 수신 주소 (`127.0.0.1` = 로컬 컴퓨터만 허용, 리버스 프록시 뒤에서 사용할 때) |
| `SP_COMBAT` | `client` | `client`: 각 플레이어의 브라우저에서 자신의 전투를 시뮬레이션(서버 부하가 매우 낮음); `server`: 서버에서 시뮬레이션하여 스트리밍 |
| `SP_VERIFY` | `off` | 서버가 클라이언트에서 보고한 전투 결과를 재계산: `off` / `sample`(약 1/8 무작위 검사) / `all`(전체 재계산, CPU 사용량 증가) |
| `TRUST_PROXY` | `auto` | `X-Forwarded-For` 등의 전달 헤더를 신뢰할지 여부: `auto`는 로컬 / 내부 네트워크에서 온 프록시만 신뢰; `1`은 항상; `0`은 절대 신뢰하지 않음 |
| `DEBUG` | 비어 있음 | 임의의 값으로 설정하면 상세 로그 출력 |
| `SP_NO_BROWSER` | 비어 있음 | `1`로 설정하면 시작 스크립트가 브라우저를 자동으로 열지 않음 |

설정 방법: macOS / Linux `PORT=8080 npm start`; PowerShell `$env:PORT=8080; npm start`; cmd `set "PORT=8080" && npm start`. 상태 확인: `GET /healthz`.

### 친구와 함께 플레이 (LAN)

1. 페이지를 열고 → 닉네임 입력 → **동맹 시뮬레이션** → 방 만들기를 선택합니다. 방장이 난이도를 선택하고 AI 팀원을 추가 / 제거할 수 있습니다.
2. 4자리 영문 **동맹 키** 또는 「링크 복사」로 얻은 `http://<주소>:3000/?room=키`를 친구에게 공유합니다.
3. 모두가 「준비 완료」를 누르면 방장이 시작합니다.
4. 같은 Wi-Fi / 라우터에 연결된 친구는 시작 창에 표시된 주소(예: `http://192.168.x.x:3000`)를 열면 됩니다. 열리지 않는 경우 대부분 방화벽 문제입니다. Windows 최초 실행 시 팝업에서 「개인 네트워크」를 허용하거나 `npm run doctor`를 실행하여 구체적인 명령을 확인하십시오. 게스트 Wi-Fi에서는 「AP 격리」가 활성화되어 있어 접속할 수 없는 경우도 있습니다.

페이지를 새로 고치거나 접속이 끊긴 경우, 동맹 시뮬레이션은 10분 이내, 싱글 시뮬레이션은 24시간 이내에 다시 열면 원래 자리로 돌아갈 수 있습니다. 서버는 방과 게임을 메모리에 저장하므로 **서버를 재시작하면 모든 게임이 종료됩니다**.

## 온라인 플레이 방법

친구가 같은 LAN에 있지 않은 경우 아래와 같은 일반적인 방법을 사용할 수 있습니다. 자신의 상황에 맞는 방법을 하나 선택하면 됩니다. 여기서는 간단한 소개만 제공하며, 언급된 도구와 서비스는 예시일 뿐 본 프로젝트와 아무런 관계가 없고 추천하는 것도 아닙니다. 구체적인 설치, 비용 및 사용 규칙은 각 서비스의 공식 안내를 따르십시오. 배포 세부 사항(방화벽, 부팅 시 자동 실행, 리버스 프록시 및 HTTPS, Docker)은 **[docs/DEPLOY.md](docs/DEPLOY.md)**를 참조하십시오.

| 방법 | 방법 | 적합한 경우 |
|---|---|---|
| **같은 LAN 직접 연결** | 시작 창의 LAN 주소를 친구에게 공유 | 같은 집, 기숙사 또는 PC방 |
| **네트워크 구성 도구(가상 LAN)** | 예: Tailscale, ZeroTier, EasyTier, 蒲公英. 서버를 여는 사람과 친구가 같은 도구를 설치하고 같은 네트워크에 가입한 뒤, 친구가 서버 컴퓨터의 가상 IP로 `http://<가상 IP>:3000`에 접속 | 정해진 몇 명의 지인과 플레이할 때; 인터넷에 직접 노출하지 않음. 친구도 클라이언트를 설치해야 하며 일부 도구는 계정 등록이 필요합니다. 지역이 멀 경우 릴레이를 거쳐 느려질 수 있음 |
| **NAT 통과 / 터널** | 서버를 여는 사람만 클라이언트를 실행하고 친구는 URL을 바로 엽니다. 예: 직접 구축한 frp(공인 IP 서버 필요), Cloudflare의 `cloudflared tunnel --url http://localhost:3000`(임시 주소이며 실행할 때마다 변경됨; 중국 내 접속 시 지연이 높을 수 있음), 중국의 Sakura frp와 같은 공개 터널 서비스(일반적으로 실명 인증이 필요하며 중국 본토 노드에서 웹페이지를 제공할 경우 ICP 등록 요구 사항이 있을 수 있음) | 라우터를 변경하고 싶지 않거나 공인 IP가 없는 경우. 무료 회선은 대역폭이 제한적이며 처음 소재를 로드할 때 느릴 수 있음 |
| **클라우드 서버 / VPS 직접 배포** | VPS에서 통합 패키지를 실행하거나 저장소에 포함된 `Dockerfile`을 사용합니다. Caddy / Nginx로 HTTPS를 추가합니다. 플레이어와 가깝고 회선이 좋은 지역을 선택하십시오(중국 본토 플레이어를 대상으로 할 경우 해외 데이터센터의 귀환 경로에 주의해야 하며, 그렇지 않으면 저녁 피크 시간대에 지연이 매우 높아질 수 있음; 중국 본토 서버에 도메인을 연결하려면 ICP 등록이 필요함) | 장기간 서버를 운영하고 플레이어가 서로 다른 지역에 분포한 경우 |

일반적인 주의 사항:

- 게임은 **단일 상주 Node.js 프로세스 + WebSocket**(`/ws` 경로)로 구성되며 하나의 인스턴스만 실행할 수 있고 도메인 루트 경로에 배포해야 합니다. Vercel과 같은 Serverless 플랫폼이나 GitHub Pages와 같은 정적 호스팅은 사용할 수 없습니다. 리버스 프록시는 WebSocket 업그레이드를 전달해야 합니다.
- 게임에는 계정 시스템이 없으므로 **주소를 아는 사람은 누구나 접속할 수 있습니다**. 주소는 친구에게만 공유하고 공개적으로 게시하거나 공개 로비를 만들지 마십시오. 이는 소재 저작권과 관련된 위험도 낮출 수 있습니다.
- 공인 IPv4가 있다면 라우터에서 포트 포워딩을 설정할 수도 있지만, 이는 집의 컴퓨터를 인터넷에 직접 노출시키므로 위의 방법을 우선 고려하십시오.

## 조작

| 조작 | 방법 |
|---|---|
| 구매 / 지휘 센터 업그레이드 / 기변 카드 선택 | 한 번 클릭하여 선택하고 다시 한 번 클릭하여 확인 (`D` 업그레이드) |
| 오퍼레이터 배치 / 이동 | 정비 구역에서 체스판 칸으로 드래그 → 방향 휠 표시 → 위 / 오른쪽 / 아래 / 왼쪽으로 슬라이드하여 방향을 선택한 뒤 놓습니다. 중앙에서 놓거나 「✕ 클릭하여 취소」를 누르면 취소됩니다. 드래그 중 모델은 포인터 / 손가락 아래에 표시되며 포인터가 있는 칸이 배치 위치입니다. |
| 방향 조정 | 오퍼레이터를 자신의 칸으로 다시 드래그한 뒤 방향을 선택합니다. |
| 판매 / 철수 / 장비 파괴 | 유닛이 있는 칸을 클릭 → 하단 버튼 「판매 +1」「철수」. 체스판의 오퍼레이터를 정비 구역으로 드래그하여 철수할 수도 있습니다. 정비 구역의 장비와 주문은 「파괴」만 가능하며, 이미 장착된 장비는 오퍼레이터에게 귀속됩니다(오퍼레이터를 판매하거나 정예로 합성하면 정비 구역으로 돌아옵니다). |
| 장비 | 장비를 오퍼레이터가 있는 칸으로 드래그합니다(1인당 2개. 가득 차면 교체 창이 나타나며 교체된 장비는 파괴됩니다). 주문은 지형으로 드래그한 뒤 방향을 선택합니다. |
| 상세 정보 보기 | 유닛 / 카드를 우클릭하거나 길게 누릅니다(능력치는 실시간 수치이며 기본값보다 높으면 녹색, 낮으면 빨간색으로 표시됩니다). |
| 단축키 | `R` 새로고침 · `F` 동결 · `D` 업그레이드 · `Space` 준비 완료 · `Esc` 취소 / 닫기 |
| 방향 휠 키보드 조작 | 방향키로 미리 보기 · `Enter` 확인 · `Esc` 취소 |
| 일시정지 (싱글 시뮬레이션) | 전투 중(최종 공세 / 비밀 핵심 포함) 상단의 「일시정지」를 클릭하거나 `Space`를 누른 뒤, 「전투 계속」(또는 `Space`)을 눌러 계속합니다. 동맹 시뮬레이션의 전투는 일시정지할 수 없습니다. |
| 이모트 | 왼쪽 아래의 「교류」를 누르고 좌우로 슬라이드(또는 방향키)하여 테마를 변경합니다. 재사용 대기 시간은 1초입니다. |
| 관전 | 자신의 전투가 끝난 후(또는 정비 기간) 왼쪽의 팀원 아바타를 클릭 → 「보러 가기」 |

전체 규칙, 수치 및 팁은 **[docs/PLAYING.md](docs/PLAYING.md)**를 참조하십시오(게임 내 왼쪽 아래에도 「게임플레이 설명」이 있습니다).

## 문서

| 문서 | 내용 |
|---|---|
| 문서 | 내용 |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | 변경 기록: 각 버전에서 수정된 사항과 확인 결과 문제가 아니었던 피드백 |
| [docs/PLAYING.md](docs/PLAYING.md) | 게임플레이 가이드: 진행 과정, 경제, 모집 및 승급, 진형 구성, 공동 방어, 맹약, 최종 공세, 정산 칭호 |
| [docs/DEPLOY.md](docs/DEPLOY.md) | 배포 가이드: Windows 서버 실행 및 부팅 시 자동 실행, 방화벽, 네트워크 구성 / 터널, 리버스 프록시 및 HTTPS, Docker, systemd, 문제 해결 |
| [docs/WINDOWS.md](docs/WINDOWS.md) | Windows 포터블 번들: 「설치 없는」 번들을 만드는 방법(`scripts/make-windows-bundle.mjs`), 번들에 포함된 항목, 라이선스 주의사항 |
| [docs/DESIGN.md](docs/DESIGN.md) | 아키텍처 및 계약(영문): 기술 스택, 디렉터리 역할, 네트워크 프로토콜, 렌더링 및 UI, 각 테스트 플레이 후 규칙 수정 사항 |
| [docs/SIM.md](docs/SIM.md) | 전투 시뮬레이션 엔진 참고(영문): 훅, 스킬 설명 형식, 직군 기본 행동 |
| [docs/META.md](docs/META.md) | 게임 및 경제 엔진(영문): 라운드 진행, 상점, 공동 방어, 최종 공세의 구현 세부 사항 |
| [docs/DATA.md](docs/DATA.md) | 공식 데이터 테이블에서 생성된 게임 데이터(영문) |
| [docs/ASSETS.md](docs/ASSETS.md) | 소재 출처, 디렉터리 구조 및 목록(영문) |
| [docs/BALANCE.md](docs/BALANCE.md) | 난이도 모델 및 측정(영문) |
| [docs/research/](docs/research/00-INDEX.md) | 공식 규칙, 데이터 및 인터페이스 조사 기록 |

## 개발 및 테스트

```bash
npm run dev                 # node --watch：改动服务器代码后自动重启
node --test                 # 单元 + 集成测试（约 3170 项；缺少素材 / 浏览器的用例会自动跳过）
SP_E2E=1 node --test test/ui/mock.e2e.test.js        # 浏览器端到端测试，需要本机 Chrome（CHROME_PATH 可指定路径）
SP_REAL_E2E=1 node --test test/ui/real.e2e.test.js   # 需要 Chrome + 已下载的素材
RENDER_E2E=1 node --test 'test/render/*.browser.test.js'   # 渲染测试，部分需要本地提取的棋盘贴图
```

- 게임 데이터는 `npm run build-data`(`tools/build-data.mjs`)를 통해 공식 데이터 테이블에서 생성됩니다. `data/*.json`을 수동으로 수정하지 마십시오.
- GitHub Actions([.github/workflows/ci.yml](.github/workflows/ci.yml))는 Ubuntu 및 Windows, Node 22 / 24에서 `npm ci`, `node --test` 및 서버 스모크 테스트를 실행합니다.

## 프로젝트 구조

| 경로 | 내용 |
|---|---|
| `server/` | Node HTTP 정적 서비스 + WebSocket(`/ws`), 로비, 게임 엔진(`match/`), 전투 시뮬레이션(`sim/`, 브라우저와 서버가 공유) |
| `shared/` | 프론트엔드와 백엔드가 공유하는 상수 및 네트워크 프로토콜 |
| `public/` | 브라우저 클라이언트(네이티브 ES 모듈, PixiJS + pixi-spine, three.js 3D 체스판, Preact + htm UI) |
| `data/` | 공식 데이터 테이블에서 생성된 게임 데이터 및 소재 목록 `assets.json` |
| `tools/` | `setup.mjs` / `doctor.mjs`, 소재 다운로드 `fetch-assets.mjs`, 데이터 빌드, 로컬 추출 `local-extract/` |
| `scripts/` | 시작 스크립트(Windows / macOS / Linux), Windows 부팅 시 자동 실행 |
| `docs/` | 문서 및 조사 |
| `test/` | `node:test` 테스트 |

## 라이선스

- **코드**: 본 프로젝트에서 직접 작성한 코드는 **GPL-3.0-or-later**로 배포되며, 전문은 [LICENSE](LICENSE)를 참조하십시오. 또한 GPL 제7조에 대한 추가 허가가 제공되어 pixi-spine의 Spine Runtimes와 함께 배포할 수 있습니다([NOTICE.md](NOTICE.md) 참조).
- **게임 소재는 라이선스 범위에 포함되지 않습니다**: 《명일방주》와 관련된 일러스트, 음악, 음향 효과, 텍스트 및 데이터 등의 저작권은 원 권리자에게 있으며 GPL이 적용되지 않습니다. 사용 제한은 위의 [고지사항](#고지사항) 및 [NOTICE.md](NOTICE.md)를 참조하십시오.
- **제3자 구성 요소**는 각각의 라이선스를 따릅니다. npm을 통해 설치되는 라이브러리(통합 패키지의 `node_modules`에 각각의 라이선스 파일 포함), `tools/local-extract/aklz4.py`의 알고리즘(BSD-3-Clause), 글꼴 등은 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)에서 목록과 라이선스 전문을 확인할 수 있습니다.

## 감사 및 데이터 출처

- 게임 데이터: [Kengxxiao/ArknightsGameData](https://github.com/Kengxxiao/ArknightsGameData).
- 소재 출처: [yuanyan3060/ArknightsGameResource](https://github.com/yuanyan3060/ArknightsGameResource), [fexli/ArknightsResource](https://github.com/fexli/ArknightsResource), [isHarryh/Ark-Models](https://github.com/isHarryh/Ark-Models), [ArknightsAssets/ArknightsAssets2](https://github.com/ArknightsAssets/ArknightsAssets2). 글꼴은 [TimWangZi/The-font-of-Arknights](https://github.com/TimWangZi/The-font-of-Arknights) 및 Google Fonts(Noto Sans SC)에서 가져왔습니다. 자세한 내용은 [docs/ASSETS.md](docs/ASSETS.md)를 참조하십시오.
- 규칙 확인 참고 자료: [PRTS 명일방주 중국어 Wiki](https://prts.wiki/).
- LZ4AK 압축 해제: `tools/local-extract/aklz4.py`의 알고리즘은 [isHarryh/Ark-Unpacker](https://github.com/isHarryh/Ark-Unpacker)(BSD-3-Clause, MooncellWiki/UnityPy 경유)에서 가져왔으며, Unity 리소스 분석에는 [UnityPy](https://github.com/K0lb3/UnityPy)(MIT)를 사용합니다.
- 라이브러리: [PixiJS](https://pixijs.com/)(MIT), [pixi-spine](https://github.com/pixijs/spine)(MIT; 포함된 Spine Runtime은 별도로 [Spine Runtimes License](https://esotericsoftware.com/spine-runtimes-license)의 적용을 받음), [three.js](https://threejs.org/)(MIT), [Preact](https://preactjs.com/) + [htm](https://github.com/developit/htm](MIT), [ws](https://github.com/websockets/ws)(MIT).

위 프로젝트의 제작자와 유지보수자, 그리고 이 게임을 만들어 준 하이퍼그리프에 감사드립니다.

## 기여

버그, 공식 규칙과 일치하지 않는 부분 또는 개선 제안은 Issue로 알려주시고, Pull Request 제출도 환영합니다:

버그, 공식 규칙과 일치하지 않는 부분 또는 개선 제안은 Issue로 알려주시고, Pull Request 제출도 환영합니다:

- 제출 전에 `node --test`를 실행하고 관련 문서도 함께 업데이트하십시오. 문서는 중국어 간체, 코드와 주석은 영어를 사용합니다.
- 제출된 코드는 GPL-3.0-or-later로 배포됩니다.
- 게임 소재 파일은 제출하지 마십시오(`public/assets/` 등의 디렉터리는 `.gitignore`에서 제외되어 있습니다).
- 한국어 패치 제공 https://arca.live/b/arknights/184879626?p=1
- 본 프로젝트는 비상업적 원칙을 유지합니다. 광고, 유료 기능, 후원 등 어떠한 형태의 수익화 기능도 제출하지 마십시오.

---

## English

An **unofficial, non-commercial fan remake** of Arknights' seasonal auto-chess tower-defense mode *Stronghold Protocol: Alliance*, played in the browser: solo, or 1–4 player co-op (AI teammates can fill seats). Combat is simulated in each player's browser, so a low-power PC can host.

- **Run:** download the all-in-one bundle from [Releases](../../releases/latest), install Node.js 22 or 24, then double-click `scripts\\start-windows.bat` (Windows) or run `./scripts/start.sh` (macOS / Linux) and open <http://localhost:3000>. From source: `npm install && npm run setup && npm start` (setup downloads ~270 MB of art from public mirrors, the emotes and the how-to-play pages included; the official 3D board, some official HUD icons and two enemy models are extracted from a local Arknights client — without one the game uses the 2D board and look-alike stand-ins, and a server can copy `public/assets/local/` and `data/local-assets.json` from the release bundle of the same version).
- **Play with friends:** create a co-op room and share the 4-letter key or the `?room=KEY` link. On a LAN, use the address printed at start; otherwise use a virtual-LAN tool, a tunnel or a VPS — see [docs/DEPLOY.md](docs/DEPLOY.md).
- **Disclaimer:** not affiliated with or endorsed by Hypergryph or Yostar. All Arknights names, art, audio, text and data are © their respective owners and are **not** covered by this project's GPL licence. For study and personal non-commercial use only — no selling, paid distribution, paid servers or monetisation of any kind. Content will be removed on request of the rights holders. Provided "as is", without warranty.
- **License:** code GPL-3.0-or-later ([LICENSE](LICENSE)); game assets excluded.
