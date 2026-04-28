from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import distinct
from sqlalchemy.orm import Session

from database import get_db
from models.customer import Contact
from models.contract import Payment

router = APIRouter(prefix="/api/handlers", tags=["handlers"])


@router.get("", response_model=List[str])
async def list_handlers(db: Session = Depends(get_db)):
    """컨택/입금에서 사용된 모든 담당자 이름 (자동완성용)."""
    contact_handlers = db.query(distinct(Contact.handler)).filter(Contact.handler != "").all()
    payment_handlers = db.query(distinct(Payment.handler)).filter(Payment.handler != "").all()

    names = set()
    for (h,) in contact_handlers:
        if h:
            names.add(h.strip())
    for (h,) in payment_handlers:
        if h:
            names.add(h.strip())

    return sorted(names)
