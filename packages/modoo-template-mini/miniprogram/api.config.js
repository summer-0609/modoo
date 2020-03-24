import { __ENV__ } from './env.config';

// 基础配置
const apiConfig = {
  dev: 'http://101.132.100.145:8182',
  pre: 'http://boss-gateway-pre.modoopark.com',
  prod: 'https://boss-gateway.modoopark.com',
};

// 客户端配置
const clientConfig = {
  cashier: {
    dev: {
      client_id: 'SHOP_SYS',
      client_secret: 'T4!0ahpW',
      grant_type: 'password',
      type: 'CASHIER',
    },
    pre: {
      client_id: 'SHOP_SYS',
      client_secret: 'T4!0ahpW',
      grant_type: 'password',
      type: 'CASHIER',
    },
    prod: {
      client_id: 'SHOP_SYS',
      client_secret: 'T4!0ahpW',
      grant_type: 'password',
      type: 'CASHIER',
    },
  },
};

export const __BASE_URL__ = apiConfig[__ENV__];

export const __CLIENT_CONFIG__ = clientConfig.cashier[__ENV__];
