const { createProxyMiddleware } = require("http-proxy-middleware");
const { getBotProperties, fetchImages } = require("./ait-metadata");

/**
 * Middleware function for AIT Chatbot.
 * @param {object} secrets - The secrets object.
 * @returns {Function} - The middleware function.
 */

function aitChatBotMiddleware(secrets) {
  const { clientid } = secrets;
  return async (req, res, next) => {
    if (req.path === "/api/conversation") {
      const proxy = createProxyMiddleware({
        target:
          "http://ait-query-api.us-east-1.elasticbeanstalk.com/api/conversation",
        changeOrigin: true,
        pathRewrite: { "^/api/conversation": "" },
        on: {
          proxyReq: (proxyReq, req, res) => {
            // If there is a body, modify it to include the clientid
            if (req.body) {
              const modifiedBody = { ...req.body, client_id: clientid };
              const bodyData = JSON.stringify(modifiedBody);

              // Set headers for the new body
              proxyReq.setHeader("Content-Type", "application/json");
              proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

              // Write the new body data to the proxy request
              proxyReq.write(bodyData);
              proxyReq.end(); // Important to send the request
            }
          },
        },
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
    } else if (req.path === "/api/metadata/texts") {
      try {
        const botProperties = await getBotProperties(clientid);

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
    } else if (req.path === "/api/metadata/images") {
      try {
        // Assuming clientid is passed in the query parameters
        const botImages = await fetchImages(clientid);

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
