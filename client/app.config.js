import { API_URL } from './config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      apiUrl: API_URL,
    },
  };
}; 