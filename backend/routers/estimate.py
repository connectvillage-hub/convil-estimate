from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import io

from models.estimate import EstimateRequest
from services.calculate import calculate
from services.excel_service import generate_excel
from services.pdf_service import generate_pdf

router = APIRouter(prefix="/api/estimate", tags=["estimate"])


@router.post("/generate-excel")
async def generate_excel_endpoint(req: EstimateRequest):
    result = calculate(req)
    file_bytes = generate_excel(req, result)

    filename = f"컨빌디자인_견적서_{req.customerName or '고객'}_{req.estimateDate}.xlsx"
    # URL-encode the filename for Content-Disposition
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

    filename = f"컨빌디자인_견적서_{req.customerName or '고객'}_{req.estimateDate}.pdf"
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
