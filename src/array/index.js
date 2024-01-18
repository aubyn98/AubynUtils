export function flatWithKey(tree, key = 'children', fn) {
  return tree.reduce((prev, cur) => {
    const temp = prev.concat(cur, Array.isArray(cur[key]) && cur[key].length ? flatWithKey(cur[key], key, fn) : []);
    typeof fn === 'function' && fn(cur);
    return temp;
  }, []);
}

export function findTreeItem(tree = [], fn, childrenKey = 'children') {
  let res = null;
  tree.some((it, index) => {
    if (fn(it, index)) {
      res = it;
      return true;
    }
    return (res = findTreeItem(it[childrenKey], fn, childrenKey));
  });
  return res;
}

export function treeItemSetParent(tree = [], childrenKey = 'children', parentKey = '$parent', parent = null) {
  return tree.map((it, index) => {
    const temp = {
      ...it
    };
    temp['$index'] = index;
    temp[parentKey] = parent;
    temp[childrenKey] = treeItemSetParent(it[childrenKey], childrenKey, parentKey, temp);
    return temp;
  });
}

export function getTreePath(item, key = '$parent') {
  const res = [item];
  while ((item = item[key])) {
    res.unshift(item);
  }
  return res;
}

export function filterTree(tree, fn, childrenKey = 'children') {
  return tree.filter(fn).map(item => {
    return {
      ...item,
      [childrenKey]: filterTree(item[childrenKey], fn, childrenKey)
    };
  });
}

export function groupBy(keys, arr, callback, callbackAll, join = ',', num = keys.length, flag = true) {
  if (flag) {
    if (!Array.isArray(keys)) {
      throw new TypeError('arg1：keys must be an Array!');
    }
    if (!Array.isArray(arr)) {
      throw new TypeError('arg2：arr must be an Array!');
    }
    if (callback && typeof callback !== 'function') {
      throw new TypeError('arg3：callback must be a function!');
    }
    if (callbackAll && typeof callbackAll !== 'function') {
      throw new TypeError('arg4：callbackAll must be a function!');
    }
    if (join && typeof join !== 'string') {
      throw new TypeError('arg5：join must be a string!');
    }
    if (num && typeof num !== 'number') {
      throw new TypeError('arg6：num must be a number!');
    }
  }
  const index = num - 1;
  const key = keys[index];
  const result = [];
  const temp = {};
  const isArr = Array.isArray(key);
  const quote = {};
  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i];
    let tempKey = item[key];
    callbackAll && callbackAll(item, i);
    isArr &&
      (tempKey = key
        .map(k => {
          return item[k];
        })
        .join(join));
    if (temp[tempKey]) {
      temp[tempKey].push(item);
      callback && callback(item, quote[tempKey]);
    } else {
      temp[tempKey] = [item];
      callback && callback(item, (quote[tempKey] = {}));
    }
  }
  const tempKeys = Object.keys(temp);
  for (let i = tempKeys.length - 1; i >= 0; i--) {
    const tempKey = tempKeys[i];
    const tempObj = {
      key: isArr ? tempKey.split(join) : tempKey,
      value: index !== 0 ? groupBy(keys, temp[tempKey], callback, null, join, index, false) : temp[tempKey]
    };
    callback && Object.assign(tempObj, quote[tempKey]);
    result.push(tempObj);
  }
  return result;
}
export function reverseForEach(arr, callback) {
  for (let i = arr.length - 1; i >= 0; i--) {
    callback(arr[i], i);
  }
}
export function exchangeArrP(arr, o, k) {
  let i = arr[o];
  arr[o] = arr[k];
  arr[k] = i;
}
