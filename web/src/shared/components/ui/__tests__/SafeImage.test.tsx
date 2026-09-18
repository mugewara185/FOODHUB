import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { SafeImage } from '../SafeImage';

describe('SafeImage Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders native img when src is valid', () => {
    const { getByRole } = render(<SafeImage src="https://example.com/valid.jpg" alt="Valid" />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/valid.jpg');
  });

  it('renders fallback when src is undefined', () => {
    const { getByRole } = render(<SafeImage src={undefined} />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('data:image/png;base64'));
  });

  it('renders fallback when src is null', () => {
    const { getByRole } = render(<SafeImage src={null as any} />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('data:image/png;base64'));
  });

  it('renders fallback when src is empty string', () => {
    const { getByRole } = render(<SafeImage src="" />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('data:image/png;base64'));
  });

  it('transitions to fallback on image load error', () => {
    const { getByRole } = render(<SafeImage src="https://example.com/broken.jpg" alt="Broken" />);
    const img = getByRole('img');
    
    // Simulate natural load error
    fireEvent.error(img);

    expect(img).toHaveAttribute('src', expect.stringContaining('data:image/png;base64'));
  });
});
