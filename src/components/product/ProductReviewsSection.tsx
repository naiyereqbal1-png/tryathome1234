import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  Edit3,
  Trash2,
  Filter,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, ProductReview } from '../../types';
import { WriteReviewModal } from './WriteReviewModal';

interface ProductReviewsSectionProps {
  product: Product;
  onOpenCustomerLogin?: () => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  onOpenCustomerLogin,
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'RATING_HIGH' | 'RATING_LOW'>('NEWEST');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<string>('');
  const [selectedOrderItemForReview, setSelectedOrderItemForReview] = useState<string | undefined>(undefined);

  const loadReviews = () => {
    const list = db.getProductReviews(product.id);
    setReviews(list);
  };

  useEffect(() => {
    loadReviews();

    const handleDataChange = () => {
      loadReviews();
    };

    window.addEventListener('style1_data_changed', handleDataChange);
    return () => {
      window.removeEventListener('style1_data_changed', handleDataChange);
    };
  }, [product.id]);

  const currentCustomer = db.getCurrentCustomer();
  const eligibility = db.checkCustomerReviewEligibility(product.id, currentCustomer?.customer_id);
  const stats = db.getProductRatingStats(product.id);

  const handleOpenWriteReview = () => {
    if (!currentCustomer) {
      if (onOpenCustomerLogin) {
        onOpenCustomerLogin();
      }
      return;
    }

    if (eligibility.existingReview) {
      alert("You have already submitted a review for this product. Customer reviews cannot be modified or deleted once submitted.");
      return;
    }

    if (eligibility.eligibleOrders.length > 0) {
      const order = eligibility.eligibleOrders[0];
      const orderItem = order.items.find((it) => it.product_id === product.id);
      setEditingReview(null);
      setSelectedOrderForReview(order.order_id);
      setSelectedOrderItemForReview(orderItem?.id);
      setIsWriteModalOpen(true);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to remove your review?')) {
      await db.deleteProductReviewAsync(reviewId);
      loadReviews();
    }
  };

  // Filter & Sort reviews
  const filteredReviews = reviews
    .filter((r) => {
      if (starFilter === 'ALL') return true;
      return Math.round(Number(r.rating)) === starFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'RATING_HIGH') {
        return b.rating - a.rating;
      }
      if (sortBy === 'RATING_LOW') {
        return a.rating - b.rating;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div id="product-reviews-container" className="mt-10 pt-8 border-t border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Customer Ratings & Reviews</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {stats.total_reviews} {stats.total_reviews === 1 ? 'Review' : 'Reviews'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified feedback from customers who purchased this item
          </p>
        </div>

        {/* Write / Edit Review Button */}
        <div>
          {currentCustomer ? (
            eligibility.existingReview ? (
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Review Submitted ({eligibility.existingReview.rating}★)</span>
                </span>
              </div>
            ) : eligibility.isEligible ? (
              <button
                id="write-product-review-btn"
                onClick={handleOpenWriteReview}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Write a Review</span>
              </button>
            ) : (
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Verified Buyer Review Only
                </span>
              </div>
            )
          ) : (
            <button
              id="login-to-review-btn"
              onClick={onOpenCustomerLogin}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <span>Log in to Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Ratings Scorecard & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-slate-50/80 rounded-2xl border border-slate-200 mb-8">
        {/* Left: Big Rating Number */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {stats.average_rating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(stats.average_rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200 fill-slate-100'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-600">
            Based on {stats.total_reviews} verified rating{stats.total_reviews === 1 ? '' : 's'}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine Buyers
          </div>
        </div>

        {/* Right: Star Breakdown Progress Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.star_counts[star] || 0;
            const percentage = stats.star_percentages[star] || 0;
            return (
              <button
                key={star}
                id={`filter-star-bar-${star}`}
                onClick={() => setStarFilter(starFilter === star ? 'ALL' : star)}
                className={`flex items-center gap-3 text-xs w-full group text-left rounded-lg p-1 transition-colors ${
                  starFilter === star ? 'bg-indigo-50/80 ring-1 ring-indigo-200' : 'hover:bg-slate-100/70'
                }`}
              >
                <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                  {star} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right font-semibold text-slate-500 text-[11px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            id="filter-reviews-all"
            onClick={() => setStarFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              starFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              id={`filter-reviews-star-${s}`}
              onClick={() => setStarFilter(starFilter === s ? 'ALL' : s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                starFilter === s
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{s}★</span>
              <span className="text-[10px] opacity-70">({stats.star_counts[s as 1 | 2 | 3 | 4 | 5] || 0})</span>
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Sort by:</span>
          <select
            id="reviews-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-hidden focus:border-indigo-600"
          >
            <option value="NEWEST">Most Recent</option>
            <option value="RATING_HIGH">Highest Rating</option>
            <option value="RATING_LOW">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">
              {reviews.length === 0
                ? 'No reviews yet for this product'
                : 'No reviews match your selected filter'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {reviews.length === 0
                ? 'Purchased this item? Share your thoughts and help others make the right choice!'
                : 'Try resetting the filter to see all verified reviews.'}
            </p>
            {reviews.length === 0 && (eligibility.isEligible || eligibility.existingReview) && (
              <button
                id="be-first-review-btn"
                onClick={handleOpenWriteReview}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                Be the first to review
              </button>
            )}
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isOwnReview =
              currentCustomer &&
              (rev.customer_id === currentCustomer.customer_id ||
                rev.customer_id === currentCustomer.id);

            return (
              <div
                key={rev.id}
                id={`review-card-${rev.id}`}
                className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* User Avatar Initial */}
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      {rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {rev.customer_name}
                        </span>
                        {rev.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>


                </div>

                {/* Star Rating & Review Title */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.review_title && (
                      <span className="font-bold text-xs text-slate-900">{rev.review_title}</span>
                    )}
                  </div>

                  {/* Review Text */}
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
                    {rev.review_text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        productId={product.id}
        productName={product.name}
        productImage={product.images && product.images[0]?.image_url}
        orderId={selectedOrderForReview}
        orderItemId={selectedOrderItemForReview}
        existingReview={editingReview}
        onSuccess={() => {
          loadReviews();
        }}
      />
    </div>
  );
};
