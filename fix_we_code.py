import os

path = 'API/src/modules/dev/dev.controller.ts'
with open(path, 'r') as f:
    content = f.read()

# I will replace the we.code check with (we.code === 11000 || we.err?.code === 11000)
content = content.replace("if (we.code === 11000 && doc && doc.__isFixed) {", "const errCode = we.code || we.err?.code; if (errCode === 11000 && doc && doc.__isFixed) {")
content = content.replace("code: we.code,", "code: we.code || we.err?.code,")
content = content.replace("message: we.errmsg?.substring(0, 200)", "message: (we.errmsg || we.err?.errmsg)?.substring(0, 200)")

with open(path, 'w') as f:
    f.write(content)
