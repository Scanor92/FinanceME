const appJson = require('./app.json');

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  appJson.expo.extra?.apiBaseUrl;

module.exports = () => ({
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra || {}),
    apiBaseUrl: configuredBaseUrl,
  },
});
