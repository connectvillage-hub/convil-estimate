from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# 문의 경로 (선택지 — 프론트와 동일하게 유지)
INQUIRY_SOURCES = [
    "instagram", "youtube", "blog", "naver", "referral",
    "ai", "sms", "outsourcing", "website", "danggn", "email", "other",
]

# 계약 상태 단계 (순서 의미 있음)
CONTRACT_STATUSES = [
    "pre_consultation",   # 상담 전
    "in_consultation",    # 상담 진행 중
    "estimate_sent",      # 견적 안내
    "contract_signed",    # 계약 완료
    "in_progress",        # 작업 진행
    "completed",          # 작업 완료
    "cancelled",          # 취소
]


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    company_name = Column(String(200), nullable=False, default="")
    phone = Column(String(50), nullable=False, default="")
    email = Column(String(200), nullable=False, default="")
    address = Column(String(500), nullable=False, default="")
    manager = Column(String(100), nullable=False, default="")
    memo = Column(Text, nullable=False, default="")
    inquiry_source = Column(String(50), nullable=False, default="other")
    contract_status = Column(String(50), nullable=False, default="pre_consultation")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    contacts = relationship(
        "Contact",
        back_populates="customer",
        cascade="all, delete-orphan",
        order_by="Contact.sequence",
    )


class Contact(Base):
    __tablename__ = "customer_contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence = Column(Integer, nullable=False)  # 1차, 2차, 3차...
    contacted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    content = Column(Text, nullable=False, default="")
    handler = Column(String(100), nullable=False, default="")  # 컨택 담당자
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="contacts")
