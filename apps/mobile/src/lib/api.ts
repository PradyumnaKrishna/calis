import {useMemo} from 'react';

import createClient, {type Middleware} from 'openapi-fetch';

import type {paths} from './api-schema';
import {getStoredProfileId} from './profile-storage';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
}

const baseUrl = apiBaseUrl.replace(/\/+$/, '');

const middleware: Middleware = {
  async onRequest({request}) {
    request.headers.set('Accept', 'application/json');

    if (!request.headers.has('X-Profile-Id')) {
      const profileId = await getStoredProfileId();

      if (profileId) {
        request.headers.set('X-Profile-Id', profileId);
      }
    }

    return request;
  },
};

function createApi() {
  const client = createClient<paths>({baseUrl});

  client.use(middleware);

  return client;
}

export function useApi() {
  return useMemo(() => createApi(), []);
}

export function getApiAssetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}
