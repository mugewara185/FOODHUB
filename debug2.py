import os

path = 'API/src/modules/dev/dev.controller.ts'
with open(path, 'r') as f:
    content = f.read()

content = content.replace("if (we.code === 11000 && doc && doc.__isFixed) {", "console.error('WE IS:', we, 'DOC IS:', doc); if (we.code === 11000 && doc && doc.__isFixed) {")

with open(path, 'w') as f:
    f.write(content)
