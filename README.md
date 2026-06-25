# 서울 25개구 식중독 위험지도

서울특별시 식중독 위험도 API 데이터를 외부에서 볼 수 있는 웹앱입니다.

## 로컬 실행

```powershell
node server.js
```

주소:

```text
http://localhost:3000
```

## 외부 공개 방법

### Render

1. GitHub에 이 폴더를 저장소로 올립니다.
2. Render에서 `New Web Service`를 선택합니다.
3. 저장소를 연결합니다.
4. 설정은 자동 감지되며, 필요하면 아래처럼 입력합니다.

```text
Build Command: 비워둠
Start Command: node server.js
```

배포 후 Render가 `https://...onrender.com` 주소를 제공합니다.

### Railway / Heroku 계열

`Procfile`이 포함되어 있어서 Node 웹 서비스로 바로 실행할 수 있습니다.

```text
web: node server.js
```

## 포함 화면

- `/` 지도형 대시보드
- `/verify.html` 서울특별시 데이터 검증표
- `/api/seoul-risk` 식약처 API 프록시
