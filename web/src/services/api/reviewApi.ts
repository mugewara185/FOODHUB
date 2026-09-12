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

import { logAPI } from '../../core/dev/logger';
import { v4 as uuidv4 } from 'uuid';

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const { headers: customHeaders, ...restInit } = init || {};
  const traceId = uuidv4().substring(0, 8);
  const method = init?.method || 'GET';
  const url = `${API_BASE_URL}${endpoint}`;

  let parsedBody;
  try {
    parsedBody = restInit?.body ? JSON.parse(restInit.body as string) : undefined;
  } catch(e) {}

  logAPI.request(method, url, parsedBody, traceId);
  const startTime = performance.now();

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...restInit,
  });

  const durationMs = performance.now() - startTime;
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> | T;

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload && payload.message
        ? String(payload.message)
        : 'Request failed';
    logAPI.error(method, url, new Error(message), traceId);
    throw new Error(message);
  }

  logAPI.response(method, url, response.status, durationMs, payload, traceId);

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
