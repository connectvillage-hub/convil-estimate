from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.material import (
    Brand, Category, Material, WorkType, LaborRate, MiscItem, SketchupMapping,
)
from models.schemas.material import (
    MaterialCreate, MaterialUpdate,
    LaborRateCreate, MiscItemCreate,
)
from typing import Optional, List, Tuple


class MaterialService:
    def __init__(self, db: Session):
        self.db = db

    # ── Brand ──

    def get_or_create_brand(self, name: str) -> Optional[Brand]:
        name = (name or "").strip()
        if not name:
            return None
        brand = self.db.query(Brand).filter(Brand.name == name).first()
        if not brand:
            brand = Brand(name=name)
            self.db.add(brand)
            self.db.flush()
        return brand

    def list_brands(self) -> List[Brand]:
        return self.db.query(Brand).order_by(Brand.name).all()

    # ── Category ──

    def get_or_create_category(self, level1: str, level2: str, level3: str = "") -> Optional[Category]:
        level1 = (level1 or "").strip()
        level2 = (level2 or "").strip()
        level3 = (level3 or "").strip()
        if not level1 or not level2:
            return None
        cat = self.db.query(Category).filter(
            Category.level1 == level1,
            Category.level2 == level2,
            Category.level3 == level3,
        ).first()
        if not cat:
            cat = Category(level1=level1, level2=level2, level3=level3)
            self.db.add(cat)
            self.db.flush()
        return cat

    def list_categories(self) -> List[Category]:
        return self.db.query(Category).order_by(
            Category.level1, Category.level2, Category.level3
        ).all()

    def get_category_level1_list(self) -> List[str]:
        results = (
            self.db.query(Category.level1)
            .distinct()
            .order_by(Category.level1)
            .all()
        )
        return [r[0] for r in results]

    # ── WorkType ──

    def get_or_create_work_type(self, name: str, parent_name: str = None) -> Optional[WorkType]:
        name = (name or "").strip()
        if not name:
            return None
        wt = self.db.query(WorkType).filter(WorkType.work_name == name).first()
        if not wt:
            parent_id = None
            if parent_name:
                parent = self.get_or_create_work_type(parent_name)
                parent_id = parent.id if parent else None
            wt = WorkType(work_name=name, parent_id=parent_id)
            self.db.add(wt)
            self.db.flush()
        return wt

    def list_work_types(self) -> List[WorkType]:
        return self.db.query(WorkType).order_by(WorkType.work_name).all()

    # ── Material ──

    def _compute_prices(self, mat: Material):
        """평당/m2당 자재비 자동 계산"""
        if mat.coverage_area_py and mat.coverage_area_py > 0 and mat.unit_price:
            mat.price_per_py = int(mat.unit_price / mat.coverage_area_py)
            mat.price_per_m2 = int(mat.price_per_py / 3.3058)
        elif mat.coverage_area_m2 and mat.coverage_area_m2 > 0 and mat.unit_price:
            mat.price_per_m2 = int(mat.unit_price / mat.coverage_area_m2)
            mat.price_per_py = int(mat.price_per_m2 * 3.3058)

    def list_materials(
        self,
        category_level1: Optional[str] = None,
        category_level2: Optional[str] = None,
        brand_name: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[dict], int]:
        query = self.db.query(Material)

        if category_level1:
            query = query.join(Category).filter(Category.level1 == category_level1)
        if category_level2:
            if not category_level1:
                query = query.join(Category)
            query = query.filter(Category.level2 == category_level2)
        if brand_name:
            query = query.join(Brand).filter(Brand.name == brand_name)
        if search:
            query = query.filter(
                or_(
                    Material.product_name.contains(search),
                    Material.product_code.contains(search),
                    Material.spec.contains(search),
                )
            )

        total = query.count()
        materials = query.order_by(Material.id).offset(skip).limit(limit).all()

        results = []
        for m in materials:
            d = {
                "id": m.id,
                "product_name": m.product_name,
                "product_code": m.product_code or "",
                "spec": m.spec or "",
                "unit": m.unit or "m2",
                "unit_price": m.unit_price or 0,
                "coverage_area_py": m.coverage_area_py,
                "coverage_area_m2": m.coverage_area_m2,
                "price_per_py": m.price_per_py,
                "price_per_m2": m.price_per_m2,
                "loss_rate": m.loss_rate if m.loss_rate is not None else 10.0,
                "purchase_url": m.purchase_url or "",
                "note": m.note or "",
                "is_active": m.is_active if m.is_active is not None else True,
                "created_at": m.created_at,
                "updated_at": m.updated_at,
                "brand_name": m.brand.name if m.brand else "",
                "category_level1": m.category.level1 if m.category else "",
                "category_level2": m.category.level2 if m.category else "",
                "category_level3": m.category.level3 if m.category else "",
            }
            results.append(d)
        return results, total

    def get_material(self, material_id: int) -> Optional[Material]:
        return self.db.query(Material).filter(Material.id == material_id).first()

    def create_material(self, data: MaterialCreate) -> Material:
        brand_id = data.brand_id
        if not brand_id and data.brand_name:
            brand = self.get_or_create_brand(data.brand_name)
            brand_id = brand.id if brand else None

        category_id = data.category_id
        if not category_id and data.category_level1 and data.category_level2:
            cat = self.get_or_create_category(
                data.category_level1, data.category_level2, data.category_level3 or ""
            )
            category_id = cat.id if cat else None

        material = Material(
            brand_id=brand_id,
            category_id=category_id,
            product_name=data.product_name,
            product_code=data.product_code or "",
            spec=data.spec or "",
            unit=data.unit or "m2",
            unit_price=data.unit_price or 0,
            coverage_area_py=data.coverage_area_py,
            coverage_area_m2=data.coverage_area_m2,
            price_per_py=data.price_per_py,
            price_per_m2=data.price_per_m2,
            loss_rate=data.loss_rate if data.loss_rate is not None else 10.0,
            purchase_url=data.purchase_url or "",
            note=data.note or "",
            is_active=data.is_active if data.is_active is not None else True,
        )
        self._compute_prices(material)
        self.db.add(material)
        self.db.commit()
        self.db.refresh(material)
        return material

    def update_material(self, material_id: int, data: MaterialUpdate) -> Optional[Material]:
        material = self.get_material(material_id)
        if not material:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(material, key, value)
        self._compute_prices(material)
        self.db.commit()
        self.db.refresh(material)
        return material

    def delete_material(self, material_id: int) -> bool:
        material = self.get_material(material_id)
        if not material:
            return False
        self.db.delete(material)
        self.db.commit()
        return True

    # ── LaborRate ──

    def create_labor_rate(self, data: LaborRateCreate) -> LaborRate:
        work_type_id = data.work_type_id
        if not work_type_id and data.work_type_name:
            wt = self.get_or_create_work_type(data.work_type_name)
            work_type_id = wt.id if wt else None

        total = (data.material_cost or 0) + (data.labor_cost or 0) + (data.expense_cost or 0)

        lr = LaborRate(
            work_type_id=work_type_id,
            item_name=data.item_name,
            spec=data.spec or "",
            unit=data.unit or "m2",
            material_cost=data.material_cost or 0,
            labor_cost=data.labor_cost or 0,
            expense_cost=data.expense_cost or 0,
            total_cost=data.total_cost if data.total_cost else total,
            note=data.note or "",
            is_active=data.is_active if data.is_active is not None else True,
        )
        self.db.add(lr)
        self.db.commit()
        self.db.refresh(lr)
        return lr

    def list_labor_rates(
        self,
        work_type_name: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[dict], int]:
        query = self.db.query(LaborRate)
        if work_type_name:
            query = query.join(WorkType).filter(WorkType.work_name == work_type_name)
        if search:
            query = query.filter(LaborRate.item_name.contains(search))

        total = query.count()
        items = query.order_by(LaborRate.id).offset(skip).limit(limit).all()

        results = []
        for lr in items:
            d = {
                "id": lr.id,
                "item_name": lr.item_name,
                "spec": lr.spec or "",
                "unit": lr.unit or "",
                "material_cost": lr.material_cost or 0,
                "labor_cost": lr.labor_cost or 0,
                "expense_cost": lr.expense_cost or 0,
                "total_cost": lr.total_cost or 0,
                "note": lr.note or "",
                "is_active": lr.is_active if lr.is_active is not None else True,
                "updated_at": lr.updated_at,
                "work_type_name": lr.work_type.work_name if lr.work_type else "",
            }
            results.append(d)
        return results, total

    # ── MiscItem ──

    def create_misc_item(self, data: MiscItemCreate) -> MiscItem:
        work_type_id = data.work_type_id
        if not work_type_id and data.work_type_name:
            wt = self.get_or_create_work_type(data.work_type_name)
            work_type_id = wt.id if wt else None

        item = MiscItem(
            work_type_id=work_type_id,
            item_name=data.item_name,
            spec=data.spec or "",
            unit=data.unit or "",
            unit_price=data.unit_price or 0,
            note=data.note or "",
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_misc_items(
        self,
        work_type_name: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[dict], int]:
        query = self.db.query(MiscItem)
        if work_type_name:
            query = query.join(WorkType).filter(WorkType.work_name == work_type_name)
        if search:
            query = query.filter(MiscItem.item_name.contains(search))

        total = query.count()
        items = query.order_by(MiscItem.id).offset(skip).limit(limit).all()

        results = []
        for mi in items:
            d = {
                "id": mi.id,
                "item_name": mi.item_name,
                "spec": mi.spec or "",
                "unit": mi.unit or "",
                "unit_price": mi.unit_price or 0,
                "note": mi.note or "",
                "work_type_name": mi.work_type.work_name if mi.work_type else "",
            }
            results.append(d)
        return results, total

    # ── 통계 ──

    def get_stats(self) -> dict:
        return {
            "materials": self.db.query(Material).count(),
            "brands": self.db.query(Brand).count(),
            "categories": self.db.query(Category).count(),
            "work_types": self.db.query(WorkType).count(),
            "labor_rates": self.db.query(LaborRate).count(),
            "misc_items": self.db.query(MiscItem).count(),
            "sketchup_mappings": self.db.query(SketchupMapping).count(),
        }
