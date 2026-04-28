from sqlalchemy import Column, Integer, String, DateTime, JSON, Float, ForeignKey
from sqlalchemy.sql import func
from database import Base


class SavedEstimate(Base):
    __tablename__ = "saved_estimates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    customer_name = Column(String(200), nullable=False, default="")
    project_name = Column(String(200), nullable=False, default="")
    estimate_date = Column(String(20), nullable=False, default="")
    final_amount = Column(Float, nullable=False, default=0)
    form_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
