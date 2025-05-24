import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

export const universityAPI = {
  // Get all universities with optional filters
  getUniversities: (params?: any) => {
    return api.get('/universities', { params });
  },

  // Get university by ID
  getUniversityById: (id: number) => {
    return api.get(`/universities/${id}`);
  },

  // Match universities based on academic profile
  matchUniversities: (academicProfile: any) => {
    return api.post('/universities/match', academicProfile);
  },

  // Save university to user's list
  saveUniversity: (universityId: number) => {
    return api.post('/universities/save', { universityId });
  },

  // Get user's saved universities
  getSavedUniversities: () => {
    return api.get('/universities/saved/list');
  },

  // Remove saved university
  removeSavedUniversity: (savedId: number) => {
    return api.delete(`/universities/saved/${savedId}`);
  },
};

export const authAPI = {
  // Register user profile
  register: (userData: any) => {
    return api.post('/auth/register', userData);
  },

  // Get user profile
  getProfile: () => {
    return api.get('/auth/profile');
  },

  // Update user profile
  updateProfile: (userData: any) => {
    return api.put('/auth/profile', userData);
  },

  // Verify token
  verifyToken: () => {
    return api.get('/auth/verify');
  },
};

export const userAPI = {
  // Get user by ID
  getUserById: (userId: string) => {
    return api.get(`/users/${userId}`);
  },

  // Get all users (admin only)
  getAllUsers: (params?: any) => {
    return api.get('/users', { params });
  },
};

export default api;
