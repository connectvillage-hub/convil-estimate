export type InquirySource =
  | 'instagram'
  | 'youtube'
  | 'blog'
  | 'naver'
  | 'referral'
  | 'ai'
  | 'sms'
  | 'outsourcing'
  | 'website'
  | 'danggn'
  | 'email'
  | 'other';

export type ContractStatus =
  | 'pre_consultation'
  | 'in_consultation'
  | 'estimate_sent'
  | 'contract_signed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const INQUIRY_SOURCE_LABELS: Record<InquirySource, string> = {
  instagram: '인스타그램',
  youtube: '유튜브',
  blog: '블로그',
  naver: '네이버 검색',
  referral: '지인 추천',
  ai: 'AI 검색',
  sms: '문자 광고',
  outsourcing: '외주 사이트',
  website: '홈페이지',
  danggn: '당근',
  email: '메일 광고',
  other: '기타',
};

export const INQUIRY_SOURCE_OPTIONS: InquirySource[] = [
  'instagram', 'youtube', 'blog', 'naver', 'referral',
  'ai', 'sms', 'outsourcing', 'website', 'danggn', 'email', 'other',
];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  pre_consultation: '상담 전',
  in_consultation: '상담 진행 중',
  estimate_sent: '견적 안내',
  contract_signed: '계약 완료',
  in_progress: '작업 진행',
  completed: '작업 완료',
  cancelled: '취소',
};

export const CONTRACT_STATUS_OPTIONS: ContractStatus[] = [
  'pre_consultation', 'in_consultation', 'estimate_sent',
  'contract_signed', 'in_progress', 'completed', 'cancelled',
];

// 상태별 색상 (Tailwind 클래스)
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  pre_consultation: 'bg-gray-100 text-gray-700 border-gray-200',
  in_consultation: 'bg-blue-100 text-blue-700 border-blue-200',
  estimate_sent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  contract_signed: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export interface Contact {
  id: number;
  sequence: number;
  contactedAt: string;
  content: string;
}

export interface CustomerInput {
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  manager: string;
  memo: string;
  inquirySource: InquirySource;
  contractStatus: ContractStatus;
}

export interface CustomerListItem {
  id: number;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  inquirySource: InquirySource;
  contractStatus: ContractStatus;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends CustomerInput {
  id: number;
  createdAt: string;
  updatedAt: string;
  contacts: Contact[];
}

export interface ContactInput {
  sequence?: number;
  contactedAt?: string;
  content: string;
}

export const emptyCustomer = (): CustomerInput => ({
  name: '',
  companyName: '',
  phone: '',
  email: '',
  address: '',
  manager: '',
  memo: '',
  inquirySource: 'other',
  contractStatus: 'pre_consultation',
});
