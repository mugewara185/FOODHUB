import { describe, it, expect } from 'vitest';
import { buildRestaurantImageUrl } from '../image';

describe('buildRestaurantImageUrl', () => {
  describe('missing or invalid inputs', () => {
    it('returns undefined for undefined', () => {
      expect(buildRestaurantImageUrl(undefined)).toBeUndefined();
    });

    it('returns undefined for null', () => {
      expect(buildRestaurantImageUrl(null)).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(buildRestaurantImageUrl('')).toBeUndefined();
    });

    it('returns undefined for whitespace-only string', () => {
      expect(buildRestaurantImageUrl('   ')).toBeUndefined();
    });

    it('returns undefined for non-string input', () => {
      expect(buildRestaurantImageUrl(123 as unknown as string)).toBeUndefined();
    });

    it('returns undefined for unparseable malformed URL', () => {
      expect(buildRestaurantImageUrl('htt p://invalid url')).toBeUndefined();
    });
  });

  describe('Unsplash URLs without query parameters', () => {
    it('appends standard Unsplash query parameters using searchParams', () => {
      const input = 'https://images.unsplash.com/photo-1550547660-d9450f859349';
      const output = buildRestaurantImageUrl(input);

      expect(output).toBe(
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=225&fit=crop&q=80'
      );
    });

    it('supports custom dimensions and options', () => {
      const input = 'https://images.unsplash.com/photo-1550547660-d9450f859349';
      const output = buildRestaurantImageUrl(input, {
        width: 800,
        height: 450,
        fit: 'scale',
        quality: 90,
      });

      expect(output).toBe(
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=450&fit=scale&q=90'
      );
    });
  });

  describe('Unsplash URLs with existing query parameters', () => {
    it('overwrites width parameter without creating duplicate question marks', () => {
      const input = 'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?w=800';
      const output = buildRestaurantImageUrl(input);

      expect(output).toBe(
        'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?w=400&h=225&fit=crop&q=80'
      );
      expect(output).not.toContain('?w=800?');
    });

    it('preserves other existing query parameters while updating transform parameters', () => {
      const input = 'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?auto=format&w=800';
      const output = buildRestaurantImageUrl(input);

      const parsed = new URL(output!);
      expect(parsed.searchParams.get('auto')).toBe('format');
      expect(parsed.searchParams.get('w')).toBe('400');
      expect(parsed.searchParams.get('h')).toBe('225');
      expect(parsed.searchParams.get('fit')).toBe('crop');
      expect(parsed.searchParams.get('q')).toBe('80');
      expect(output).not.toContain('??');
    });

    it('sanitizes previously corrupted URLs containing multiple question marks', () => {
      const corrupted =
        'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?w=800?w=400&h=225&fit=crop&q=80';
      const output = buildRestaurantImageUrl(corrupted);

      expect(output).toBe(
        'https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?w=400&h=225&fit=crop&q=80'
      );
      expect(output?.split('?').length).toBe(2);
    });
  });

  describe('unrelated image hosts', () => {
    it('does not apply Unsplash parameters to Cloudinary URLs', () => {
      const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const output = buildRestaurantImageUrl(cloudinaryUrl);

      expect(output).toBe(cloudinaryUrl);
    });

    it('does not apply Unsplash parameters to AWS S3 URLs with existing query strings', () => {
      const s3Url = 'https://my-bucket.s3.amazonaws.com/restaurant-cover.png?versionId=v123';
      const output = buildRestaurantImageUrl(s3Url);

      expect(output).toBe(s3Url);
    });

    it('does not apply Unsplash parameters to arbitrary external domains', () => {
      const genericUrl = 'https://static.fooddelivery.com/images/rest1.jpg';
      const output = buildRestaurantImageUrl(genericUrl);

      expect(output).toBe(genericUrl);
    });
  });

  describe('local paths, data URIs, and blob URLs', () => {
    it('preserves absolute local asset paths', () => {
      const localPath = '/assets/restaurants/restaurant1.jpg';
      expect(buildRestaurantImageUrl(localPath)).toBe(localPath);
    });

    it('preserves relative local asset paths', () => {
      const relativePath = './images/food.png';
      expect(buildRestaurantImageUrl(relativePath)).toBe(relativePath);
    });

    it('preserves data URIs without modification', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(buildRestaurantImageUrl(dataUri)).toBe(dataUri);
    });

    it('preserves blob URLs without modification', () => {
      const blobUrl = 'blob:http://localhost:5173/1234-5678';
      expect(buildRestaurantImageUrl(blobUrl)).toBe(blobUrl);
    });
  });
});
