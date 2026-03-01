import axios from 'axios';
import type {
  Material,
  MaterialCreate,
  MaterialUpdate,
  MaterialListResponse,
  LaborRateListResponse,
  MiscItemListResponse,
  Brand,
  Category,
  DbStats,
} from '../types/material';

const getApiBase = () =>
  window.location.hostname === 'localhost'
    ? ''
    : 'https://convil-estimate.onrender.com';

const materialsApi = {
  // Stats
  async getStats(): Promise<DbStats> {
    const { data } = await axios.get(`${getApiBase()}/api/stats`);
    return data;
  },

  // Brands
  async listBrands(): Promise<Brand[]> {
    const { data } = await axios.get(`${getApiBase()}/api/brands`);
    return data;
  },

  // Categories
  async listCategories(): Promise<Category[]> {
    const { data } = await axios.get(`${getApiBase()}/api/categories`);
    return data;
  },

  async listCategoryLevel1(): Promise<string[]> {
    const { data } = await axios.get(`${getApiBase()}/api/categories/level1`);
    return data;
  },

  // Materials
  async list(params?: {
    level1?: string;
    level2?: string;
    brand?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<MaterialListResponse> {
    const { data } = await axios.get(`${getApiBase()}/api/materials`, { params });
    return data;
  },

  async get(id: number): Promise<Material> {
    const { data } = await axios.get(`${getApiBase()}/api/materials/${id}`);
    return data;
  },

  async create(material: MaterialCreate): Promise<any> {
    const { data } = await axios.post(`${getApiBase()}/api/materials`, material);
    return data;
  },

  async update(id: number, material: MaterialUpdate): Promise<any> {
    const { data } = await axios.put(`${getApiBase()}/api/materials/${id}`, material);
    return data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${getApiBase()}/api/materials/${id}`);
  },

  // Labor Rates
  async listLaborRates(params?: {
    work_type?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<LaborRateListResponse> {
    const { data } = await axios.get(`${getApiBase()}/api/labor-rates`, { params });
    return data;
  },

  // Misc Items
  async listMiscItems(params?: {
    work_type?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<MiscItemListResponse> {
    const { data } = await axios.get(`${getApiBase()}/api/misc-items`, { params });
    return data;
  },
};

export default materialsApi;
