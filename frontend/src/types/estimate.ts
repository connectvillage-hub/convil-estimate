export type Region = 'main' | 'other';
export type ServiceType = 'single' | 'package';
export type MeetingType = 'remote' | 'visit';

export interface SingleItems {
  floorPlan: boolean;
  ceilingPlan: boolean;
  design3d: boolean;
}

export interface AdditionalItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface EstimateFormData {
  customerName: string;
  projectName: string;
  pyeongsu: number;
  region: Region;
  serviceType: ServiceType;
  singleItems: SingleItems;
  meetingType: MeetingType;
  brandingPlus: boolean;
  additionalItems: AdditionalItem[];
  discount: number;
  estimateDate: string;
}

export interface ItemDetail {
  scope: string;
  item: string;
  quantity: number;
  unitCost: number;
  cost: number;
}

export interface EstimateResult {
  itemDetails: ItemDetail[];
  subtotal: number;
  discount: number;
  total: number;
  vat: number;
  finalAmount: number;
  pyeongRange: string;
}

export const REGION_LABELS: Record<Region, string> = {
  main: '서울/인천/대전/경남',
  other: '그 외 지역',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  single: '단건 의뢰',
  package: '패키지',
};

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  remote: '비대면',
  visit: '출장 포함',
};
