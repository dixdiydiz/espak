const path = require('path')
module.exports = {
  entry: { a: 'src/index.tsx' },
  outputDir: 'dist',
  devOptions: {
    port: 9999,
    open: 'chrome',
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [],
}
