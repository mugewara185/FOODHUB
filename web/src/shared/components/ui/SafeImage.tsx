import React, { useState } from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';

const FALLBACK_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANUAAACUCAMAAAAzmpx4AAAANlBMVEXm6ezc3+Lp7O/W2t63vsattb2dp7Ht8PKPmaWqsbrb3uOTnamkrbaXoayyucHh5OfCyM7IztMwfhuPAAABTUlEQVR4nO3Y0W7CIBSAYXooYAVK+/4vu4I1U7slS5qs4eT/LtQwxZ8CKsYAAAAAAAAAAAAAAAAAAAAAAAAAfyFHV0/pNCn2qHTeFWzyR8mGqyd2ivU5uU8pe3v1xM6QMa7haIljz2tQxlv5YXS49V41bG9hGN4q7hqqwpxzeh3WUCVrTFN2L8eehqrgtiMv5UdVq1FRteR59KlWSVnrsIYqY3yM+1no2krUURVse0RSUk7ZGdFRZdoPWilTnIc5zkVJVftc3BYkZnvVU1VzJvOIS1lJVV1+rqWI2b6UdVS1PfUc3LJUVD331D5qVeyrGjWZ7xAVv9nFPPfUTsMZWKPmt+H+q0p421NN9yswLlJPvM9/+EvPVfU2xufs3PQqZX+/emKn1JuzdLg8m2zXj+qXW07TeRQAAAAAAAAAAAAAAAAAAAAAAAD+y6DRF1ANDSRFLNpuAAAAAElFTkSuQmCC';

interface SafeImageProps extends Omit<BoxProps<'img'>, 'src' | 'alt' | 'onError'> {
  src?: string | null;
  alt?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Image',
  sx,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Consider an empty string or null as an immediate error
  const isBroken = hasError || !src;

  const resolvedSrc = isBroken ? FALLBACK_IMG : src;

  return (
    <Box
      component="img"
      src={resolvedSrc}
      alt={alt}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
        if (!hasError) {
          setHasError(true);
          e.currentTarget.removeAttribute('srcset');
        }
      }}
      sx={sx}
      {...props}
    />
  );
};
