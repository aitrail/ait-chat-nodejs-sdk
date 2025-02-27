import { IncomingMessage, ServerResponse } from "http";

declare interface Secrets {
  clientid: string;
  apiKey: string;
}

declare function aitChatBotMiddleware(
  secrets: Secrets
): (req: IncomingMessage, res: ServerResponse) => void;

export default aitChatBotMiddleware;
