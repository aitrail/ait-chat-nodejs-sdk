import { createProxyMiddleware } from "http-proxy-middleware";
import "dotenv/config";

/**
 * Middleware for creating proxy to Lambda endpoints.
 * @param {string} targetUrl - The target URL for the Lambda endpoint.
 * @param {string} pathPrefix - The API path prefix to remove from the request.
 * @param {string} clientid - The unique ID to identify and access your assets in AITrail.
 * @returns {Function} - A configured proxy middleware.
 */
const createLambdaProxy = (targetUrl, pathPrefix, clientid) => {
  if (!targetUrl) {
    throw new Error(
      `[HPM] Missing "target" option. Ensure the environment variable for ${pathPrefix} is set.`
    );
  }

  return createProxyMiddleware({
    target: targetUrl + `?clientid=${clientid}`,
    changeOrigin: true,
    pathRewrite: {
      [`^${pathPrefix}`]: "", // Remove the API path prefix if not needed
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader("Content-Type", "application/json");
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.writeHead(500, {
        "Content-Type": "application/json",
      });
      res.end(
        JSON.stringify({
          success: false,
          message: "Proxy error occurred while contacting Lambda",
        })
      );
    },
  });
};

/**
 * Middleware function for AIT Chatbot.
 * @param {Object} secrets - The secrets object.
 * @param {String} secrets.clientid - The unique ID to identify and access your assets in AITrail.
 * @param {String} secrets.apiKey - The unique token to authorize yourself to access Chatbot's endpoints.
 * @returns {Function} - The middleware function to deliver the title, description, images and chat responses.
 */

export function aitChatBotMiddleware(secrets) {
  const { clientid, apiKey } = secrets;

  // Define allowed routes
  const allowedRoutes = [
    "/api/conversation",
    "/api/metadata/texts",
    "/api/metadata/images",
  ];

  return async (req, res, next) => {
    // Skip this middleware if the path is not in the allowed list
    if (!allowedRoutes.includes(req.path)) {
      return next(); // Pass control to the next middleware or route
    }
    // End the process if either client ID or Api key is missing
    if (!clientid?.trim() || !apiKey?.trim()) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "Clientid and apikey are required.",
        })
      );
    }

    // Set up proxies with clientid added as a query parameter
    const lambdaProxyMetaDataTexts = createLambdaProxy(
      "https://api.aitrail.ai/api/metadata/texts",
      "/api/metadata/texts",
      clientid
    );

    const lambdaProxyMetaDataImages = createLambdaProxy(
      "https://api.aitrail.ai/api/metadata/images",
      "/api/metadata/images",
      clientid
    );

    // "/api/conversation" delivers the response to the questions
    if (req.url === "/api/conversation") {
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
          return res.end(JSON.stringify({ error: "Invalid JSON format" }));
        }

        const bodyData = JSON.stringify(modifiedBody);

        const proxy = createProxyMiddleware({
          target: "https://api.aitrail.ai/api/conversation",
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
    } else if (req.url === "/api/metadata/texts") {
      // Proxy request to metadata texts Lambda
      lambdaProxyMetaDataTexts(req, res);
    } else if (req.url === "/api/metadata/images") {
      // Proxy request to metadata images Lambda
      lambdaProxyMetaDataImages(req, res);
    } else {
      // If no matching route, send a 404 response
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  };
}
