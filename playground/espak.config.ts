export default {
  entry: {a: 'src/index.tsx'},
  devOptions: {
    port: 9999,
    open: 'chrome',
  },
  plugins: ['@espak/plugin-react-refresh', '@espak/plugin-dotenv', '@espak/plugin-typescript'],
}
