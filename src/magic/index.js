// 事件
export function addEventListener(target, event, fn, options) {
  target.addEventListener(event, fn, options);
  return () => target.removeEventListener(event, fn);
}
export function removeEventListener(target, event, fn) {
  target.removeEventListener(event, fn);
}

// 防抖
export function debounce(fn, delay) {
  let timer = null;
  return function (...argvs) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, argvs);
    }, delay);
  };
}

// 节流
export function throttle(func, wait = 500, immediate = true) {
  let timer, flag;
  return immediate
    ? function (...argvs) {
        if (flag) return;
        flag = true;
        // 如果是立即执行，则在wait毫秒内开始时执行
        typeof func === 'function' && func.apply(this, argvs);
        timer = setTimeout(() => {
          flag = false;
        }, wait);
      }
    : function (...argvs) {
        if (flag) return;
        flag = true;
        // 如果是非立即执行，则在wait毫秒内的结束处执行
        timer = setTimeout(() => {
          flag = false;
          typeof func === 'function' && func.apply(this, argvs);
        }, wait);
      };
}

// 组合函数
export function compose(...fns) {
  return fns.reduce(
    (l, r) =>
      function (...argv) {
        return r.call(
          this,
          (...opt) => {
            return l.apply(this, [...argv, ...opt]);
          },
          ...argv
        );
      }
  );
}

// 复制
export function copyText(text) {
  return navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log('复制成功');
    })
    .catch(e => {
      console.log(e);
    });
}

// 日志
export function log(msg, styles = []) {
  if (!Array.isArray(styles) && typeof styles === 'object') styles = [styles];
  return console.info(
    msg,
    ...styles.map(style =>
      Object.keys(style)
        .map(k => `${k.replace(/([A-Z])/g, m => '-' + m.toLocaleLowerCase())}:${style[k]}`)
        .join(';')
    )
  );
}
log.success = function (msg) {
  log('%c' + msg, { background: 'green', color: 'white', padding: '8px', margin: '4px' });
};
log.error = function (msg) {
  log('%c' + msg, { background: 'rgb(41, 0, 0)', color: 'rgb(255, 128, 128)', padding: '8px', margin: '4px' });
};

// 定时器
const dict = {
  interval: {
    set: setInterval,
    clear: clearInterval
  },
  timeout: {
    set: setTimeout,
    clear: clearTimeout
  }
};

function timerFactory(key) {
  return function (...arvgs) {
    let timerId = dict[key].set.call(window || global, ...arvgs);
    function remove() {
      dict[key].clear.call(window || global, timerId);
      timerId = null;
    }
    remove.timerId = timerId;
    return remove;
  }; /* .softBind(null) */
}
export const _setInterval = timerFactory('interval');
export const _setTimeout = timerFactory('timeout');

export function convertFn(string) {
  const match = string.match(/function\s*?.*?\s*?\((.*)?\)\s*?\{/);
  const len = match[0].length;
  const params = match[1] ? match[1].split(',') : null;
  const body = string.slice(len, -1);
  if (params) {
    /* eslint-disable-next-line */
    return new Function(...params, body);
  }
  /* eslint-disable-next-line */
  return new Function(body);
}
