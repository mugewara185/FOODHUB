import type { ReviewItem } from '../../shared/components/ui/ReviewComponents/ReviewComponents';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> | T;

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload && payload.message
        ? String(payload.message)
        : 'Request failed';
    throw new Error(message);
  }

  if (typeof payload === 'object' && payload && 'data' in payload) {
    return (payload as ApiResponse<T>).data as T;
  }

  return payload as T;
};

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
    const payload = await request<ReviewListPayload>(`/reviews/restaurant/${restaurantId}`);
    return payload.reviews.map(normalizeReview);
  },

  async createReview(
    restaurantId: string,
    data: { rating: number; comment: string },
    token: string
  ): Promise<ReviewItem> {
    const payload = await request<ReviewPayload>('/reviews', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurantId,
        rating: data.rating,
        comment: data.comment,
      }),
    });

    return normalizeReview(payload);
  },
};
