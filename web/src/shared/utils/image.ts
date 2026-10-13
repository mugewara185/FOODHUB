export interface ImageTransformOptions {
  width?: number;
  height?: number;
  fit?: 'crop' | 'clip' | 'fill' | 'scale' | string;
  quality?: number;
}

/**
 * Builds or optimizes an image URL for restaurant cards and media components.
 *
 * Rules:
 * - If image is missing, empty, or not a string, returns undefined.
 * - Handles relative paths, data URIs, and blob URIs directly without mutation.
 * - For Unsplash images (images.unsplash.com or *.unsplash.com):
 *   Uses the URL and URLSearchParams API to safely apply or update width (w),
 *   height (h), fit (fit), and quality (q) parameters.
 *   Preserves existing valid query parameters (e.g., auto=format) and eliminates
 *   malformed query strings caused by naive concatenation (e.g., duplicate '?').
 * - For unrelated image hosts (e.g. S3, Cloudinary, custom CDNs):
 *   Preserves the original URL as-is without injecting Unsplash-specific parameters.
 */
export function buildRestaurantImageUrl(
  image: string | null | undefined,
  options?: ImageTransformOptions
): string | undefined {
  if (!image || typeof image !== 'string') {
    return undefined;
  }

  const trimmed = image.trim();
  if (!trimmed) {
    return undefined;
  }

  // Handle data URIs, blob URLs, and relative paths directly
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }

  // Sanitize any malformed duplicate '?' delimiters in the query string
  let sanitizedInput = trimmed;
  const firstQuestionMark = trimmed.indexOf('?');
  if (firstQuestionMark !== -1) {
    const base = trimmed.substring(0, firstQuestionMark);
    const query = trimmed.substring(firstQuestionMark + 1).replace(/\?/g, '&');
    sanitizedInput = `${base}?${query}`;
  }

  try {
    const url = new URL(sanitizedInput);

    // Only apply Unsplash-specific parameters to Unsplash hosts
    const isUnsplash =
      url.hostname === 'images.unsplash.com' ||
      url.hostname === 'unsplash.com' ||
      url.hostname.endsWith('.unsplash.com');

    if (isUnsplash) {
      const width = options?.width ?? 400;
      const height = options?.height ?? 225;
      const fit = options?.fit ?? 'crop';
      const quality = options?.quality ?? 80;

      url.searchParams.set('w', String(width));
      url.searchParams.set('h', String(height));
      url.searchParams.set('fit', fit);
      url.searchParams.set('q', String(quality));

      return url.toString();
    }

    // For unrelated external hosts, return the sanitized valid URL intact
    return url.toString();
  } catch {
    // If input is not a valid URL, return undefined so fallbacks engage safely
    return undefined;
  }
}
