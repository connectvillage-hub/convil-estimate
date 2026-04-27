from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class Region(str, Enum):
    main = "main"
    other = "other"


class ServiceType(str, Enum):
    single = "single"
    package = "package"


class MeetingType(str, Enum):
    remote = "remote"
    visit = "visit"


class ClientType(str, Enum):
    customer = "customer"
    contractor = "contractor"


CONTRACTOR_DISCOUNT_RATE = 0.15


class SingleItems(BaseModel):
    floorPlan: bool = False
    ceilingPlan: bool = False
    design3d: bool = False


class AdditionalItem(BaseModel):
    id: str
    name: str
    quantity: int = Field(ge=1)
    unitPrice: float = Field(ge=0)


class EstimateRequest(BaseModel):
    customerName: str = ""
    projectName: str = ""
    pyeongsu: int = Field(ge=1, le=200)
    region: Region = Region.main
    serviceType: ServiceType = ServiceType.package
    singleItems: SingleItems = SingleItems()
    meetingType: MeetingType = MeetingType.remote
    brandingPlus: bool = False
    additionalItems: List[AdditionalItem] = []
    discount: float = 0
    estimateDate: str = ""
    clientType: ClientType = ClientType.customer


class ItemDetail(BaseModel):
    scope: str
    item: str
    quantity: int
    unitCost: float
    cost: float
    unavailable: Optional[bool] = False


class EstimateResult(BaseModel):
    itemDetails: List[ItemDetail]
    subtotal: float
    discount: float
    total: float
    vat: float
    finalAmount: float
    pyeongRange: str


class SavedEstimateCreate(BaseModel):
    form: EstimateRequest


class SavedEstimateListItem(BaseModel):
    id: int
    customerName: str
    projectName: str
    estimateDate: str
    finalAmount: float
    clientType: ClientType
    createdAt: str
    updatedAt: str


class SavedEstimateDetail(BaseModel):
    id: int
    customerName: str
    projectName: str
    estimateDate: str
    finalAmount: float
    clientType: ClientType
    createdAt: str
    updatedAt: str
    form: EstimateRequest
