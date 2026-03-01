from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Brand ──

class BrandCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    website: str = ""
    note: str = ""

class BrandResponse(BaseModel):
    id: int
    name: str
    website: str
    note: str
    class Config:
        from_attributes = True


# ── Category ──

class CategoryCreate(BaseModel):
    level1: str
    level2: str
    level3: str = ""

class CategoryResponse(BaseModel):
    id: int
    level1: str
    level2: str
    level3: str
    class Config:
        from_attributes = True


# ── Material ──

class MaterialCreate(BaseModel):
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    product_name: str = Field(..., min_length=1, max_length=200)
    product_code: str = ""
    spec: str = ""
    unit: str = "m2"
    unit_price: int = 0
    coverage_area_py: Optional[float] = None
    coverage_area_m2: Optional[float] = None
    price_per_py: Optional[int] = None
    price_per_m2: Optional[int] = None
    loss_rate: float = 10.0
    purchase_url: str = ""
    note: str = ""
    is_active: bool = True
    # 편의 필드 (엑셀 업로드 시 브랜드명/카테고리명으로 지정)
    brand_name: Optional[str] = None
    category_level1: Optional[str] = None
    category_level2: Optional[str] = None
    category_level3: Optional[str] = None


class MaterialUpdate(BaseModel):
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    spec: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[int] = None
    coverage_area_py: Optional[float] = None
    coverage_area_m2: Optional[float] = None
    price_per_py: Optional[int] = None
    price_per_m2: Optional[int] = None
    loss_rate: Optional[float] = None
    purchase_url: Optional[str] = None
    note: Optional[str] = None
    is_active: Optional[bool] = None


class MaterialResponse(BaseModel):
    id: int
    product_name: str
    product_code: str
    spec: str
    unit: str
    unit_price: int
    coverage_area_py: Optional[float]
    coverage_area_m2: Optional[float]
    price_per_py: Optional[int]
    price_per_m2: Optional[int]
    loss_rate: float
    purchase_url: str
    note: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # 조인 정보
    brand_name: Optional[str] = None
    category_level1: Optional[str] = None
    category_level2: Optional[str] = None
    category_level3: Optional[str] = None

    class Config:
        from_attributes = True


class MaterialListResponse(BaseModel):
    materials: List[MaterialResponse]
    total: int


# ── WorkType ──

class WorkTypeCreate(BaseModel):
    work_name: str
    parent_id: Optional[int] = None

class WorkTypeResponse(BaseModel):
    id: int
    work_name: str
    parent_id: Optional[int]
    class Config:
        from_attributes = True


# ── LaborRate ──

class LaborRateCreate(BaseModel):
    work_type_id: Optional[int] = None
    item_name: str
    spec: str = ""
    unit: str = "m2"
    material_cost: int = 0
    labor_cost: int = 0
    expense_cost: int = 0
    total_cost: int = 0
    note: str = ""
    is_active: bool = True
    # 편의 필드
    work_type_name: Optional[str] = None

class LaborRateResponse(BaseModel):
    id: int
    item_name: str
    spec: str
    unit: str
    material_cost: int
    labor_cost: int
    expense_cost: int
    total_cost: int
    note: str
    is_active: bool
    updated_at: datetime
    work_type_name: Optional[str] = None
    class Config:
        from_attributes = True

class LaborRateListResponse(BaseModel):
    labor_rates: List[LaborRateResponse]
    total: int


# ── MiscItem ──

class MiscItemCreate(BaseModel):
    work_type_id: Optional[int] = None
    item_name: str
    spec: str = ""
    unit: str = ""
    unit_price: int = 0
    note: str = ""
    work_type_name: Optional[str] = None

class MiscItemResponse(BaseModel):
    id: int
    item_name: str
    spec: str
    unit: str
    unit_price: int
    note: str
    work_type_name: Optional[str] = None
    class Config:
        from_attributes = True

class MiscItemListResponse(BaseModel):
    misc_items: List[MiscItemResponse]
    total: int


# ── SketchupMapping ──

class SketchupMappingCreate(BaseModel):
    skp_material_name: str
    material_id: Optional[int] = None
    surface_type: str = "wall"
    is_verified: bool = False

class SketchupMappingResponse(BaseModel):
    id: int
    skp_material_name: str
    material_id: Optional[int]
    surface_type: str
    is_verified: bool
    material_name: Optional[str] = None
    class Config:
        from_attributes = True
