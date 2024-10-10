const { createProxyMiddleware } = require("http-proxy-middleware");
const {
  getBotProperties,
  fetchImages,
} = require("./ait-metadata");

/**
 * Middleware function for AIT Chatbot.
 * @param {object} secrets - The secrets object.
 * @returns {Function} - The middleware function.
 */

const http = require("http");

const port = 3000;
function aitChatBotMiddleware(secrets) {
  return async (req, res, next) => {
    if (req.path === "/api/conversation") {
      const proxy = createProxyMiddleware({
        target:
          "http://ait-query-api.us-east-1.elasticbeanstalk.com/api/conversation",
        changeOrigin: true,
        pathRewrite: { "^/api/conversation": "" },
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
    } else if (secrets.path === "/api/metadata/texts") {
      try {
        const botProperties = await getBotProperties(secrets.query.clientid);

        if (botProperties && botProperties.properties) {
          // Setting the status and sending response
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: true,
              properties: botProperties.properties,
            })
          );
        } else {
          // Handling not found scenario
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: false,
              message: "Bot properties not found",
            })
          );
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: false,
            message: "Error fetching bot properties",
          })
        );
      }
    }else if (secrets.path === "/api/metadata/images") {
      try {
        // Assuming clientid is passed in the query parameters
        const botImages = await fetchImages(secrets.query.clientid);

        // Check if images were successfully retrieved
        if (botImages) {
          // Respond with JSON for successful retrieval
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: true, images: botImages }));
        } else {
          // Respond with 404 if no images are found
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ success: false, message: "Images not found" })
          );
        }
      } catch (error) {
        // Respond with 500 in case of an error
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: false,
            message: "Error fetching bot images",
          })
        );
      }
    } else {
        next();
    }
  };
}



module.exports = {
  aitChatBotMiddleware,
};
