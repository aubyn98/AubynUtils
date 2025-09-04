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

  function clone(val) {
    if (val === null || val === undefined) return val;
    const type = getRawType(val);

    // 基础类型直接返回
    if (['String', 'Number', 'Boolean', 'Symbol', 'BigInt', 'Function'].includes(type)) return val;
    // 循环引用返回缓存
    if (map.has(val)) return map.get(val);

    let cloneRes;

    switch (type) {
      case 'Array':
        cloneRes = [];
        map.set(val, cloneRes);
        val.forEach(item => cloneRes.push(clone(item)));
        break;

      case 'Date':
        cloneRes = new Date(val);
        map.set(val, cloneRes);
        break;

      case 'RegExp':
        cloneRes = new RegExp(val.source, val.flags);
        cloneRes.lastIndex = val.lastIndex;
        map.set(val, cloneRes);
        break;

      case 'Map':
        cloneRes = new Map();
        map.set(val, cloneRes);
        val.forEach((v, k) => cloneRes.set(clone(k), clone(v)));
        break;

      case 'Set':
        cloneRes = new Set();
        map.set(val, cloneRes);
        val.forEach(v => cloneRes.add(clone(v)));
        break;

      case 'Error':
        const ErrCtor = val.constructor;
        cloneRes = new ErrCtor(val.message);
        Object.getOwnPropertyNames(val).forEach(key => {
          cloneRes[key] = clone(val[key]);
        });
        map.set(val, cloneRes);
        break;

      default:
        const prototype = Object.getPrototypeOf(val);
        cloneRes = Object.create(prototype);
        map.set(val, cloneRes);

        const descriptors = Object.getOwnPropertyDescriptors(val);
        Object.getOwnPropertyNames(descriptors).forEach(key => {
          const desc = descriptors[key];
          if (desc.value !== undefined) {
            desc.value = clone(desc.value);
          }
          Object.defineProperty(cloneRes, key, desc);
        });
        break;
    }

    return cloneRes;
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
