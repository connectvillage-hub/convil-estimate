import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.estimate import router as estimate_router

app = FastAPI(
    title="컨빌 디자인 견적서 API",
    description="인테리어 설계 회사 컨빌디자인 견적서 자동 생성 시스템",
    version="1.0.0",
)

# CORS 설정
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# 배포 환경에서는 FRONTEND_URL 환경변수로 프론트엔드 도메인 추가
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(estimate_router)


@app.get("/")
async def root():
    return {
        "service": "컨빌 디자인 견적서 API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
