import { URL } from 'url';
import { SHARE_API_BASE_URL, SHARE_VIEW_BASE_URL, DEFAULT_SHARE_VIEW_BASE_URL } from './constants';
import { fetchWithProxy } from './fetch';
import { getUserEmail } from './globalConfig/accounts';
import { cloudConfig } from './globalConfig/cloud';
import logger from './logger';
import type Eval from './models/eval';

export async function targetHostCanUseNewResults(apiHost: string): Promise<boolean> {
  const response = await fetchWithProxy(`${apiHost}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    return false;
  }
  const responseJson = await response.json();
  return 'version' in responseJson;
}

async function sendEvalResults(evalRecord: Eval, url: string) {
  await evalRecord.loadResults();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const author = evalRecord.author || getUserEmail();
  if (author) {
    headers['X-Author-Email'] = author;
  }

  if (cloudConfig.isEnabled()) {
    const apiKey = cloudConfig.getApiKey();
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  const response = await fetchWithProxy(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...evalRecord,
      author,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to send eval results (${response.status}): ${errorText}`);
  }

  const evalId = (await response.json()).id;
  return evalId;
}

/**
 * Removes authentication information (username and password) from a URL.
 *
 * This function addresses a security concern raised in GitHub issue #1184,
 * where sensitive authentication information was being displayed in the CLI output.
 * By default, we now strip this information to prevent accidental exposure of credentials.
 *
 * @param urlString - The URL string that may contain authentication information.
 * @returns A new URL string with username and password removed, if present.
 *          If URL parsing fails, it returns the original string.
 */
export function stripAuthFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    url.username = '';
    url.password = '';
    return url.toString();
  } catch {
    logger.warn('Failed to parse URL, returning original');
    return urlString;
  }
}

export async function createShareableUrl(
  evalRecord: Eval,
  showAuth: boolean = false,
): Promise<string | null> {
  logger.debug('Starting createShareableUrl');

  if (!evalRecord.author && !getUserEmail()) {
    logger.error('No author email available');
    throw new Error('Author email is required for sharing');
  }

  let apiBaseUrl: string;
  let url: string;

  if (cloudConfig.isEnabled()) {
    logger.debug('Using cloud config');
    apiBaseUrl = cloudConfig.getApiHost();
    url = `${apiBaseUrl}/results`;

    if (!cloudConfig.getApiKey()) {
      logger.error('No cloud API key available');
      throw new Error('Cloud API key is required for sharing');
    }
  } else {
    logger.debug('Using local config');
    apiBaseUrl =
      typeof evalRecord.config.sharing === 'object'
        ? evalRecord.config.sharing.apiBaseUrl || SHARE_API_BASE_URL
        : SHARE_API_BASE_URL;
    url = `${apiBaseUrl}/api/eval`;
  }

  logger.debug(`Sharing URL: ${url}`);

  try {
    const evalId = await sendEvalResults(evalRecord, url);
    logger.debug(`Got eval ID: ${evalId}`);

    let fullUrl: string;
    if (cloudConfig.isEnabled()) {
      const appBaseUrl = cloudConfig.getAppUrl();
      fullUrl = `${appBaseUrl}/eval/${evalId}`;
    } else {
      const appBaseUrl =
        typeof evalRecord.config.sharing === 'object'
          ? evalRecord.config.sharing.appBaseUrl
          : SHARE_VIEW_BASE_URL;
      fullUrl =
        SHARE_VIEW_BASE_URL === DEFAULT_SHARE_VIEW_BASE_URL
          ? `${appBaseUrl}/eval/${evalId}`
          : `${appBaseUrl}/eval/?evalId=${evalId}`;
    }

    logger.debug(`Created full URL: ${fullUrl}`);
    return showAuth ? fullUrl : stripAuthFromUrl(fullUrl);
  } catch (error) {
    logger.error('Error in createShareableUrl:', error);
    throw error;
  }
}
