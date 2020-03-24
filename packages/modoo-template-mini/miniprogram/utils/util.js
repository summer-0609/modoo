export const objectToQueryString = (obj) => {
  if (!obj || Object.prototype.toString.call(obj) !== '[object Object]') {
    return '';
  }
  return Object.keys(obj)
    .map((key) => [key, obj[key]].join('='))
    .join('&');
};
