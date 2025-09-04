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
  const map = new WeakMap(); // 解决循环引用

  // 递归克隆核心函数
  function clone(val) {
    // 1. 处理 null/undefined（避免后续判断报错）
    if (val === null || val === undefined) return val;

    // 2. 处理基础类型（直接返回，无需克隆）
    const basicTypes = ['String', 'Number', 'Boolean', 'Symbol', 'BigInt', 'Function'];
    if (basicTypes.includes(getRawType(val))) return val;

    // 3. 处理已克隆的引用类型（解决循环引用）
    if (map.has(val)) return map.get(val);

    const type = getRawType(val);
    let cloneRes;

    // 4. 分类处理特殊引用类型
    switch (type) {
      // 数组：保留数组类型
      case 'Array':
        cloneRes = [];
        map.set(val, cloneRes);
        val.forEach(item => cloneRes.push(clone(item)));
        break;

      // Date：通过构造函数克隆
      case 'Date':
        cloneRes = new Date(val);
        map.set(val, cloneRes);
        break;

      // RegExp：保留 source、flags 等属性
      case 'RegExp':
        cloneRes = new RegExp(val.source, val.flags);
        cloneRes.lastIndex = val.lastIndex; // 保留匹配位置
        map.set(val, cloneRes);
        break;

      // Map：递归克隆 key 和 value
      case 'Map':
        cloneRes = new Map();
        map.set(val, cloneRes);
        val.forEach((v, k) => cloneRes.set(clone(k), clone(v)));
        break;

      // Set：递归克隆 value
      case 'Set':
        cloneRes = new Set();
        map.set(val, cloneRes);
        val.forEach(v => cloneRes.add(clone(v)));
        break;

      // Error：保留 message、name 等核心属性
      case 'Error':
        cloneRes = new window[type](val.message); // 如 new TypeError(val.message)
        Object.getOwnPropertyNames(val).forEach(key => {
          cloneRes[key] = clone(val[key]); // 克隆 stack、name 等属性
        });
        map.set(val, cloneRes);
        break;

      // 普通对象/其他对象（默认分支）
      default:
        // 保留原对象的原型链（解决继承属性丢失问题）
        const prototype = Object.getPrototypeOf(val);
        cloneRes = Object.create(prototype);
        map.set(val, cloneRes);

        // 获取所有自有属性描述符（包括不可枚举），用 Object.getOwnPropertyNames
        const descriptors = Object.getOwnPropertyDescriptors(val);
        Object.getOwnPropertyNames(descriptors).forEach(key => {
          const desc = descriptors[key];
          if (desc.get || desc.set) {
            // 访问器属性：直接克隆描述符
            Object.defineProperty(cloneRes, key, desc);
          } else {
            // 数据属性：递归克隆值
            cloneRes[key] = clone(val[key]);
          }
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
