export type PaymentMethod = 'bank_transfer' | 'card' | 'government_aid';

export type ContractState = 'active' | 'completed' | 'cancelled';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: '계좌이체',
  card: '카드결제',
  government_aid: '정부지원금',
};

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  'bank_transfer', 'card', 'government_aid',
];

export const CONTRACT_STATE_LABELS: Record<ContractState, string> = {
  active: '진행 중',
  completed: '완료',
  cancelled: '취소',
};

export const CONTRACT_STATE_OPTIONS: ContractState[] = ['active', 'completed', 'cancelled'];

export const CONTRACT_STATE_COLORS: Record<ContractState, string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export interface Payment {
  id: number;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  memo: string;
}

export interface PaymentInput {
  amount: number;
  paidAt?: string;
  method: PaymentMethod;
  memo: string;
}

export interface ContractInput {
  title: string;
  contractAmount: number;
  contractDate: string;
  estimateId?: number | null;
  state: ContractState;
  memo: string;
}

export interface ContractDetail {
  id: number;
  customerId: number;
  estimateId: number | null;
  title: string;
  contractAmount: number;
  contractDate: string;
  state: ContractState;
  memo: string;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
}

export const emptyContract = (): ContractInput => ({
  title: '',
  contractAmount: 0,
  contractDate: new Date().toISOString().split('T')[0],
  state: 'active',
  memo: '',
});

export const emptyPayment = (): PaymentInput => ({
  amount: 0,
  paidAt: new Date().toISOString().slice(0, 16),
  method: 'bank_transfer',
  memo: '',
});
