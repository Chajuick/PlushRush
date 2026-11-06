# 배포와 버전 관리

## 최초 Vercel 연결

1. Vercel에서 Add New → Project → GitHub의 `Chajuick/PlushRush`를 가져온다.
2. Root Directory는 저장소 루트, Framework는 Vite, Build Command는 `npm run build`, Output Directory는 `dist`로 둔다. `vercel.json`에도 설정되어 있다.
3. Production Branch를 `main`으로 지정하고 Deploy한다. 별도 비밀키는 게임 실행에 필요하지 않다.
4. 완료된 Production URL에서 인트로, 스킵, 게임 시작, 좌우 이동과 점프를 확인한다.

Git 연동 후 main 푸시는 Vercel 자동 프로덕션 배포를 트리거한다. GitHub Actions는 설치·문법·빌드 검사이며 Vercel 배포 성공을 보장하지 않는다. Vercel 연결과 실제 공개 URL 검증 전에는 배포 완료로 보고하지 않는다.

## 이후 굵직한 작업의 릴리스 절차

사용자가 주요 작업 완료마다 배포하도록 요청했다. 이 저장소에서 이어 작업할 때 아래 절차를 따른다.

1. 변경을 완료하고 `npm run check`, `npm run build`, 관련 브라우저 동작을 검증한다.
2. `npm version patch --no-git-tag-version`으로 버전을 올린다. 큰 변경은 적절한 minor/major를 선택하고 변경 내용을 기록한다.
3. 변경 및 lockfile을 커밋해 main에 푸시한다. 기존 사용자 변경을 보존하고 관련 없는 파일을 섞지 않는다.
4. 연결된 Vercel 배포가 Ready인지 확인하고 Production URL에서 새 버전과 기능을 검증한다. 실패하면 로그를 조사한다.
5. 사용자에게 버전·배포 URL·검증 결과를 알린다. 연결 정보나 권한이 없으면 그 부분만 차단 상태로 명시한다.

## 새 버전 알림

빌드마다 package 버전, 커밋, 빌드 시각으로 release ID를 생성한다. 클라이언트 내 ID와 `/version.json`의 ID를 비교해 업데이트를 감지한다. 60초마다 또는 탭 복귀·포커스·온라인 복귀 시 확인한다. 네트워크 오류는 게임을 중단시키지 않는다.

새 빌드가 있으면 “새 버전이 나왔어요”를 표시한다. 나중에를 선택하면 그 빌드는 현재 탭에서 다시 알리지 않지만, 더 새로운 빌드는 다시 알린다. 적용 버튼은 `release` 쿼리로 캐시를 우회해 문서를 다시 요청한다. HTML 및 매니페스트는 no-store, 번들 파일명은 내용 해시를 사용한다. 브라우저의 강력 새로고침 단축키를 프로그램으로 실행하는 방식이 아니다.

적용 시 진행 중 게임은 재시작되며 localStorage 최고 기록은 보존한다. 서비스 워커·오프라인 캐시를 설치하지 않는다. 사용자가 다른 탭에서 플레이 중인 게임은 강제로 새로고침하지 않는다. 수동 배포 롤백도 현재 서버 릴리스와 다르면 알림 대상으로 간주한다.
