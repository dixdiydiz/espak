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
  cjsModule: {
    react: "import { React } from 'https://unpkg.com/es-react';export default React;",
    'react-dom': "import { ReactDOM } from 'https://unpkg.com/es-react';export default ReactDOM;",
  },
  plugins: [],
}
