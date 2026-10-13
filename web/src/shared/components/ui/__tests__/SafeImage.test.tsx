import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SafeImage } from '../SafeImage';

describe('SafeImage', () => {
  it('renders provided image source when valid', () => {
    render(<SafeImage src="https://example.com/image.jpg" alt="Test Restaurant" />);
    const img = screen.getByAltText('Test Restaurant') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/image.jpg');
  });

  it('renders fallback image immediately when src is undefined or null', () => {
    render(<SafeImage src={undefined} alt="Missing Image" />);
    const img = screen.getByAltText('Missing Image') as HTMLImageElement;
    expect(img.src).toContain('data:image/png;base64');
  });

  it('renders fallback image immediately when src is empty string', () => {
    render(<SafeImage src="" alt="Empty Image" />);
    const img = screen.getByAltText('Empty Image') as HTMLImageElement;
    expect(img.src).toContain('data:image/png;base64');
  });

  it('switches to fallback and calls onError when image fails to load', () => {
    const onError = vi.fn();
    render(
      <SafeImage
        src="https://images.unsplash.com/non-existent.jpg"
        alt="Failing Image"
        onError={onError}
      />
    );

    const img = screen.getByAltText('Failing Image') as HTMLImageElement;
    expect(img.src).toBe('https://images.unsplash.com/non-existent.jpg');

    fireEvent.error(img);

    expect(img.src).toContain('data:image/png;base64');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('resets error state when src prop changes to a new value', () => {
    const { rerender } = render(
      <SafeImage src="https://example.com/broken.jpg" alt="Dynamic Image" />
    );

    const img = screen.getByAltText('Dynamic Image') as HTMLImageElement;
    fireEvent.error(img);
    expect(img.src).toContain('data:image/png;base64');

    // Rerender with a new valid src
    rerender(<SafeImage src="https://example.com/fixed.jpg" alt="Dynamic Image" />);
    const updatedImg = screen.getByAltText('Dynamic Image') as HTMLImageElement;
    expect(updatedImg.src).toBe('https://example.com/fixed.jpg');
  });
});
