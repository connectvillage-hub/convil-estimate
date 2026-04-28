import axios from 'axios';
import type {
  CustomerInput,
  CustomerListItem,
  CustomerDetail,
  ContactInput,
  ContractStatus,
  InquirySource,
} from '../types/customer';

const getApiBase = () =>
  window.location.hostname === 'localhost'
    ? ''
    : 'https://convil-estimate.onrender.com';

const customersApi = {
  async list(params?: {
    search?: string;
    contractStatus?: ContractStatus;
    inquirySource?: InquirySource;
  }): Promise<CustomerListItem[]> {
    const { data } = await axios.get(`${getApiBase()}/api/customers`, { params });
    return data;
  },

  async get(id: number): Promise<CustomerDetail> {
    const { data } = await axios.get(`${getApiBase()}/api/customers/${id}`);
    return data;
  },

  async create(input: CustomerInput): Promise<CustomerDetail> {
    const { data } = await axios.post(`${getApiBase()}/api/customers`, input);
    return data;
  },

  async update(id: number, input: CustomerInput): Promise<CustomerDetail> {
    const { data } = await axios.put(`${getApiBase()}/api/customers/${id}`, input);
    return data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${getApiBase()}/api/customers/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<{ deleted: number }> {
    const { data } = await axios.post(`${getApiBase()}/api/customers/bulk-delete`, { ids });
    return data;
  },

  async addContact(customerId: number, input: ContactInput): Promise<CustomerDetail> {
    const { data } = await axios.post(
      `${getApiBase()}/api/customers/${customerId}/contacts`,
      input,
    );
    return data;
  },

  async updateContact(
    customerId: number,
    contactId: number,
    input: ContactInput,
  ): Promise<CustomerDetail> {
    const { data } = await axios.put(
      `${getApiBase()}/api/customers/${customerId}/contacts/${contactId}`,
      input,
    );
    return data;
  },

  async deleteContact(customerId: number, contactId: number): Promise<CustomerDetail> {
    const { data } = await axios.delete(
      `${getApiBase()}/api/customers/${customerId}/contacts/${contactId}`,
    );
    return data;
  },
};

export default customersApi;
