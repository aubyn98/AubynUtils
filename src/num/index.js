import Decimal from 'decimal.js';
export { default as Decimal } from 'decimal.js';
export function digit2Uppercase(n) {
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [
    ['元', '万', '亿', '万亿'],
    ['', '拾', '佰', '仟']
  ];
  const head = n < 0 ? '欠' : '';
  n = Math.abs(n);
  let s = '';
  for (let i = 0; i < fraction.length; i++) {
    s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
  }
  s = s || '整';
  n = Math.floor(n);
  for (let i = 0; i < unit[0].length && n > 0; i++) {
    let p = '';
    for (let j = 0; j < unit[1].length && n > 0; j++) {
      p = digit[n % 10] + unit[1][j] + p;
      n = Math.floor(n / 10);
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
  }
  return (
    head +
    s
      .replace(/(零.)*零元/, '元')
      .replace(/(零.)+/g, '零')
      .replace(/^整$/, '零元整')
  );
}

export function scientificToNumber(num) {
  const reg = /^(\d+)(\.\d+)?(e)([-]?\d+)$/;
  const regRes = reg.exec(num);
  return '0.' + ''.padEnd(Math.abs(regRes[4]) - 1, '0') + regRes[1];
}

export function excludeNaN(v, d = 0) {
  return isNaN(v) ? d : v;
}

function _calc(key, argvs) {
  argvs = argvs.filter(it => it || it === 0);
  if (!argvs.length) return 0;
  return argvs.reduce((_, num) => _[key](num), new Decimal(argvs.shift())).toNumber();
}

export function divide(...argvs) {
  return _calc('div', argvs);
}

export function multiply(...argvs) {
  return _calc('mul', argvs);
}

export function add(...argvs) {
  return _calc('plus', argvs);
}

export function subtract(...argvs) {
  return _calc('sub', argvs);
}

function _calcBy(data, keys, calc) {
  if (!keys && typeof data[0] !== 'object') return calc(...data);
  if (typeof keys === 'string') return calc(...data.map(it => it[keys]));
  if (keys instanceof Array) {
    const last = data.length - 1;
    return data.reduce(
      (totals, cur, i) => {
        Object.keys(totals).forEach(k => {
          if (last === i) totals[k] = calc(...totals[k].concat(cur[k]));
          else totals[k].push(cur[k]);
        });
        return totals;
      },
      keys.reduce((_, c) => {
        _[c] = [];
        return _;
      }, {})
    );
  }
  return 0;
}

export function addBy(data, keys) {
  return _calcBy(data, keys, add);
}

export function multiplyBy(data, keys) {
  return _calcBy(data, keys, multiply);
}

export function limitInteger(e) {
  !/\d/.test(e.key) && e.preventDefault();
}
