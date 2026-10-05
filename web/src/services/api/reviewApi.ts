import { appConfig } from '../../core/config/app.config';
import type { ReviewItem } from '../../shared/components/ui/ReviewComponents/ReviewComponents';

const API_BASE_URL = appConfig.api.baseUrl;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ReviewPayload {
  _id?: string;
  id?: string;
  userName?: string;
  userId?: {
    _id?: string;
    id?: string;
    name?: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt?: string;
}

interface ReviewListPayload {
  reviews: ReviewPayload[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

import api from '../../core/utils/api';

export const normalizeReview = (payload: ReviewPayload): ReviewItem => {
  const author = payload.userId || undefined;
  const normalizedId = payload._id || payload.id || `review-${Date.now()}`;

  return {
    id: normalizedId,
    userName: payload.userName || author?.name || 'Anonymous guest',
    userAvatar: author?.avatar,
    rating: Number(payload.rating || 0),
    comment: payload.comment || '',
    createdAt: payload.createdAt || new Date().toISOString(),
  };
};

export const reviewApi = {
  async listRestaurantReviews(restaurantId: string): Promise<ReviewItem[]> {
    const payload = await api.request<ReviewListPayload>('/reviews/restaurant/' + restaurantId);
    return payload.reviews.map(normalizeReview);
  },

  async checkEligibility(restaurantId: string, token: string): Promise<{ eligible: boolean; orderId?: string }> {
    return api.request<{ eligible: boolean; orderId?: string }>('/reviews/eligibility/' + restaurantId, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
  },

  async createReview(
    orderId: string,
    data: { rating: number; comment: string; partnerRating?: number },
    token: string
  ): Promise<ReviewItem> {
    const payload = await api.request<ReviewPayload>('/reviews', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({
        orderId,
        restaurantRating: data.rating,
        partnerRating: data.partnerRating ?? 5,
        comment: data.comment,
      }),
    });

    return normalizeReview(payload);
  },
};
