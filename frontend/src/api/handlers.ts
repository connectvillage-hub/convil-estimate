import axios from 'axios';

const getApiBase = () =>
  window.location.hostname === 'localhost'
    ? ''
    : 'https://convil-estimate.onrender.com';

const handlersApi = {
  async list(): Promise<string[]> {
    const { data } = await axios.get(`${getApiBase()}/api/handlers`);
    return data;
  },
};

export default handlersApi;
