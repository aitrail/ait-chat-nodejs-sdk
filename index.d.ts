import { IncomingMessage, ServerResponse } from "http";
import { RequestHandler } from "http-proxy-middleware";

declare interface Secrets {
  clientid: string;
  apiKey: string;
}

declare function createLambdaProxy(
  targetUrl: string,
  path: string,
  clientid: string
): RequestHandler;

declare function createProxyMiddleware(options: any): RequestHandler;

declare function aitChatBotMiddleware(
  secrets: Secrets
): (req: IncomingMessage, res: ServerResponse) => void;

export default aitChatBotMiddleware;
