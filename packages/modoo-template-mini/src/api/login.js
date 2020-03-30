import http from './base/http';
import { objectToQueryString } from '../utils/util';
import { __CLIENT_CONFIG__ } from '../api.config.js';

export const login = (params) => {
  return http.post(
    `/uaa/oauth/token?${objectToQueryString({
      ...__CLIENT_CONFIG__,
      ...params,
    })}`,
    {},
    { withToken: false, customResponse: true }
  );
};
