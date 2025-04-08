// Instead of importing config dynamically which fails in Heroku's build environment
// Let's define the API URL directly for production

export default ({ config }) => {
  // For production (like Heroku), use the production URL
  const apiUrl = typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    ? 'https://sconnect-api-469-55a2ba13b4c8.herokuapp.com'
    : 'http://localhost:5001';

  return {
    ...config,
    extra: {
      apiUrl,
    },
  };
}; 