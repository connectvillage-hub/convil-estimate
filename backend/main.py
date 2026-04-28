import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.estimate import router as estimate_router
from routers.materials import router as materials_router
from routers.customers import router as customers_router
from routers.contracts import router as contracts_router
from routers.dashboard import router as dashboard_router
from routers.handlers import router as handlers_router

# ORM 모델 임포트 (테이블 생성용)
import models.material  # noqa: F401
import models.project  # noqa: F401
import models.saved_estimate  # noqa: F401
import models.customer  # noqa: F401
import models.contract  # noqa: F401

# DB 테이블 생성
Base.metadata.create_all(bind=engine)


def _migrate_schema():
    """기존 테이블에 누락된 컬럼 추가 (멱등). create_all 은 새 컬럼 추가 안 함."""
    from sqlalchemy import inspect, text
    inspector = inspect(engine)

    if "saved_estimates" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("saved_estimates")]
        if "customer_id" not in cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE saved_estimates ADD COLUMN customer_id INTEGER"))
                conn.commit()

    if "contracts" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("contracts")]
        if "tax_invoice_issued" not in cols:
            with engine.connect() as conn:
                # PostgreSQL/SQLite 둘 다 BOOLEAN 지원
                conn.execute(text(
                    "ALTER TABLE contracts ADD COLUMN tax_invoice_issued BOOLEAN NOT NULL DEFAULT FALSE"
                ))
                conn.commit()

    if "customer_contacts" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("customer_contacts")]
        if "handler" not in cols:
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE customer_contacts ADD COLUMN handler VARCHAR(100) NOT NULL DEFAULT ''"
                ))
                conn.commit()

    if "contract_payments" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("contract_payments")]
        if "handler" not in cols:
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE contract_payments ADD COLUMN handler VARCHAR(100) NOT NULL DEFAULT ''"
                ))
                conn.commit()


_migrate_schema()

app = FastAPI(
    title="컨빌 디자인 견적서 API",
    description="인테리어 설계 회사 컨빌디자인 견적서 자동 생성 시스템",
    version="2.0.0",
)

# CORS 설정
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://convil-estimate.vercel.app",
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
app.include_router(materials_router)
app.include_router(customers_router)
app.include_router(contracts_router)
app.include_router(dashboard_router)
app.include_router(handlers_router)


@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "service": "컨빌 디자인 견적서 API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# UptimeRobot 등 외부 모니터링 도구가 HEAD 요청을 보내는 경우가 있어 둘 다 지원
@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok"}
