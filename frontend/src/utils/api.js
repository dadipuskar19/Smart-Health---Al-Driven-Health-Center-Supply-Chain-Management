const API_URL = 'http://localhost:5000/api';

// Map roles to their seeded emails for mock backdoor auth
export const ROLE_EMAILS = {
  'Patient': 'patient@smarthealth.com',
  'Doctor': 'doctor@smarthealth.com',
  'Pharmacist': 'pharmacist@smarthealth.com',
  'Hospital Administrator': 'admin@smarthealth.com',
  'Supplier': 'supplier@smarthealth.com'
};

export const fetchAPI = async (endpoint, options = {}, activeRole = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If a role is passed, set the backdoor header so the server loads that user
  if (activeRole && ROLE_EMAILS[activeRole]) {
    headers['x-demo-email'] = ROLE_EMAILS[activeRole];
  }

  // Attach JWT if saved in localStorage
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};
