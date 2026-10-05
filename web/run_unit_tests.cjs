const { buildSync } = require('esbuild');
buildSync({
  entryPoints: ['src/core/utils/__tests__/asyncState.test.ts'],
  bundle: true,
  outfile: 'unit.cjs',
  format: 'cjs',
  platform: 'node',
});
require('./unit.cjs');
