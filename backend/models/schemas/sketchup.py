from pydantic import BaseModel
from typing import List, Optional


class SketchupSurface(BaseModel):
    type: str  # wall, floor, ceiling
    area_sqm: float
    materialName: str
    width: Optional[float] = None
    height: Optional[float] = None
    faceCount: int = 1


class SketchupRoom(BaseModel):
    name: str
    surfaces: List[SketchupSurface]


class SketchupTotalArea(BaseModel):
    wall: float
    floor: float
    ceiling: float


class SketchupMaterial(BaseModel):
    name: str
    textureFile: str = ""
    totalArea_sqm: float


class SketchupUploadData(BaseModel):
    projectName: str
    exportDate: str
    sketchupVersion: str = ""
    units: str = "millimeters"
    rooms: List[SketchupRoom]
    totalArea: SketchupTotalArea
    materials: List[SketchupMaterial]
