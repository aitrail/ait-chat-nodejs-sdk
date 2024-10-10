const { GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { convertBotProperties, convertClientInfo } = require("./utils");
const { dynamoClient, s3Client } = require("./configs");

// Access environment variables
const AIT_CLIENT_TABLE = process.env.AIT_CLIENT_TABLE;
const AIT_BOT_PROPERTIES = process.env.AIT_BOT_PROPERTIES;
const bucketName = process.env.AIT_CHAT_BOT_SRC;

const getBotProperties = async (clientid) => {
  // Check for client ID and environment variable
  if (!clientid) {
    return { properties: null, error: "Client ID is required" };
  }

  if (!AIT_BOT_PROPERTIES) {
    return {
      properties: null,
      error:
        "Bot properties table name is not defined in environment variables",
    };
  }

  try {
    const params = {
      TableName: AIT_BOT_PROPERTIES,
      Key: {
        id: { S: clientid },
      },
    };

    const command = new GetItemCommand(params);
    const data = await dynamoClient.send(command);

    const clientInfo = await getClientInfo(clientid);

    // Check if the item was found
    if (!data.Item) {
      return { properties: null, error: "Item not found" };
    }

    // Convert DynamoDB data to usable bot properties
    const convertedData = await convertBotProperties(data.Item);

    return {
      properties: { ...convertedData, companyName: clientInfo.companyName },
    };
  } catch (error) {
    console.error("Error fetching bot properties:", error);
    return {
      properties: null,
      error: error.message || "Error fetching bot properties",
    };
  }
};

const getClientInfo = async (clientid) => {
  // Check for clientid and environment variable
  if (!clientid) {
    return { companyName: null, error: "clientid is required" };
  }

  if (!AIT_CLIENT_TABLE) {
    return {
      companyName: null,
      error: "ClientInfo table name is not defined in environment variables",
    };
  }

  try {
    const params = {
      TableName: AIT_CLIENT_TABLE,
      Key: {
        clientid: { S: clientid }, // Key for querying DynamoDB
      },
    };

    const command = new GetItemCommand(params);
    const data = await dynamoClient.send(command); // Send the command to DynamoDB

    // Check if the item was found
    if (!data.Item) {
      return {
        companyName: null,
        error: "Item not found",
      };
    }

    // Convert DynamoDB data to usable client info
    const convertedData = await convertClientInfo(data.Item);

    return { companyName: convertedData };
  } catch (error) {
    console.error("Error fetching client info:", error);
    return {
      companyName: null,
      error: error.message || "Error fetching client info",
    };
  }
};

// Retrieve environment variables from process.env

// Function to generate a presigned URL for an S3 object
const generatePresignedUrl = async (bucketName, key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Generate the presigned URL with an expiry of 1 hour (3600 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error(`Error generating presigned URL for key: ${key}`, error);
    throw error; // Re-throw the error to handle it upstream if needed
  }
};

// Function to fetch the presigned URL for an image if it exists
const fetchImageUrl = async (bucketName, path) => {
  if (!bucketName || !path) {
    console.error("Bucket name or path is missing.");
    return "";
  }

  try {
    // Generate and return the presigned URL for the image
    return await generatePresignedUrl(bucketName, path);
  } catch (error) {
    console.error(`Error fetching image URL for path: ${path}`, error);
    return ""; // Return an empty string on error
  }
};

// Function to fetch all image URLs
const fetchImages = async (clientid) => {
  // Array of image paths related to the client
  const images = ["agentAvatar", "agentImage", "launcherIcon"];

  try {
    // Create an array of promises to fetch each image URL concurrently
    const imagePromises = images.map(async (image) => {
      const path = `${clientid}/${clientid}-${image}`;
      return await fetchImageUrl(bucketName, path);
    });

    // Await all image URLs concurrently
    const imageUrls = await Promise.all(imagePromises);

    // Create an object mapping image names to their respective URLs
    const imagesUrl = images.reduce((acc, image, index) => {
      acc[image] = imageUrls[index];
      return acc;
    }, {});

    return imagesUrl;
  } catch (error) {
    console.error("Error fetching images:", error);
    return {
      agentAvatar: "",
      agentImage: "",
      launcherIcon: "",
    };
  }
};

module.exports = { getBotProperties, getClientInfo, fetchImages };
