// @ts-nocheck

const { createProxyMiddleware } = require("http-proxy-middleware");
const { proxy } = require("../package.json");
module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: proxy,
      changeOrigin: true,
    })
  );
};
