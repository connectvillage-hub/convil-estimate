from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    website = Column(String(500), default="")
    note = Column(Text, default="")

    materials = relationship("Material", back_populates="brand")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    level1 = Column(String(50), nullable=False, index=True)   # 대분류: 바닥, 벽체, 부자재
    level2 = Column(String(50), nullable=False, index=True)   # 중분류: 데코타일, 도배
    level3 = Column(String(100), default="")                   # 상세분류: 프레스티지, 합지

    materials = relationship("Material", back_populates="category")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    product_name = Column(String(200), nullable=False, index=True)
    product_code = Column(String(100), default="")
    spec = Column(String(200), default="")
    unit = Column(String(50), default="m2")
    unit_price = Column(Integer, default=0)
    coverage_area_py = Column(Float, nullable=True)    # 시공가능면적 (평)
    coverage_area_m2 = Column(Float, nullable=True)    # 시공가능면적 (m2)
    price_per_py = Column(Integer, nullable=True)      # 평당 자재비
    price_per_m2 = Column(Integer, nullable=True)      # m2당 자재비
    loss_rate = Column(Float, default=10.0)            # 로스율 (%)
    purchase_url = Column(String(500), default="")
    note = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    brand = relationship("Brand", back_populates="materials")
    category = relationship("Category", back_populates="materials")
    sketchup_mappings = relationship("SketchupMapping", back_populates="material")


class WorkType(Base):
    __tablename__ = "work_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    work_name = Column(String(100), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("work_types.id"), nullable=True)

    parent = relationship("WorkType", remote_side=[id])
    labor_rates = relationship("LaborRate", back_populates="work_type")
    misc_items = relationship("MiscItem", back_populates="work_type")


class LaborRate(Base):
    __tablename__ = "labor_rates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    work_type_id = Column(Integer, ForeignKey("work_types.id"), nullable=True)
    item_name = Column(String(200), nullable=False)
    spec = Column(String(200), default="")
    unit = Column(String(50), default="m2")
    material_cost = Column(Integer, default=0)   # 자재비
    labor_cost = Column(Integer, default=0)      # 노무비
    expense_cost = Column(Integer, default=0)    # 경비
    total_cost = Column(Integer, default=0)      # 합계
    note = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    work_type = relationship("WorkType", back_populates="labor_rates")


class MiscItem(Base):
    __tablename__ = "misc_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    work_type_id = Column(Integer, ForeignKey("work_types.id"), nullable=True)
    item_name = Column(String(200), nullable=False)
    spec = Column(String(200), default="")
    unit = Column(String(50), default="")
    unit_price = Column(Integer, default=0)
    note = Column(Text, default="")

    work_type = relationship("WorkType", back_populates="misc_items")


class SketchupMapping(Base):
    __tablename__ = "sketchup_mapping"

    id = Column(Integer, primary_key=True, autoincrement=True)
    skp_material_name = Column(String(200), nullable=False, unique=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    surface_type = Column(String(20), default="wall")  # floor, wall, ceiling
    is_verified = Column(Boolean, default=False)

    material = relationship("Material", back_populates="sketchup_mappings")
