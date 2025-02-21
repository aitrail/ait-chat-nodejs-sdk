const { QueryCommand } = require("@aws-sdk/client-dynamodb");
const { dynamoClient } = require("./configs");

require('dotenv').config();


const AIT_CLIENT_SECRETS = process.env.AIT_CLIENT_SECRETS;

const convertClientSecrets = async (items) => {
  return {
      apikey: items[0].secretkey.L[0].M.apikey.S || null,
  };
};

const checkIsValidSecrets = async (clientid, apiKey) => {

  // Validate input
  if (!clientid || !apiKey) {
    return false;
  }

  // Check if client secrets are configured
  if (!AIT_CLIENT_SECRETS) {
    return false;
  }

  try {
    const params = {
      TableName: AIT_CLIENT_SECRETS,
      KeyConditionExpression: "clientid = :clientid",
      ExpressionAttributeValues: {
        ":clientid": { S: clientid },
      },
    };

    const command = new QueryCommand(params);
    const data = await dynamoClient.send(command);


    // Check if any items were returned
    if (!data.Items || data.Items.length === 0) {
      return false;
    }

    // Convert DynamoDB data to usable client info
    const responseApiKey = await convertClientSecrets(data.Items);
 

    // Validate API key
    return responseApiKey.apikey === apiKey;
  } catch (error) {
    return false;
  }
};


module.exports = { checkIsValidSecrets };
