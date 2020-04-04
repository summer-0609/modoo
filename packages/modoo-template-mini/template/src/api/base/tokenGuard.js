import { __TOKEN_INFO__ } from '../../utils/storageKeys';
import { __BASE_URL__ } from '../../api.config';

/**
 * 移除token对象
 */
const removeTokenInfo = () => wx.removeStorageSync(__TOKEN_INFO__);

/**
 * 设置token对象
 * @param {*} token token对象
 */
const setTokenInfo = (token) => {
  if (!token) {
    return;
  }
  token.base_url = __BASE_URL__;
  token.login_time = Date.now();
  wx.setStorageSync(__TOKEN_INFO__, token);
};

/**
 * 获取token的对象
 */
const getTokenInfo = () => {
  let tokenInfo = wx.getStorageSync(__TOKEN_INFO__);
  if (tokenInfo) {
    tokenInfo = JSON.parse(JSON.stringify(tokenInfo));
    let { loginTime, expiresIn, baseUrl } = tokenInfo;
    expiresIn *= 1000;
    const nowTime = Date.now();

    if (loginTime + expiresIn <= nowTime) {
      removeTokenInfo();
      return {};
    }

    if (baseUrl !== __BASE_URL__) {
      removeTokenInfo();
      return {};
    }
  }
  return tokenInfo;
};

export const tokenGuard = {
  setTokenInfo: (data) => setTokenInfo(data),
  removeTokenInfo: () => removeTokenInfo(),
  getToken: () => getTokenInfo().access_token,
  getUserNo: () => getTokenInfo().userNo,
  isLogin: () => !!getTokenInfo().access_token,
};
