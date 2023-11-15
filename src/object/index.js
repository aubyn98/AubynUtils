import lodash from 'lodash'
const toString = Object.prototype.toString
const _hasOwnProperty = Object.prototype.hasOwnProperty
// const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors
const defineProperty = Object.defineProperty
const defineProperties = Object.defineProperties

export function getRawType(val) {
  return toString.call(val).slice(8, -1)
}

export function hasOwnProperty(val, key) {
  if (val === void 0 || val === null) return false
  return _hasOwnProperty.call(val, key)
}

export function isNullish(v) {
  return typeof v === 'undefined' || v === null
}

export function cloneWithDescriptors(val) {
  if (getRawType(val) === 'Array') return val.map(it => defineProperties({}, getOwnPropertyDescriptors(it)))
  if (getRawType(val) === 'Object') return defineProperties({}, getOwnPropertyDescriptors(val))
  return val
}

export function cloneDeepWithDescriptors(data) {
  const map = new WeakMap()
  return (function $(val) {
    if (map.has(val)) return map.get(val)

    const isArray = getRawType(val) === 'Array'
    if (!isArray && !(getRawType(val) === 'Object')) return val

    const res = isArray ? [] : {}
    map.set(val, res)

    if (isArray) {
      val.forEach(it => res.push($(it)))
    } else {
      const Descriptors = getOwnPropertyDescriptors(val)
      Object.keys(Descriptors).reduce((_, k) => {
        if (Descriptors[k].get || Descriptors[k].set) {
          defineProperty(_, k, Descriptors[k])
        } else {
          _[k] = $(val[k])
        }
        return _
      }, res)
    }
    return res
  })(data)
}

export function getAssignKey(val) {
  const Descriptors = getOwnPropertyDescriptors(val)
  return Object.keys(Descriptors).filter(k => Descriptors[k].writable || Descriptors[k].set)
}

export function pickAssigns(val, deep = false) {
  const Descriptors = getOwnPropertyDescriptors(val)
  return Object.keys(Descriptors).reduce((_, k) => {
    if (Descriptors[k].set) defineProperty(_, k, Descriptors[k])
    if (Descriptors[k].writable) {
      if (deep && getRawType(val[k]) === 'Object') {
        _[k] = pickAssigns(val[k], deep)
      } else defineProperty(_, k, Descriptors[k])
    }
    return _
  }, {})
}

export function getOnlyGetterKey(val) {
  const Descriptors = getOwnPropertyDescriptors(val)
  return Object.keys(Descriptors).filter(k => Descriptors[k].get && !Descriptors[k].set)
}

export function pickOnlyGetter(val, deep = false) {
  const Descriptors = getOwnPropertyDescriptors(val)
  return Object.keys(Descriptors).reduce((_, k) => {
    if (deep && getRawType(val[k]) === 'Object') {
      _[k] = pickOnlyGetter(val[k], deep)
    } else if (Descriptors[k].get && !Descriptors[k].set) {
      _[k] = val[k]
    }
    return _
  }, {})
}

export function transformSetVal(target, origin, keys, opts = {}) {
  opts.prefix ??= ''
  opts.direction ??= 'left'
  const { prefix, direction } = opts
  keys.forEach(k => {
    const Key = prefix ? prefix + lodash.capitalize(k) : k
    if (direction === 'left') target[Key] = origin[k]
    if (direction === 'right') target[k] = origin[Key]
  })
}
