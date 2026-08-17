import { apiRequest } from './api.js';
import { DashboardStats, User } from '../types.js';

function xhrUpload(
  url: string,
  method: string,
  file: File | FormData,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void
): Promise<{ ok: boolean; status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.send(file);
  });
}

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

  uploadFile: async (file: File, onProgress?: (percent: number) => void) => {
    try {
      // Preferred path: presigned upload straight from the browser to R2.
      // Works on Vercel serverless (no request body size limit, no local
      // filesystem writes) and keeps large files out of the server's memory.
      const presign = await apiRequest<{ uploadUrl: string; publicUrl: string; key: string }>('/admin/upload/presigned-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream' })
      });

      if (!presign.uploadUrl) {
        throw new Error('R2 not ready');
      }

      const putRes = await xhrUpload(
        presign.uploadUrl,
        'PUT',
        file,
        { 'Content-Type': file.type || 'application/octet-stream', 'X-Requested-With': 'XMLHttpRequest' },
        onProgress
      );

      if (!putRes.ok) {
        throw new Error(`R2 upload failed (${putRes.status})`);
      }

      return { url: presign.publicUrl, filename: presign.key };
    } catch {
      onProgress?.(0);
      // Fallback path: proxy through the server. Locally the file is saved to
      // the uploads/ dir; on serverless platforms it is pushed to R2 when
      // configured, otherwise a clear message is returned.
      const formData = new FormData();
      formData.append('file', file);
      const res = await xhrUpload('/api/upload/file', 'POST', formData, {}, onProgress);
      if (!res.ok) {
        throw new Error(res.json?.message || `Upload failed (${res.status})`);
      }
      return { url: res.json.url, filename: res.json.filename };
    }
  }
};
