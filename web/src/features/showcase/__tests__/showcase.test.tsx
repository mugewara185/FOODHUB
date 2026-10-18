import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import fs from 'fs';
import path from 'path';
import { SHOWCASE_DOMAINS, ENGINEERING_TRADEOFFS, ARCHITECTURE_NODES } from '../showcaseData';
import ShowcasePage from '../../../pages/Showcase';

// Mock Leaflet Map to avoid canvas/SVG JSDOM issues
vi.mock('../../../shared/components/maps/Map', () => ({
  default: () => <div data-testid="mock-map">Mock Leaflet Map</div>,
}));

// Mock API client to avoid unmocked network requests
vi.mock('../../../core/utils/api', () => ({
  default: {
    request: vi.fn().mockResolvedValue({ order: null, delivery: null, isTerminal: false }),
  },
  api: {
    request: vi.fn().mockResolvedValue({ order: null, delivery: null, isTerminal: false }),
  },
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }) => state,
      orders: (state = { items: [], currentOrder: null }) => state,
      cart: (state = { items: [] }) => state,
    },
  });

describe('FoodHub Engineering Showcase', () => {
  describe('Showcase Data & Source File Integrity', () => {
    it('defines all 5 expected domain models', () => {
      const domainIds = SHOWCASE_DOMAINS.map((d) => d.id);
      expect(domainIds).toEqual(['customer', 'owner', 'partner', 'admin', 'dev']);
    });

    it('every source file referenced in domain features actually exists in repository', () => {
      // Resolve path relative to repo root (web/../ is repo root)
      const repoRoot = path.resolve(__dirname, '../../../../../');

      SHOWCASE_DOMAINS.forEach((domain) => {
        domain.features.forEach((feature) => {
          const filePath = path.join(repoRoot, feature.sourceFile);
          const exists = fs.existsSync(filePath);
          expect(exists, `Expected source file ${feature.sourceFile} to exist on disk`).toBe(true);
        });
      });
    });

    it('every source file referenced in engineering trade-offs exists in repository', () => {
      const repoRoot = path.resolve(__dirname, '../../../../../');

      ENGINEERING_TRADEOFFS.forEach((tradeoff) => {
        tradeoff.sourceFiles.forEach((file) => {
          const filePath = path.join(repoRoot, file);
          const exists = fs.existsSync(filePath);
          expect(exists, `Expected tradeoff source file ${file} to exist on disk`).toBe(true);
        });
      });
    });

    it('verifies all status tags match authoritative verification classifications', () => {
      const validStatuses = [
        'Verified E2E',
        'Integration Verified',
        'Unit / Contract Tested',
        'Framework Architecture',
        'Client Observability',
        'Deterministic Simulation',
        'Dual Transport (Mock / API)',
        'Architectural Prototype',
        'Deferred Hardening',
      ];

      SHOWCASE_DOMAINS.forEach((domain) => {
        expect(validStatuses).toContain(domain.status);
        domain.features.forEach((f) => {
          expect(validStatuses).toContain(f.status);
        });
      });

      ENGINEERING_TRADEOFFS.forEach((t) => {
        expect(validStatuses).toContain(t.status);
      });
    });

    it('verifies all source files generate valid GitHub repository URLs', () => {
      const gitHubBase = 'https://github.com/mugewara185/FOODHUB/blob/dev/development';
      SHOWCASE_DOMAINS.forEach((domain) => {
        domain.features.forEach((f) => {
          expect(f.sourceFile).not.toMatch(/^file:\/\//i);
          expect(f.sourceFile.startsWith('web/') || f.sourceFile.startsWith('API/')).toBe(true);
        });
      });
    });

    it('contains zero exposed credentials, private tokens, or fake accounts in showcase text', () => {
      const serialized = JSON.stringify({ SHOWCASE_DOMAINS, ENGINEERING_TRADEOFFS, ARCHITECTURE_NODES });
      expect(serialized).not.toMatch(/password\s*[:=]/i);
      expect(serialized).not.toMatch(/Bearer\s+[a-zA-Z0-9_-]{20,}/i);
      expect(serialized).not.toMatch(/admin@foodhub\.internal/i);
    });
  });


  describe('Showcase Page Component Rendering', () => {
    it('renders the showcase hero header without authentication', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <ShowcasePage />
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText('FoodHub Distributed System Architecture')).toBeInTheDocument();
      expect(screen.getByText('ENGINEERING PORTFOLIO SHOWCASE')).toBeInTheDocument();
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    it('toggles 2-minute recruiter scan mode and reveals executive summary', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <ShowcasePage />
          </MemoryRouter>
        </Provider>
      );

      // Initially full mode
      const toggle = screen.getByLabelText(/2-Minute Recruiter Scan/i);
      expect(toggle).toBeInTheDocument();

      // Click to toggle quick scan mode
      fireEvent.click(toggle);

      // Executive summary should appear
      expect(screen.getByText('Executive Engineering Summary')).toBeInTheDocument();
      expect(screen.getByText('4-Actor Realtime State Machine')).toBeInTheDocument();
    });

    it('renders the interactive architecture map and switches nodes on click', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <ShowcasePage />
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText('Distributed System Topology & Realtime Event Loop')).toBeInTheDocument();
      
      // Click on Restaurant Owner Hub node
      const ownerNode = screen.getByText('Restaurant Owner Hub');
      fireEvent.click(ownerNode);

      // Verify selected node channels are displayed
      expect(screen.getByText('WS order_created')).toBeInTheDocument();
    });

    it('renders the interactive live demos tabs', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <ShowcasePage />
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText('Interactive Engineering Demonstrations')).toBeInTheDocument();
      expect(screen.getByText('1. Live GPS Tracking Simulator')).toBeInTheDocument();
      expect(screen.getByText('2. Component Version Hot-Swapper')).toBeInTheDocument();
      expect(screen.getByText('3. Realtime Telemetry & Logger')).toBeInTheDocument();
      expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    });
  });
});
