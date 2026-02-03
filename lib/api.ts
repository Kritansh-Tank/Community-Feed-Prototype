import axios from 'axios';

const getApiUrl = () => {
  // Use environment variable if set (production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window === 'undefined') {
    // Server-side: use localhost
    return 'http://localhost:8000/api';
  }
  // Client-side development: use the same hostname as the browser
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/api`;
};

const api = axios.create({
  baseURL: getApiUrl(),
});

export const getPosts = () => api.get('/posts/');
export const createPost = (data: { text: string; user: any }) => api.post('/posts/', data);
export const getPostComments = (id: number, params?: any) => api.get(`/posts/${id}/comments/`, { params });
export const likePost = (id: number, user?: any) => api.post(`/posts/${id}/like/`, { user });
export const likeComment = (id: number, user?: any) => api.post(`/comments/${id}/like/`, { user });
export const getLeaderboard = () => api.get('/leaderboard/');

export const deletePost = (id: number, user?: any) => api.delete(`/posts/${id}/`, { data: { user } });
export const createComment = (data: { text: string; post: number; parent?: number | null; user?: any }) => api.post('/comments/', data);

export default api;
