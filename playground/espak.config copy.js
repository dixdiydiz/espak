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
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-dotenv',
    "@snowpack/plugin-typescript"
  ],
};