const { createProxyMiddleware } = require("http-proxy-middleware");
const { getBotProperties, fetchImages } = require("./ait-metadata");

/**
 * Middleware function for AIT Chatbot.
 * @param {object} secrets - The secrets object.
 * @returns {Function} - The middleware function.
 */

function aitChatBotMiddleware(secrets) {
  const { clientid, apiKey } = secrets;

  return async (req, res, next) => {
    if (!clientid?.trim() || !apiKey?.trim()) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "Clientid and apikey are required.",
        })
      );
    }
    const isValid = await checkIsValidSecrets(clientid, apiKey);
    if (!isValid) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "Invalid clientid or apikey.",
        })
      );
    }
    else if (req.path === "/api/conversation") {
      // Manually read the body from the request (since req.body will be undefined)
      let bodyChunks = [];

      req.on("data", (chunk) => {
        bodyChunks.push(chunk);
      });

      req.on("end", () => {
        const rawBody = Buffer.concat(bodyChunks).toString();

        let modifiedBody;
        try {
          // Parse the original body and add the client_id
          const originalBody = JSON.parse(rawBody);
          modifiedBody = { ...originalBody, client_id: clientid };
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON format" }));
          return;
        }

        const bodyData = JSON.stringify(modifiedBody);

        const proxy = createProxyMiddleware({
          target: process.env.AIT_BOT_COVERSATION_URL,
          changeOrigin: true,
          pathRewrite: { "^/api/conversation": "" },
          on: {
            proxyReq: (proxyReq, req, res) => {
              // Set headers for the new body
              proxyReq.setHeader("Content-Type", "application/json");
              proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

              // Set the x-apikey header with your API key
              proxyReq.setHeader("x-api-key", apiKey);

              // Write the new body data to the proxy request
              proxyReq.write(bodyData);
              proxyReq.end(); // Important to send the request
            },
          },
        });

        // Handle the proxy and pass the modified request
        proxy(req, res, (err) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Proxy request failed" }));
          }
        });
      });
      req.on("error", (err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server error" }));
      });
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
