import os

path = 'API/src/modules/dev/__tests__/dev.seed.test.ts'
with open(path, 'r') as f:
    content = f.read()

content = content.replace("User.findById(fixedUserId)", "User.findById(fixedUserId).select('+password')")
content = content.replace("User.findOne({ email: 'random@test.com' })", "User.findOne({ email: 'random@test.com' }).select('+password')")

with open(path, 'w') as f:
    f.write(content)
