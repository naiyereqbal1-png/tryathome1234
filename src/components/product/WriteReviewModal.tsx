import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { db } from '../../services/db';
import { ProductReview } from '../../types';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  orderId: string;
  orderItemId?: string;
  existingReview?: ProductReview | null;
  onSuccess?: (review: ProductReview) => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  orderId,
  orderItemId,
  existingReview,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>(existingReview?.review_title || '');
  const [comment, setComment] = useState<string>(existingReview?.review_text || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setRating(existingReview?.rating || 5);
      setTitle(existingReview?.review_title || '');
      setComment(existingReview?.review_text || '');
      setErrorMessage('');
      setSuccessToast(false);
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const currentCustomer = db.getCurrentCustomer();

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return '1 Star — Poor';
      case 2:
        return '2 Stars — Fair';
      case 3:
        return '3 Stars — Good';
      case 4:
        return '4 Stars — Very Good';
      case 5:
        return '5 Stars — Excellent!';
      default:
        return 'Select a rating';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) {
      setErrorMessage('Please log in to submit your review.');
      return;
    }
    if (!comment.trim()) {
      setErrorMessage('Please share a few words about your experience with this product.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const saved = await db.saveProductReviewAsync({
        productId,
        orderId,
        orderItemId,
        customerId: currentCustomer.customer_id || currentCustomer.id,
        customerName: currentCustomer.name || 'Verified Buyer',
        customerMobile: currentCustomer.mobile,
        rating,
        reviewTitle: title.trim(),
        reviewText: comment.trim(),
      });

      setSuccessToast(true);
      if (onSuccess) onSuccess(saved);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStars = hoverRating || rating;

  return (
    <div
      id="write-review-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="write-review-modal-card"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {existingReview ? 'Update Your Review' : 'Rate & Review Product'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                Verified Purchase • Order #{orderId}
              </p>
            </div>
          </div>
          <button
            id="close-write-review-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Product Summary */}
          <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            {productImage ? (
              <img
                src={productImage || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                alt={productName}
                className="w-12 h-12 object-cover rounded-lg bg-white border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                PROD
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{productName}</p>
              <p className="text-[11px] text-slate-500">Delivered & Verified Order</p>
            </div>
          </div>

          {existingReview ? (
            <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-slate-600" />
              </div>
              <h4 className="text-base font-black text-slate-900">Review Submitted & Locked</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                You have already submitted a review ({existingReview.rating}★) for this garment. Reviews cannot be edited or deleted by customers after submission.
              </p>
              <div className="pt-2">
                <button
                  id="close-locked-review-btn"
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : successToast ? (
            <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Thank you for your review!</h4>
              <p className="text-xs text-slate-500">
                Your 5-star rating and feedback have been published.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Selection */}
              <div className="text-center py-2 bg-amber-50/50 rounded-xl border border-amber-100">
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Your Overall Rating
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      id={`star-rating-btn-${star}`}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= activeStars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-700 mt-2">
                  {getRatingLabel(activeStars)}
                </p>
              </div>

              {/* Review Title */}
              <div>
                <label
                  htmlFor="review-title-input"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Headline or Summary (Optional)
                </label>
                <input
                  id="review-title-input"
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Excellent fabric quality & perfect fit!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all"
                />
              </div>

              {/* Review Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="review-comment-textarea"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Written Review <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{comment.length}/1000</span>
                </div>
                <textarea
                  id="review-comment-textarea"
                  rows={4}
                  maxLength={1000}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell other shoppers what you liked about the material, comfort, sizing, and styling..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-hidden resize-none transition-all"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  id="cancel-write-review-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  id="submit-write-review-btn"
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="px-5 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
