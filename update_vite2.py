import os

path = 'web/vite.config.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    "setupFiles: ['./src/test/setup.ts'],",
    "setupFiles: ['./src/test/setup.ts'],\n    pool: 'forks',\n    poolOptions: { forks: { singleFork: true } },"
)

with open(path, 'w') as f:
    f.write(c)

print("Updated vite.config.ts pool options")
