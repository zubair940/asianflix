import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { userService } from '../../services/userService.js';
import { useToast } from '../../context/ToastContext.js';
import { User, Check, Loader2, X } from 'lucide-react';

interface AvatarSelectorProps {
  onClose: () => void;
  onSelect?: (index: number) => void;
}

const AVATAR_COUNT = 20;

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ onClose, onSelect }) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [avatars, setAvatars] = useState<{ index: number; url: string; name: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(user?.avatarIndex ?? 0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const res = await userService.getAvailableAvatars();
        setAvatars(res.avatars);
      } catch (err) {
        const fallbackAvatars = Array.from({ length: AVATAR_COUNT }, (_, i) => ({
          index: i,
          url: `https://api.dicebear.com/7.x/avataaars/svg?seed=avatar_${i}`,
          name: `Avatar ${i + 1}`
        }));
        setAvatars(fallbackAvatars);
      }
    };
    fetchAvatars();
  }, []);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const res = await userService.updateProfile(undefined, undefined, selectedIndex);
      updateUser(res.user);
      showToast('Avatar updated successfully', 'success');
      onSelect?.(selectedIndex);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to update avatar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Select Avatar</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close avatar selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {avatars.map((avatar) => (
              <button
                key={avatar.index}
                onClick={() => handleSelect(avatar.index)}
                className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all duration-200 ${
                  selectedIndex === avatar.index
                    ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                    : 'border-gray-800 hover:border-gray-600'
                }`}
                aria-label={avatar.name}
                aria-pressed={selectedIndex === avatar.index}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selectedIndex === avatar.index && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Check className="w-8 h-8 text-cyan-400 drop-shadow-lg" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {avatars.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-400" />
              <p>Loading avatars...</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedIndex === user?.avatarIndex}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-gray-950 font-bold shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Avatar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;