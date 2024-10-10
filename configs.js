// config.js
const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// Access environment variables in Node.js
const {
    AIT_REGION,
    AIT_ACCESS_KEY_ID,
    AIT_SECRET_ACCESS_KEY,
} = process.env;

// Define the AWS client configuration
const config = {
    region: AIT_REGION,
    credentials: {
        accessKeyId: AIT_ACCESS_KEY_ID,
        secretAccessKey: AIT_SECRET_ACCESS_KEY,
    },
};

// Create the S3 client
const s3Client = new S3Client(config);

// Create the DynamoDB client
const dynamoClient = new DynamoDBClient(config);

module.exports = {
    s3Client,
    dynamoClient
};
