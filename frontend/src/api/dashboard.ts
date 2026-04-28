import axios from 'axios';
import type { ContractStatus, InquirySource } from '../types/customer';
import type { ContractState, PaymentMethod } from '../types/contract';

const getApiBase = () =>
  window.location.hostname === 'localhost'
    ? ''
    : 'https://convil-estimate.onrender.com';

export interface ActivityItem {
  type: 'customer_created' | 'contract_created' | 'payment_received' | 'contact_logged';
  at: string;
  customerId?: number | null;
  customerName?: string | null;
  amount?: number | null;
  description?: string | null;
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM
  amount: number;
}

export interface OutstandingItem {
  contractId: number;
  customerId: number;
  customerName: string;
  contractTitle: string;
  contractAmount: number;
  paidAmount: number;
  remainingAmount: number;
  contractDate: string;
}

export interface DashboardSummary {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  totalRevenue: number;
  totalOutstanding: number;
  activeContracts: number;
  completedContracts: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  customersByStatus: Record<ContractStatus, number>;
  customersBySource: Record<InquirySource, number>;
  contractsByState: Record<ContractState, number>;
  monthlyRevenue: MonthlyRevenue[];
  outstandingTop: OutstandingItem[];
  recentActivities: ActivityItem[];
}

export interface PaymentRow {
  paymentId: number;
  contractId: number;
  customerId: number;
  customerName: string;
  contractTitle: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  memo: string;
}

const dashboardApi = {
  async summary(): Promise<DashboardSummary> {
    const { data } = await axios.get(`${getApiBase()}/api/dashboard/summary`);
    return data;
  },

  async listAllPayments(params?: {
    fromMonth?: string;
    toMonth?: string;
    method?: PaymentMethod;
  }): Promise<PaymentRow[]> {
    const { data } = await axios.get(`${getApiBase()}/api/dashboard/payments`, { params });
    return data;
  },

  async listOutstanding(): Promise<OutstandingItem[]> {
    const { data } = await axios.get(`${getApiBase()}/api/dashboard/outstanding`);
    return data;
  },
};

export default dashboardApi;
