import os

path = 'web/vite.config.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace("import { defineConfig } from 'vite'", "import { defineConfig } from 'vitest/config'")

with open(path, 'w') as f:
    f.write(c)
