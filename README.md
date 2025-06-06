# Chatbot UI Server Setup

## Overview
This guide provides a step-by-step process for setting up the server configuration for Chatbot UI. It assumes that you have already configured the Chatbot UI successfully. Here, you will learn how to install and configure the necessary middleware for seamless communication with the chatbot API.

## Prerequisites

This package assumes that `express` is installed in your application. If it is not installed, you can add it by running:

- [Express](https://expressjs.com/) (required)

```sh
npm install express
```

## Installation
To get started, install the required dependencies:

```sh
npm install @aitrail/chat-middleware express
```

## Usage
To enable smooth interaction between your application and the chatbot API, integrate the middleware in your server.

```javascript
import express from 'express';
import { aitChatBotMiddleware } from '@aitrail/chat-middleware';

const app = express();

const secrets = {
  apiKey: "Your apiKey",
  clientid: "Your clientid",
};

app.use(aitChatBotMiddleware(secrets));
```

## Create a Free Trial Account
If you don’t have an account yet, follow these simple steps to get started:

### Visit [AI Trail](https://aitrail.ai)
Sign up for a free account, create a workspace, get your api key and client id, customize your chatbot, and integrate it into your site in no time. Enjoy a seamless AI experience with no hassle!

## Important Notes
- This server setup is dedicated to handling chatbot requests only, meaning it does not process other paths.

## Testing Your Setup
Once your server is running, you can start interacting with the chatbot. Try sending a request to see your first greeting from the chatbot!

## License
This package is open-source and available under the Apache 2.0 License.

## Keywords
Chatbot, AI chatbot, Chatbot UI, Express middleware, Chatbot integration, AI Trail, Node.js chatbot, Server setup, AI assistant

## Additional Resources
For a detailed guide, visit [here](https://staging.d3c2ke45o46c5h.amplifyapp.com/docs/conversation-api/Rest-Endpoint).

