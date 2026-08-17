import { apiRequest } from './api.js';
import { DashboardStats, User } from '../types.js';

export const adminService = {
  getDashboardStats: () => {
    return apiRequest<DashboardStats>('/admin/dashboard');
  },

  getAllUsers: () => {
    return apiRequest<User[]>('/admin/users');
  },

  toggleBlockUser: (userId: string) => {
    return apiRequest<{ message: string; isBlocked: boolean }>(`/admin/users/${userId}/block`, {
      method: 'PUT'
    });
  },

  deleteUser: (userId: string) => {
    return apiRequest<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  deleteReview: (reviewId: string) => {
    return apiRequest<{ message: string }>(`/admin/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  },

  uploadFile: async (file: File) => {
    try {
      // Preferred path: presigned upload straight from the browser to R2.
      // Works on Vercel serverless (no request body size limit) and keeps
      // large files (videos) out of the server's memory.
      const presign = await apiRequest<{ uploadUrl: string; publicUrl: string; key: string }>('/r2/presign/upload', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' })
      });

      if (!presign.uploadUrl) {
        throw new Error('R2 not ready');
      }

      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!putRes.ok) {
        throw new Error(`R2 upload failed (${putRes.status})`);
      }

      return { url: presign.publicUrl, filename: presign.key };
    } catch {
      // Fallback path: proxy through the server (saves to local uploads/ dir).
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest<{ url: string; filename: string }>('/upload/file', {
        method: 'POST',
        body: formData
      });
    }
  }
};
