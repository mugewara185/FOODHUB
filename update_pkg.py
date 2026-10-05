import json
import os

path = 'web/package.json'
with open(path, 'r') as f:
    pkg = json.load(f)

if 'test' not in pkg.get('scripts', {}):
    if 'scripts' not in pkg:
        pkg['scripts'] = {}
    pkg['scripts']['test'] = 'vitest run'

with open(path, 'w') as f:
    json.dump(pkg, f, indent=2)

print("Added test script to package.json")
