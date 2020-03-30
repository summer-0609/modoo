import http from './base/http';

export const getIndex = (params) => http.post('/boss/shop/list', params);
