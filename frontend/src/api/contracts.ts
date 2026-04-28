import axios from 'axios';
import type { ContractDetail, ContractInput, PaymentInput } from '../types/contract';

const getApiBase = () =>
  window.location.hostname === 'localhost'
    ? ''
    : 'https://convil-estimate.onrender.com';

const contractsApi = {
  async listForCustomer(customerId: number): Promise<ContractDetail[]> {
    const { data } = await axios.get(
      `${getApiBase()}/api/customers/${customerId}/contracts`,
    );
    return data;
  },

  async create(customerId: number, input: ContractInput): Promise<ContractDetail> {
    const { data } = await axios.post(
      `${getApiBase()}/api/customers/${customerId}/contracts`,
      input,
    );
    return data;
  },

  async createFromEstimate(customerId: number, estimateId: number): Promise<ContractDetail> {
    const { data } = await axios.post(
      `${getApiBase()}/api/customers/${customerId}/contracts/from-estimate/${estimateId}`,
    );
    return data;
  },

  async get(contractId: number): Promise<ContractDetail> {
    const { data } = await axios.get(`${getApiBase()}/api/contracts/${contractId}`);
    return data;
  },

  async update(contractId: number, input: ContractInput): Promise<ContractDetail> {
    const { data } = await axios.put(
      `${getApiBase()}/api/contracts/${contractId}`,
      input,
    );
    return data;
  },

  async delete(contractId: number): Promise<void> {
    await axios.delete(`${getApiBase()}/api/contracts/${contractId}`);
  },

  async addPayment(contractId: number, input: PaymentInput): Promise<ContractDetail> {
    const { data } = await axios.post(
      `${getApiBase()}/api/contracts/${contractId}/payments`,
      input,
    );
    return data;
  },

  async updatePayment(
    contractId: number,
    paymentId: number,
    input: PaymentInput,
  ): Promise<ContractDetail> {
    const { data } = await axios.put(
      `${getApiBase()}/api/contracts/${contractId}/payments/${paymentId}`,
      input,
    );
    return data;
  },

  async deletePayment(contractId: number, paymentId: number): Promise<ContractDetail> {
    const { data } = await axios.delete(
      `${getApiBase()}/api/contracts/${contractId}/payments/${paymentId}`,
    );
    return data;
  },
};

export default contractsApi;
