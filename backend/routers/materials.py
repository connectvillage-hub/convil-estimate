from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.schemas.material import (
    MaterialCreate, MaterialUpdate, MaterialResponse, MaterialListResponse,
    BrandResponse, CategoryResponse, WorkTypeResponse,
    LaborRateCreate, LaborRateResponse, LaborRateListResponse,
    MiscItemCreate, MiscItemResponse, MiscItemListResponse,
)
from services.material_service import MaterialService

router = APIRouter(prefix="/api", tags=["materials"])


# ── 통계 ──

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    service = MaterialService(db)
    return service.get_stats()


# ── Brands ──

@router.get("/brands")
async def list_brands(db: Session = Depends(get_db)):
    service = MaterialService(db)
    brands = service.list_brands()
    return [BrandResponse.model_validate(b) for b in brands]


# ── Categories ──

@router.get("/categories")
async def list_categories(db: Session = Depends(get_db)):
    service = MaterialService(db)
    cats = service.list_categories()
    return [CategoryResponse.model_validate(c) for c in cats]


@router.get("/categories/level1")
async def list_category_level1(db: Session = Depends(get_db)):
    service = MaterialService(db)
    return service.get_category_level1_list()


# ── Work Types ──

@router.get("/work-types")
async def list_work_types(db: Session = Depends(get_db)):
    service = MaterialService(db)
    wts = service.list_work_types()
    return [WorkTypeResponse.model_validate(w) for w in wts]


# ── Materials ──

@router.get("/materials", response_model=MaterialListResponse)
async def list_materials(
    level1: Optional[str] = None,
    level2: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    service = MaterialService(db)
    materials, total = service.list_materials(
        category_level1=level1,
        category_level2=level2,
        brand_name=brand,
        search=search,
        skip=skip,
        limit=limit,
    )
    return MaterialListResponse(
        materials=[MaterialResponse(**m) for m in materials],
        total=total,
    )


@router.get("/materials/{material_id}")
async def get_material(material_id: int, db: Session = Depends(get_db)):
    service = MaterialService(db)
    material = service.get_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="자재를 찾을 수 없습니다.")
    return {
        "id": material.id,
        "product_name": material.product_name,
        "product_code": material.product_code,
        "spec": material.spec,
        "unit": material.unit,
        "unit_price": material.unit_price,
        "coverage_area_py": material.coverage_area_py,
        "coverage_area_m2": material.coverage_area_m2,
        "price_per_py": material.price_per_py,
        "price_per_m2": material.price_per_m2,
        "loss_rate": material.loss_rate,
        "note": material.note,
        "is_active": material.is_active,
        "brand_name": material.brand.name if material.brand else "",
        "category_level1": material.category.level1 if material.category else "",
        "category_level2": material.category.level2 if material.category else "",
        "category_level3": material.category.level3 if material.category else "",
    }


@router.post("/materials")
async def create_material(data: MaterialCreate, db: Session = Depends(get_db)):
    service = MaterialService(db)
    material = service.create_material(data)
    return {"id": material.id, "product_name": material.product_name}


@router.put("/materials/{material_id}")
async def update_material(
    material_id: int, data: MaterialUpdate, db: Session = Depends(get_db)
):
    service = MaterialService(db)
    material = service.update_material(material_id, data)
    if not material:
        raise HTTPException(status_code=404, detail="자재를 찾을 수 없습니다.")
    return {"id": material.id, "product_name": material.product_name}


@router.delete("/materials/{material_id}")
async def delete_material(material_id: int, db: Session = Depends(get_db)):
    service = MaterialService(db)
    if not service.delete_material(material_id):
        raise HTTPException(status_code=404, detail="자재를 찾을 수 없습니다.")
    return {"detail": "삭제되었습니다."}


# ── Labor Rates ──

@router.get("/labor-rates", response_model=LaborRateListResponse)
async def list_labor_rates(
    work_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    service = MaterialService(db)
    items, total = service.list_labor_rates(
        work_type_name=work_type, search=search, skip=skip, limit=limit
    )
    return LaborRateListResponse(
        labor_rates=[LaborRateResponse(**i) for i in items],
        total=total,
    )


@router.post("/labor-rates")
async def create_labor_rate(data: LaborRateCreate, db: Session = Depends(get_db)):
    service = MaterialService(db)
    lr = service.create_labor_rate(data)
    return {"id": lr.id, "item_name": lr.item_name}


# ── Misc Items ──

@router.get("/misc-items", response_model=MiscItemListResponse)
async def list_misc_items(
    work_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    service = MaterialService(db)
    items, total = service.list_misc_items(
        work_type_name=work_type, search=search, skip=skip, limit=limit
    )
    return MiscItemListResponse(
        misc_items=[MiscItemResponse(**i) for i in items],
        total=total,
    )


@router.post("/misc-items")
async def create_misc_item(data: MiscItemCreate, db: Session = Depends(get_db)):
    service = MaterialService(db)
    item = service.create_misc_item(data)
    return {"id": item.id, "item_name": item.item_name}
