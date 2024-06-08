const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Middleware function for AIT Chatbot.
 * @param {object} secrets - The secrets object.
 * @returns {Function} - The middleware function.
 */
function aitChatBotMiddleware (secrets) {
    return async (req, res, next) => {
        if (req.path === '/api/conversation') {
            const proxy = createProxyMiddleware({
                target: 'http://ait-query-api.us-east-1.elasticbeanstalk.com/api/conversation',
                changeOrigin: true,
                pathRewrite: { '^/api/conversation': '' }
            });

            try {
                await new Promise((resolve, reject) => {
                    proxy(req, res, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            } catch (err) {
                next(err);
            }
        } else {
            next();
        }
    }
}

module.exports = {
    aitChatBotMiddleware
}