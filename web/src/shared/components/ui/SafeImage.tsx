import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';
import { RestaurantMenu } from '@mui/icons-material';

const DEFAULT_FALLBACK_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANUAAACUCAMAAAAzmpx4AAAANlBMVEXm6ezc3+Lp7O/W2t63vsattb2dp7Ht8PKPmaWqsbrb3uOTnamkrbaXoayyucHh5OfCyM7IztMwfhuPAAABTUlEQVR4nO3Y0W7CIBSAYXooYAVK+/4vu4I1U7slS5qs4eT/LtQwxZ8CKsYAAAAAAAAAAAAAAAAAAAAAAAAAfyFHV0/pNCn2qHTeFWzyR8mGqyd2ivU5uU8pe3v1xM6QMa7haIljz2tQxlv5YXS49V41bG9hGN4q7hqqwpxzeh3WUCVrTFN2L8eehqrgtiMv5UdVq1FRteR59KlWSVnrsIYqY3yM+1no2krUURVse0RSUk7ZGdFRZdoPWilTnIc5zkVJVftc3BYkZnvVU1VzJvOIS1lJVV1+rqWI2b6UdVS1PfUc3LJUVD331D5qVeyrGjWZ7xAVv9nFPPfUTsMZWKPmt+H+q0p421NN9yswLlJPvM9/+EvPVfU2xufs3PQqZX+/emKn1JuzdLg8m2zXj+qXW07TeRQAAAAAAAAAAAAAAAAAAAAAAAD+y6DRF1ANDSRFLNpuAAAAAElFTkSuQmCC';

export interface SafeImageProps extends Omit<BoxProps<'img'>, 'src' | 'alt' | 'onError'> {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Image',
  fallbackSrc = DEFAULT_FALLBACK_IMG,
  fallbackIcon,
  loading = 'lazy',
  decoding = 'async',
  onError,
  sx,
  className,
  style,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Consider an empty string or null as an immediate error
  const isBroken = hasError || !src;
  const resolvedSrc = isBroken ? fallbackSrc : src;

  return (
    <Box
      className={className}
      style={style}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        ...sx,
      }}
    >
      <Box
        component="img"
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          if (!hasError) {
            setHasError(true);
            e.currentTarget.removeAttribute('srcset');
            if (import.meta.env.DEV) {
              try {
                const host = src ? new URL(src, window.location.origin).hostname : 'unknown';
                console.debug(`[SafeImage] Image failed to load from host: ${host}, falling back to placeholder`);
              } catch {
                console.debug('[SafeImage] Image failed to load, falling back to placeholder');
              }
            }
            onError?.(e);
          }
        }}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isBroken ? 'none' : 'block',
        }}
        {...props}
      />
      {isBroken && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 100%)',
            color: 'text.secondary',
            userSelect: 'none',
          }}
        >
          {fallbackIcon || (
            <RestaurantMenu
              sx={{
                fontSize: '2.2rem',
                opacity: 0.4,
                color: 'text.secondary',
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};
