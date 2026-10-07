import os

path = 'API/src/modules/dev/__tests__/dev.seed.test.ts'
with open(path, 'r') as f:
    content = f.read()

content = content.replace("password: 'devdev',", "password: 'devdev',\n                phone: '1234567890',")
content = content.replace("password: 'dummy_password'", "password: 'dummy_password',\n                phone: '0987654321'")

with open(path, 'w') as f:
    f.write(content)
