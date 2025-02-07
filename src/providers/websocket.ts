import WebSocket from 'ws';
import logger from '../logger';
import type {
  ApiProvider,
  CallApiContextParams,
  ProviderOptions,
  ProviderResponse,
  WebsocketCallApiContextParams,
  WebsocketProviderResponse,
} from '../types';
import invariant from '../util/invariant';
import { safeJsonStringify } from '../util/json';
import { getNunjucksEngine } from '../util/templates';

const nunjucks = getNunjucksEngine();

interface WebSocketProviderConfig {
  messageTemplate: string;
  url?: string;
  timeoutMs?: number;
  transformResponse?: string | Function;
  maintainConnectionBetweenCalls?: boolean;
  /**
   * @deprecated
   */
  responseParser?: string | Function;
}

export function createTransformResponse(parser: any): (data: any) => ProviderResponse {
  if (typeof parser === 'function') {
    return parser;
  }
  if (typeof parser === 'string') {
    // Wrap in an IIFE to allow multiple statements
    const fn = new Function(
      'data',
      `
      try {
        const result = (function() {
          ${parser}
        })();
        return result;
      } catch (e) {
        console.error('Transform function error:', e);
        throw e;
      }
    `,
    ) as (data: any) => ProviderResponse;

    // Return a wrapped version that ensures we return a ProviderResponse
    return (data: any) => {
      try {
        const result = fn(data);
        return typeof result === 'string' ? { output: result } : result;
      } catch (e) {
        logger.error(`Transform wrapper error: ${e}`);
        return { error: String(e) };
      }
    };
  }
  return (data) => ({ output: data });
}

export class WebSocketProvider implements ApiProvider {
  url: string;
  config: WebSocketProviderConfig;
  transformResponse: (data: any) => ProviderResponse;

  constructor(url: string, options: ProviderOptions) {
    this.config = options.config as WebSocketProviderConfig;
    this.url = this.config.url || url;
    this.transformResponse = createTransformResponse(
      this.config.transformResponse || this.config.responseParser,
    );
    invariant(
      this.config.messageTemplate,
      `Expected WebSocket provider ${this.url} to have a config containing {messageTemplate}, but got ${safeJsonStringify(
        this.config,
      )}`,
    );
  }

  id(): string {
    return this.url;
  }

  toString(): string {
    return `[WebSocket Provider ${this.url}]`;
  }

  async callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse> {
    const vars = {
      ...(context?.vars || {}),
      prompt,
    };
    const message = nunjucks.renderString(this.config.messageTemplate, vars);
    const wsContext = context as WebsocketCallApiContextParams;

    logger.debug(`Sending WebSocket message to ${this.url}: ${message}`);

    return new Promise<WebsocketProviderResponse>((resolve) => {
      // Use existing connection if available and maintainConnectionBetweenCalls is true
      const ws =
        this.config.maintainConnectionBetweenCalls && wsContext?.connection
          ? wsContext.connection
          : new WebSocket(this.url);

      const timeout = setTimeout(() => {
        if (!this.config.maintainConnectionBetweenCalls) {
          ws.close();
        }
        resolve({ error: 'WebSocket request timed out' });
      }, this.config.timeoutMs || 10000);

      ws.onmessage = (event) => {
        clearTimeout(timeout);
        logger.debug(`Received WebSocket response: ${event.data}`);
        try {
          let data = event.data;
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch {
              // If parsing fails, assume it's a text response
            }
          }
          const response: WebsocketProviderResponse = {
            output: this.transformResponse(data),
          };
          logger.debug(`Output of websocket transform response: ${JSON.stringify(response)}`);

          // Include connection in response if maintaining connection
          if (this.config.maintainConnectionBetweenCalls) {
            response.connection = ws;
          } else {
            ws.close();
          }

          resolve(response);
        } catch (err) {
          if (!this.config.maintainConnectionBetweenCalls) {
            ws.close();
          }
          resolve({ error: `Failed to process response: ${JSON.stringify(err)}` });
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        if (!this.config.maintainConnectionBetweenCalls) {
          ws.close();
        }
        resolve({ error: `WebSocket error: ${JSON.stringify(err)}` });
      };

      if (ws.readyState === WebSocket.OPEN) {
        logger.debug(`Sending WebSocket message to ${this.url}: ${message}`);
        ws.send(message);
      } else {
        ws.onopen = () => {
          logger.debug(`Sending WebSocket message to ${this.url}: ${message}`);
          ws.send(message);
        };
      }
    });
  }
}
