import axios from 'axios';
import type { EstimateFormData, ClientType } from '../types/estimate';

const getApiBase = () =>
  window.location.hostname === 'localhost'
    ? ''
    : 'https://convil-estimate.onrender.com';

export interface SavedEstimateListItem {
  id: number;
  customerId?: number | null;
  customerName: string;
  projectName: string;
  estimateDate: string;
  finalAmount: number;
  clientType: ClientType;
  createdAt: string;
  updatedAt: string;
}

export interface SavedEstimateDetail extends SavedEstimateListItem {
  form: EstimateFormData;
}

const estimatesApi = {
  async list(): Promise<SavedEstimateListItem[]> {
    const { data } = await axios.get(`${getApiBase()}/api/estimate/saved`);
    return data;
  },

  async listByCustomer(customerId: number): Promise<SavedEstimateListItem[]> {
    const { data } = await axios.get(
      `${getApiBase()}/api/estimate/saved/by-customer/${customerId}`,
    );
    return data;
  },

  async get(id: number): Promise<SavedEstimateDetail> {
    const { data } = await axios.get(`${getApiBase()}/api/estimate/saved/${id}`);
    return data;
  },

  async create(form: EstimateFormData): Promise<SavedEstimateDetail> {
    const { data } = await axios.post(`${getApiBase()}/api/estimate/saved`, { form });
    return data;
  },

  async update(id: number, form: EstimateFormData): Promise<SavedEstimateDetail> {
    const { data } = await axios.put(`${getApiBase()}/api/estimate/saved/${id}`, { form });
    return data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${getApiBase()}/api/estimate/saved/${id}`);
  },
};

export default estimatesApi;
