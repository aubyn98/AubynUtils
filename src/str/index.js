export * from './supports';
export * from './convert';
export * from './validate';
export function getRandom(random = 0, sign = '-') {
  return [Date.now().toString(), Math.random().toString(16).slice(2, 10), Math.random().toString(16).slice(7), random.toString()].join(sign);
}

export function getRandomStr(len = 8, $chars) {
  len = len || 32;
  $chars ||= 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  const maxPos = $chars.length;
  let pwd = '';
  for (let i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
}

export function getPascalCase(str) {
  return str
    .replace(/([^-])([^-]*)/g, function (m2, $1, $2) {
      return $1.toLocaleUpperCase() + $2.toLocaleLowerCase();
    })
    .replace(/-/g, '');
}

/**
 * 解析 URL query 字符串，自动识别多种数组形式：a=1&a=2、a[]=1&a[]=2、a[0]=1&a[1]=2
 * 支持传入完整 URL / query 字符串，自动剔除 hash
 *
 * @param {string} [str=''] 完整 url / query 字符串，可以带开头 ?，可携带 #hash
 * @param {Object} [options] 配置选项
 * @param {boolean} [options.silent=false] 是否静默模式，不输出警告
 * @param {boolean} [options.decodePlus=true] 是否将 + 号解码为空格
 * @param {boolean} [options.strict=false] 严格模式，解码失败时跳过该参数
 * @returns {Record<string, string | string[]>}
 */
export function getQueryParams(str = '', options = {}) {
  const { silent = false, decodePlus = true, strict = false } = options;

  const collect = {};
  if (typeof str !== 'string') return collect;

  function decodePart(raw, isKey) {
    let s = raw;
    if (decodePlus) {
      s = s.replace(/\+/g, ' ');
    }
    try {
      return decodeURIComponent(s);
    } catch (e) {
      if (!silent) {
        console.warn(`Failed to decode ${isKey ? 'key' : 'value'}: ${s}`, e);
      }
      if (strict) {
        return null;
      }
      if (isKey) {
        s = s.replace(/%[0-9a-f]{2}/gi, '');
      }
      return s;
    }
  }

  const withoutHash = str.split('#')[0];
  const qIndex = withoutHash.indexOf('?');
  const query = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : withoutHash;
  if (!query) return collect;

  const pairs = query.split('&');

  for (let i = 0; i < pairs.length; i++) {
    const item = pairs[i];
    if (!item) continue;

    const eqIndex = item.indexOf('=');
    let rawK, rawV;
    if (eqIndex === -1) {
      rawK = item;
      rawV = '';
    } else {
      rawK = item.slice(0, eqIndex);
      rawV = item.slice(eqIndex + 1);
    }

    const k = decodePart(rawK, true);
    if (k === null || !k) continue;
    const v = decodePart(rawV, false);
    if (v === null) continue;

    let realKey = k;
    let isArrayNotation = false;

    // 自动识别 a[]
    if (/\[\]$/.test(k)) {
      realKey = k.slice(0, -2);
      isArrayNotation = true;
    }
    // 自动识别 a[0] a[1] 数字下标
    else if (/^(.+)\[\d+\]$/.test(k)) {
      realKey = k.replace(/\[\d+\]$/, '');
      isArrayNotation = true;
    }

    const existing = collect[realKey];
    if (existing === undefined) {
      collect[realKey] = isArrayNotation ? [v] : v;
    } else if (Array.isArray(existing)) {
      existing.push(v);
    } else {
      // 已有普通值，再次出现该key，转为数组（重复key自动数组）
      collect[realKey] = [existing, v];
    }
  }

  return collect;
}

/**
 * 从当前页面 URL 的 search 部分解析参数（仅浏览器环境）
 * @param {Object} [options] 同 getQueryParams 的 options
 * @returns {Record<string, string | string[]>}
 */
export function getQueryParamsFromSearch(options) {
  if (typeof window === 'undefined') {
    return {};
  }
  return getQueryParams(window.location.search, options);
}

/**
 * 从当前页面 URL 的 hash 部分解析参数（仅浏览器环境）
 * 自动提取 hash 中 ? 后的 query 参数
 *
 * @example
 * // URL: https://example.com#/pages/index?a=1&b=2
 * getQueryParamsFromHash() // => { a: '1', b: '2' }
 *
 * @param {Object} [options] 同 getQueryParams 的 options
 * @returns {Record<string, string | string[]>}
 */
export function getQueryParamsFromHash(options) {
  if (typeof window === 'undefined') {
    return {};
  }
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) {
    return {};
  }
  const hashContent = hash.substring(queryIndex);
  return getQueryParams(hashContent, options);
}

/**
 * 对象转url query字符串
 * @param {Record<string, any>} params 参数对象
 * @param {Object} [options={}] 配置项
 * @param {boolean} [options.addQuestionMark=false] 是否前置 ?
 * @param {'indices'|'brackets'|'repeat'|'comma'} [options.arrayFormat='comma'] 数组格式化模式
 * @param {boolean} [options.keepEmptyArray=false] true:空数组输出key=；false:空数组直接丢弃
 * @returns {string}
 */
export function toQueryString(params, options = {}) {
  if (!params || typeof params !== 'object') return '';

  const { addQuestionMark = false, arrayFormat = 'comma', keepEmptyArray = false } = options;

  const parts = [];

  const arrayStrategies = {
    indices: (encodedKey, items) => {
      items.forEach((item, idx) => {
        parts.push(`${encodedKey}[${idx}]=${encodeURIComponent(item)}`);
      });
    },
    brackets: (encodedKey, items) => {
      items.forEach(item => {
        parts.push(`${encodedKey}[]=${encodeURIComponent(item)}`);
      });
    },
    repeat: (encodedKey, items) => {
      items.forEach(item => {
        parts.push(`${encodedKey}=${encodeURIComponent(item)}`);
      });
    },
    comma: (encodedKey, items) => {
      const val = items.map(i => encodeURIComponent(i)).join(',');
      parts.push(`${encodedKey}=${val}`);
    }
  };

  const handleArray = arrayStrategies[arrayFormat] ?? arrayStrategies.comma;

  Object.keys(params).forEach(key => {
    const rawValue = params[key];
    if (rawValue === null || rawValue === undefined) return;

    const encodedKey = encodeURIComponent(key);

    if (Array.isArray(rawValue)) {
      const validItems = rawValue.filter(item => item != null);

      // 空数组分支
      if (validItems.length === 0) {
        if (keepEmptyArray) {
          parts.push(`${encodedKey}=`);
        }
        return;
      }

      handleArray(encodedKey, validItems);
      return;
    }

    let value = rawValue;
    if (typeof value === 'object' && value !== null) {
      value = JSON.stringify(value);
    }
    parts.push(`${encodedKey}=${encodeURIComponent(value)}`);
  });

  const queryStr = parts.join('&');
  return addQuestionMark && queryStr ? `?${queryStr}` : queryStr;
}

export function compareVersion(v1, v2) {
  v1 = v1.split('.');
  v2 = v2.split('.');
  const len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push('0');
  }
  while (v2.length < len) {
    v2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i]);
    const num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}

export function randomColor() {
  return (
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padEnd(6, '0')
  );
}
