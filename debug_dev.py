import os

path = 'API/src/modules/dev/dev.controller.ts'
with open(path, 'r') as f:
    content = f.read()

content = content.replace("modelErrors.push({ message: insertErr.message?.substring(0, 200) });", "modelErrors.push({ message: insertErr.message }); console.error('GENUINE ERROR', insertErr);")

with open(path, 'w') as f:
    f.write(content)
