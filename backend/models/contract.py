from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# 결제 수단 옵션 (프론트와 동일하게 유지)
PAYMENT_METHODS = [
    "bank_transfer",   # 계좌이체
    "card",            # 카드결제
    "government_aid",  # 정부지원금
]

# 계약 상태
CONTRACT_STATES = [
    "active",      # 진행 중
    "completed",   # 완료 (모두 입금 받음)
    "cancelled",   # 취소
]


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    estimate_id = Column(
        Integer,
        ForeignKey("saved_estimates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = Column(String(300), nullable=False, default="")
    contract_amount = Column(Float, nullable=False, default=0)
    contract_date = Column(String(20), nullable=False, default="")
    state = Column(String(30), nullable=False, default="active")
    tax_invoice_issued = Column(Boolean, nullable=False, default=False)
    memo = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    payments = relationship(
        "Payment",
        back_populates="contract",
        cascade="all, delete-orphan",
        order_by="Payment.paid_at",
    )


class Payment(Base):
    __tablename__ = "contract_payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    contract_id = Column(
        Integer,
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Float, nullable=False, default=0)
    paid_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    method = Column(String(30), nullable=False, default="bank_transfer")
    memo = Column(Text, nullable=False, default="")
    handler = Column(String(100), nullable=False, default="")  # 입금 받은 담당자
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    contract = relationship("Contract", back_populates="payments")
