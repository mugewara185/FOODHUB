import os

path = 'web/vite.config.ts'
with open(path, 'r') as f:
    c = f.read()

if '/// <reference types="vitest"' not in c:
    c = '/// <reference types="vitest" />\n' + c

if 'test: {' not in c:
    c = c.replace(
        'server: {',
        '''test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  server: {'''
    )

with open(path, 'w') as f:
    f.write(c)

print("Updated vite.config.ts")
