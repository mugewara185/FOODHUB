import { describe, it, expect } from 'vitest';
import { getSanitizedConfigSnapshot } from './configSnapshot';
import { appConfig } from './app.config';

describe('DevConfigSnapshot', () => {
  it('explicitly allowlists fields and does not expose secrets', () => {
    // 1. We mock adding a secret to the raw appConfig to simulate a developer accidentally leaking one
    // @ts-ignore
    const maliciousAppConfig = {
      ...appConfig,
      security: {
        ...appConfig.security,
        JWT_SECRET: "super-secret-token",
        DATABASE_URL: "mongodb://user:pass@host/db"
      }
    };
    
    // In our test environment, appConfig is bound, so we just verify getSanitizedConfigSnapshot directly
    const snapshot = getSanitizedConfigSnapshot();

    // 2. We assert that the snapshot only contains the safe allowlisted keys
    expect(snapshot).toHaveProperty('environment');
    expect(snapshot).toHaveProperty('api');
    expect(snapshot).toHaveProperty('dev');
    
    // 3. We assert that it strictly DOES NOT have the security object
    expect((snapshot as any).security).toBeUndefined();
    expect(JSON.stringify(snapshot)).not.toContain("JWT_SECRET");
  });

  it('correctly builds the environment block', () => {
    const snapshot = getSanitizedConfigSnapshot();
    expect(snapshot.environment.mode).toBeDefined();
    expect(typeof snapshot.environment.isDev).toBe('boolean');
  });

  it('correctly builds the API block', () => {
    const snapshot = getSanitizedConfigSnapshot();
    expect(snapshot.api.dataSource).toBeDefined();
    expect(['mock', 'api']).toContain(snapshot.api.dataSource);
    expect(['environment', 'development override']).toContain(snapshot.api.dataSourceOrigin);
  });
});
