import React from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard.js';

interface AdminPageProps {
  initialTab?: 'stats' | 'dramas' | 'episodes' | 'users' | 'reviews' | 'analytics';
}

export const AdminPage: React.FC<AdminPageProps> = ({ initialTab }) => {
  return <AdminDashboard initialTab={initialTab} />;
};