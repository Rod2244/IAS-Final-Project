// Function to extract a cookie value by name (like your CSRF cookie)
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const customFetch = async (url, options = {}) => {
  // Ensure headers exist
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 🔑 Automatically read and attach the CSRF token from cookies
  const csrfToken = getCookie('XSRF-TOKEN'); // Match this with whatever key your backend uses
  if (csrfToken) {
    options.headers['X-CSRF-Token'] = csrfToken;
  }

  // Include credentials (cookies) so the session/CSRF checks work on cross-origin requests
  options.credentials = 'include';

  const response = await fetch(url, options);
  return response;
};