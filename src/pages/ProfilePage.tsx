import React from 'react';
import { UserProfile } from '../components/user/UserProfile.js';

interface ProfilePageProps {
  defaultTab?: 'watchlist' | 'history';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ defaultTab }) => {
  return <UserProfile defaultTab={defaultTab} />;
};
