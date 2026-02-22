# 컨빌 디자인 — 견적서 자동 생성 시스템

인테리어 설계 회사 **컨빌 디자인**의 견적서 자동 생성 웹 애플리케이션입니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| 문서 출력 | openpyxl (Excel) + reportlab (PDF) |
| DB | SQLite (예정) |

---

## 프로젝트 구조

```
convil-estimate/
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── types/estimate.ts  # TypeScript 타입 정의
│   │   ├── utils/calculate.ts # 가격 계산 로직
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── EstimateForm.tsx    # 입력 폼
│   │   │   └── EstimatePreview.tsx # 실시간 미리보기
│   │   └── pages/EstimatePage.tsx
│   └── package.json
│
├── backend/                   # FastAPI 백엔드
│   ├── main.py                # 앱 진입점
│   ├── models/estimate.py     # Pydantic 모델
│   ├── services/
│   │   ├── calculate.py       # 가격 계산
│   │   ├── excel_service.py   # Excel 생성
│   │   └── pdf_service.py     # PDF 생성
│   ├── routers/estimate.py    # API 라우터
│   ├── templates/             # Excel 템플릿 폴더
│   └── requirements.txt
│
├── start.bat                  # Windows 한 번에 실행
└── README.md
```

---

## 실행 방법

### 방법 1: 자동 실행 (Windows)
```
start.bat 더블클릭
```

### 방법 2: 수동 실행

#### 백엔드 (FastAPI)
```bash
cd backend
# Python PATH 설정 (처음 한 번만)
# Windows: C:\Users\{사용자}\AppData\Local\Programs\Python\Python312 을 PATH에 추가

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

백엔드 실행 확인: http://localhost:8000/docs

#### 프론트엔드 (React + Vite)
```bash
cd frontend
# Node.js PATH 설정 (처음 한 번만)
# Windows: C:\Program Files\nodejs 를 PATH에 추가

npm install
npm run dev
```

프론트엔드 실행 확인: http://localhost:3000

---

## API 문서

백엔드 실행 후 http://localhost:8000/docs 에서 Swagger UI로 API 확인 가능

### 주요 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/estimate/generate-excel | Excel 견적서 생성 & 다운로드 |
| POST | /api/estimate/generate-pdf | PDF 견적서 생성 & 다운로드 |
| POST | /api/estimate/calculate | 금액 계산 (JSON 응답) |

---

## 요금 체계

### 단건 의뢰 단가표

| 평수 구간 | 평면도 | 천장도 | 3D 시안 |
|----------|--------|--------|---------|
| 10평 미만 | 99,000 | 178,000 | 450,000 |
| 10평대 | 149,000 | 268,000 | 550,000 |
| 20평대 | 169,000 | 320,000 | 850,000 |
| 30평대 | 189,000 | 366,000 | 1,150,000 |
| 40평대 | 289,000 | 388,000 | 1,550,000 |
| 50평대 | 359,000 | 456,000 | 2,050,000 |

### 패키지 가격 (평면도+천장도+3D+마감재리스트)

| 평수 구간 | 비대면 패키지 |
|----------|-------------|
| 10평 미만 | 743,400 |
| 10평대 | 1,004,400 |
| 20평대 | 1,357,200 |
| 30평대 | 1,704,600 |
| 40평대 | 2,264,400 |
| 50평대 | 2,901,600 |
| 60~90평 | 50평대 기준가 + 10평당 650,000 |
| 100~200평 | 90평대 기준가 + 10평당 800,000 |

### 출장/실측비

| 지역 | 비용 |
|------|------|
| 서울/인천/대전/경남 | +250,000 |
| 그 외 지역 | +340,000 |
| 비대면 | 무료 |

### 기타 옵션
- 브랜딩 플러스: +2,000,000원

### 최종 금액 계산
```
Subtotal = 서비스 금액 + 출장비 + 브랜딩 + 추가항목
Total    = Subtotal - 할인
VAT      = Total × 10%
최종     = Total + VAT
```

---

## Excel 템플릿 교체

실제 컨빌 디자인 Excel 템플릿을 사용하려면:
1. `backend/templates/` 폴더에 `estimate_template.xlsx` 파일을 복사
2. 백엔드가 해당 템플릿을 자동으로 사용 (없으면 자동 생성)

---

## 환경 요구사항

- Node.js v20 이상
- Python 3.12 이상
- Windows / macOS / Linux

---

## 개발 환경 구성 (참고)

```bash
# Node.js PATH 영구 등록 (PowerShell 관리자 권한)
[System.Environment]::SetEnvironmentVariable("PATH",
  $env:PATH + ";C:\Program Files\nodejs",
  [System.EnvironmentVariableTarget]::User)

# Python PATH 영구 등록
[System.Environment]::SetEnvironmentVariable("PATH",
  $env:PATH + ";C:\Users\{사용자}\AppData\Local\Programs\Python\Python312",
  [System.EnvironmentVariableTarget]::User)
```

---

© 2024 컨빌 디자인 | www.convil.net
