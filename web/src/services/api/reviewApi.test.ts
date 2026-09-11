import { describe, expect, it } from 'vitest';
import { normalizeReview } from './reviewApi';

describe('normalizeReview', () => {
  it('maps backend review payload to the UI review shape', () => {
    const result = normalizeReview({
      _id: 'review-1',
      userName: 'Mina',
      rating: 5,
      comment: 'Loved the biryani',
      createdAt: '2024-01-15T00:00:00.000Z',
      userId: { name: 'Mina', avatar: 'avatar.png' },
    });

    expect(result).toEqual({
      id: 'review-1',
      userName: 'Mina',
      userAvatar: 'avatar.png',
      rating: 5,
      comment: 'Loved the biryani',
      createdAt: '2024-01-15T00:00:00.000Z',
    });
  });

  it('falls back to a friendly anonymous label when no user data is present', () => {
    const result = normalizeReview({
      rating: 4,
      comment: 'Fast delivery',
    });

    expect(result.userName).toBe('Anonymous guest');
    expect(result.rating).toBe(4);
    expect(result.comment).toBe('Fast delivery');
  });
});
