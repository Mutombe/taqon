import api from './axios';

// Fetch comments for a specific content item
export const getComments = async (contentType, slug, page = 1) => {
  const response = await api.get('/comments/', {
    params: { content_type: contentType, slug, page },
  });
  return response.data;
};

// Create a new comment
export const createComment = async (data) => {
  const response = await api.post('/comments/create/', data);
  return response.data;
};

// Like a comment
export const likeComment = async (commentId) => {
  const response = await api.post(`/comments/${commentId}/like/`);
  return response.data;
};
