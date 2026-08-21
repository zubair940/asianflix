import React, { useState } from 'react';
import { Rating } from '../../types.js';
import { RatingStars } from './RatingStars.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { userService } from '../../services/userService.js';
import { adminService } from '../../services/adminService.js';
import { formatDate } from '../../utils/helpers.js';
import { MessageSquare, Send, Trash2, User as UserIcon } from 'lucide-react';

interface ReviewSectionProps {
  dramaId: string;
  reviews: Rating[];
  onReviewAdded: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  dramaId,
  reviews,
  onReviewAdded
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [userRating, setUserRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!user) {
      showToast('Please login to leave a review', 'info');
      return;
    }

    if (!comment.trim()) {
      showToast('Please write your review comment', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await userService.addRating(dramaId, userRating, comment.trim());
      showToast('Review posted successfully!', 'success');
      setComment('');
      onReviewAdded();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await adminService.deleteReview(reviewId);
      showToast('Review deleted', 'info');
      onReviewAdded();
    } catch (err: any) {
      showToast(err.message || 'Error deleting review', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-rose-500" />
        User Reviews & Ratings ({reviews.length})
      </h3>

      {/* Review Submission Form */}
      {user ? (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Rate this Drama:</span>
            <RatingStars rating={userRating} editable size="lg" onRatingChange={setUserRating} />
          </div>

          <textarea
            rows={3}
            placeholder="Share your thoughts about this K-Drama, acting, soundtrack or storyline..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/80 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
          Want to share your rating? Sign in to submit a review.
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No reviews yet. Be the first to rate this drama!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={rev.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                    alt={rev.userName}
                    className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{rev.userName}</h4>
                    <span className="text-[10px] text-slate-500">{formatDate(rev.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RatingStars rating={rev.rating} size="sm" />
                  {(isAdmin || user?.id === rev.userId) && (
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-10">{rev.review}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
