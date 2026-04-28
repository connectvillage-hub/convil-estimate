from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Payment ──

class PaymentInput(BaseModel):
    amount: float = Field(ge=0)
    paidAt: Optional[datetime] = None  # None 이면 현재 시각
    method: str = "bank_transfer"
    memo: str = ""


class PaymentResponse(BaseModel):
    id: int
    amount: float
    paidAt: str
    method: str
    memo: str


# ── Contract ──

class InitialPaymentInput(BaseModel):
    amount: float = Field(ge=0)
    method: str = "bank_transfer"
    paidAt: Optional[datetime] = None


class ContractInput(BaseModel):
    title: str = ""
    contractAmount: float = Field(ge=0)
    contractDate: str = ""  # YYYY-MM-DD
    estimateId: Optional[int] = None
    state: str = "active"
    taxInvoiceIssued: bool = False
    memo: str = ""
    # 계약 생성 시 동시에 입금 한 건 등록 (옵션)
    initialPayment: Optional[InitialPaymentInput] = None


class ContractDetail(BaseModel):
    id: int
    customerId: int
    estimateId: Optional[int]
    title: str
    contractAmount: float
    contractDate: str
    state: str
    taxInvoiceIssued: bool = False
    memo: str
    paidAmount: float       # 입금 합계
    remainingAmount: float  # 미수금 = 계약금액 - 입금합계
    createdAt: str
    updatedAt: str
    payments: List[PaymentResponse] = []
