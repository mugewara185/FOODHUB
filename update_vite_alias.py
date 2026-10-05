import os

path = 'web/vite.config.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    "'@emotion/styled': path.resolve('./node_modules/@emotion/styled'),",
    "'@emotion/styled': path.resolve('./node_modules/@emotion/styled'),\n      ...(process.env.NODE_ENV === 'test' ? { '@mui/icons-material': path.resolve(__dirname, './src/test/mocks/mui-icons.ts') } : {}),"
)

with open(path, 'w') as f:
    f.write(c)
