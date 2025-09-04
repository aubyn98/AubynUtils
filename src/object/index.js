import lodash from 'lodash';
const toString = Object.prototype.toString;
const _hasOwnProperty = Object.prototype.hasOwnProperty;
// const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const defineProperty = Object.defineProperty;
const defineProperties = Object.defineProperties;

export function getRawType(val) {
  return toString.call(val).slice(8, -1);
}

export function hasOwnProperty(val, key) {
  if (val === void 0 || val === null) return false;
  return _hasOwnProperty.call(val, key);
}

export function isNullish(v) {
  return typeof v === 'undefined' || v === null;
}

export function cloneWithDescriptors(val) {
  if (getRawType(val) === 'Array') return val.map(it => defineProperties({}, getOwnPropertyDescriptors(it)));
  if (getRawType(val) === 'Object') return defineProperties({}, getOwnPropertyDescriptors(val));
  return val;
}

export function cloneDeepWithDescriptors(data) {
  const map = new WeakMap();

  const cloneHandlers = {
    Array: (val) => {
      const res = [];
      map.set(val, res);
      val.forEach(item => res.push(clone(item)));
      return res;
    },

    Date: (val) => {
      const res = new Date(val);
      map.set(val, res);
      return res;
    },

    RegExp: (val) => {
      const res = new RegExp(val.source, val.flags);
      res.lastIndex = val.lastIndex;
      map.set(val, res);
      return res;
    },

    Map: (val) => {
      const res = new Map();
      map.set(val, res);
      val.forEach((v, k) => res.set(clone(k), clone(v)));
      return res;
    },

    Set: (val) => {
      const res = new Set();
      map.set(val, res);
      val.forEach(v => res.add(clone(v)));
      return res;
    },

    Error: (val) => {
      const res = new val.constructor(val.message);
      map.set(val, res);
      Object.getOwnPropertyNames(val).forEach(key => {
        if (key === 'stack') return;
        res[key] = clone(val[key]);
      });
      return res;
    },

    default: (val) => {
      const res = Object.create(Object.getPrototypeOf(val));
      map.set(val, res);
      const descriptors = Object.getOwnPropertyDescriptors(val);
      Object.getOwnPropertyNames(descriptors).forEach(key => {
        const desc = descriptors[key];
        if (desc.value !== undefined) desc.value = clone(desc.value);
        Object.defineProperty(res, key, desc);
      });
      return res;
    }
  };

  function clone(val) {
    if (val === null || val === undefined) return val;
    const type = getRawType(val);
    if (['String', 'Number', 'Boolean', 'Symbol', 'BigInt', 'Function'].includes(type)) return val;

    if (map.has(val)) return map.get(val);

    return cloneHandlers[type] ? cloneHandlers[type](val) : cloneHandlers.default(val);
  }

  return clone(data);
}

export function getAssignKey(val) {
  const Descriptors = getOwnPropertyDescriptors(val);
  return Object.keys(Descriptors).filter(k => Descriptors[k].writable || Descriptors[k].set);
}

export function pickAssigns(val, deep = false) {
  const Descriptors = getOwnPropertyDescriptors(val);
  return Object.keys(Descriptors).reduce((_, k) => {
    if (Descriptors[k].set) defineProperty(_, k, Descriptors[k]);
    if (Descriptors[k].writable) {
      if (deep && getRawType(val[k]) === 'Object') {
        _[k] = pickAssigns(val[k], deep);
      } else defineProperty(_, k, Descriptors[k]);
    }
    return _;
  }, {});
}

export function getOnlyGetterKey(val) {
  const Descriptors = getOwnPropertyDescriptors(val);
  return Object.keys(Descriptors).filter(k => Descriptors[k].get && !Descriptors[k].set);
}

export function pickOnlyGetter(val, deep = false) {
  const Descriptors = getOwnPropertyDescriptors(val);
  return Object.keys(Descriptors).reduce((_, k) => {
    if (deep && getRawType(val[k]) === 'Object') {
      _[k] = pickOnlyGetter(val[k], deep);
    } else if (Descriptors[k].get && !Descriptors[k].set) {
      _[k] = val[k];
    }
    return _;
  }, {});
}

export function transformSetVal(target, origin, keys, opts = {}) {
  opts.prefix ??= '';
  opts.direction ??= 'left';
  const { prefix, direction } = opts;
  keys.forEach(k => {
    const Key = prefix ? prefix + lodash.capitalize(k) : k;
    if (direction === 'left') target[Key] = origin[k];
    if (direction === 'right') target[k] = origin[Key];
  });
}
