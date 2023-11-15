export * from './supports';
export * from './convert';
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

export function getSearchParams(str) {
  const collect = {};
  str.replace(/([^?^&]*?)=([^?^&]*)/g, (match, k, v) => {
    const temp = collect[k];
    if (!temp) return (collect[k] = v);
    if (temp && typeof temp === 'string') return (collect[k] = [temp, v]);
    collect[k].push(v);
  });
  return collect;
}

export function getSearchString(params) {
  return Object.keys(params)
    .reduce((_, k) => {
      _.push(`${k}=${params[k]}`);
      return _;
    }, [])
    .join('&');
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
