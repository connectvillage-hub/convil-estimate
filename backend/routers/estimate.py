from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import io

from database import get_db
from models.estimate import (
    EstimateRequest,
    SavedEstimateCreate,
    SavedEstimateListItem,
    SavedEstimateDetail,
)
from models.saved_estimate import SavedEstimate
from services.calculate import calculate
from services.excel_service import generate_excel
from services.pdf_service import generate_pdf

router = APIRouter(prefix="/api/estimate", tags=["estimate"])


@router.post("/generate-excel")
async def generate_excel_endpoint(req: EstimateRequest):
    result = calculate(req)
    file_bytes = generate_excel(req, result)

    doc_label = "시공사견적서" if req.clientType == "contractor" else "견적서"
    fallback = "시공사" if req.clientType == "contractor" else "고객"
    filename = f"컨빌디자인_{doc_label}_{req.customerName or fallback}_{req.estimateDate}.xlsx"
    from urllib.parse import quote
    encoded_name = quote(filename)

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}",
        },
    )


@router.post("/generate-pdf")
async def generate_pdf_endpoint(req: EstimateRequest):
    result = calculate(req)
    file_bytes = generate_pdf(req, result)

    doc_label = "시공사견적서" if req.clientType == "contractor" else "견적서"
    fallback = "시공사" if req.clientType == "contractor" else "고객"
    filename = f"컨빌디자인_{doc_label}_{req.customerName or fallback}_{req.estimateDate}.pdf"
    from urllib.parse import quote
    encoded_name = quote(filename)

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}",
        },
    )


@router.post("/calculate")
async def calculate_endpoint(req: EstimateRequest):
    """프론트엔드에서 서버사이드 계산이 필요할 때 사용"""
    result = calculate(req)
    return result


# ─────────── 저장된 견적 CRUD ───────────

def _to_detail(row: SavedEstimate) -> SavedEstimateDetail:
    form = EstimateRequest(**row.form_data)
    return SavedEstimateDetail(
        id=row.id,
        customerName=row.customer_name or "",
        projectName=row.project_name or "",
        estimateDate=row.estimate_date or "",
        finalAmount=row.final_amount or 0,
        clientType=form.clientType,
        createdAt=row.created_at.isoformat() if row.created_at else "",
        updatedAt=row.updated_at.isoformat() if row.updated_at else "",
        form=form,
    )


def _to_list_item(row: SavedEstimate) -> SavedEstimateListItem:
    client_type = (row.form_data or {}).get("clientType", "customer")
    return SavedEstimateListItem(
        id=row.id,
        customerName=row.customer_name or "",
        projectName=row.project_name or "",
        estimateDate=row.estimate_date or "",
        finalAmount=row.final_amount or 0,
        clientType=client_type,
        createdAt=row.created_at.isoformat() if row.created_at else "",
        updatedAt=row.updated_at.isoformat() if row.updated_at else "",
    )


@router.post("/saved", response_model=SavedEstimateDetail)
async def create_saved_estimate(payload: SavedEstimateCreate, db: Session = Depends(get_db)):
    req = payload.form
    result = calculate(req)
    row = SavedEstimate(
        customer_name=req.customerName or "",
        project_name=req.projectName or "",
        estimate_date=req.estimateDate or "",
        final_amount=result.finalAmount,
        form_data=req.model_dump(mode="json"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_detail(row)


@router.get("/saved", response_model=List[SavedEstimateListItem])
async def list_saved_estimates(db: Session = Depends(get_db)):
    rows = db.query(SavedEstimate).order_by(SavedEstimate.updated_at.desc()).all()
    return [_to_list_item(r) for r in rows]


@router.get("/saved/{estimate_id}", response_model=SavedEstimateDetail)
async def get_saved_estimate(estimate_id: int, db: Session = Depends(get_db)):
    row = db.query(SavedEstimate).filter(SavedEstimate.id == estimate_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="견적을 찾을 수 없습니다")
    return _to_detail(row)


@router.put("/saved/{estimate_id}", response_model=SavedEstimateDetail)
async def update_saved_estimate(
    estimate_id: int, payload: SavedEstimateCreate, db: Session = Depends(get_db)
):
    row = db.query(SavedEstimate).filter(SavedEstimate.id == estimate_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="견적을 찾을 수 없습니다")
    req = payload.form
    result = calculate(req)
    row.customer_name = req.customerName or ""
    row.project_name = req.projectName or ""
    row.estimate_date = req.estimateDate or ""
    row.final_amount = result.finalAmount
    row.form_data = req.model_dump(mode="json")
    db.commit()
    db.refresh(row)
    return _to_detail(row)


@router.delete("/saved/{estimate_id}")
async def delete_saved_estimate(estimate_id: int, db: Session = Depends(get_db)):
    row = db.query(SavedEstimate).filter(SavedEstimate.id == estimate_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="견적을 찾을 수 없습니다")
    db.delete(row)
    db.commit()
    return {"ok": True}
