import { __BASE_URL__ } from '../../api.config';
import { tokenGuard } from './tokenGuard';
import { statusCodeMessage } from './statusCode';

const request = (url, method, data, options) => {
  /**
   * options:
   *  - withToken true/false 是否需要携带token信息
   *  - customResponse true/false 自定义处理返回结果，有接口返回的格式不满足公共结构，自行处理
   */
  return new Promise((resolve, reject) => {
    const header = {};
    // 登录信息，接口不需要携带token，利用 withToken 来控制
    if (options.withToken) {
      const __token = tokenGuard.getToken();
      if (__token) {
        header.Authorization = `Bearer ${__token}`;
      }
    }

    // 请求谓词
    method = (method || 'GET').toUpperCase();
    if (method == 'POST') {
      header['Content-Type'] = 'application/json';
    }

    wx.request({
      url: __BASE_URL__ + url,
      data,
      header,
      method,
      dataType: 'json',
      success: (res) => {
        const { statusCode, data: response } = res;

        if (statusCode !== 200) {
          wx.showToast({ title: statusCodeMessage[statusCode], icon: 'none' });
          tokenGuard.removeTokenInfo();
          return;
        }

        if (options.customResponse) {
          resolve(response);
          return;
        }

        const { code, message, data } = response;
        if (code !== 20000) {
          wx.showToast({ title: message, icon: 'none' });
          reject(message);
          return;
        }

        resolve(data);
      },
    });
  });
};

export default {
  post: (
    url,
    data = {},
    options = {
      withToken: true, // 是否需要携带token信息
      customResponse: false, // 自定义处理返回结果
    }
  ) => request(url, 'post', data, options),
};
