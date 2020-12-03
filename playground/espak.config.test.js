module.exports = {
  mount: {
    public: '/',
    src: '/_dist_',
  },
  devOptions: {
    port: 9999,
    open: 'chrome',
  },
  plugins: [
    '@espak/plugin-react-refresh',
    '@espak/plugin-dotenv',
    "@espak/plugin-typescript"
  ],
};
