/** ArrayBuffer转为字符串，参数为ArrayBuffer对象 */
export function bufferToStr(buffer) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

/** 字符串转为ArrayBuffer对象，参数为字符串 */
export function strToBuffer(str) {
  const buf = new ArrayBuffer(str.length + 1); // 补充/0
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * ArrayBuffer转为16进制字符串，参数为ArrayBuffer对象
 */
export function bufferToHexStr(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

/**
 * 含中文的16进制字符串转ArrayBuffer （不含gbk转码）
 */
export function hexStrToBuffer_CN(str) {
  const buffer = new ArrayBuffer(str.length / 2 + 1);
  const dataView = new DataView(buffer);
  for (let i = 0; i < str.length / 2; i++) {
    const temp = parseInt(str[i * 2] + str[i * 2 + 1], 16);
    dataView.setUint8(i, temp);
  }
  dataView.setUint8(str.length / 2, 0x0a);
  return buffer;
}

/**
 * 不含中文的16进制字符串转ArrayBuffer （不含gbk转码）
 */
export function hexStrToBuffer(str) {
  let val = '';
  for (let i = 0; i < str.length; i++) {
    if (val === '') {
      val = str.charCodeAt(i).toString(16);
    } else {
      val += ',' + str.charCodeAt(i).toString(16);
    }
  }
  val += ',' + '0x0a';
  // 将16进制转化为ArrayBuffer
  return new Uint8Array(
    val.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16);
    })
  ).buffer;
}

/**
 * 字符串转为16进制字符串
 */
export function strToHexStr(str) {
  if (str === '') return '';
  const hexCharCode = [];
  hexCharCode.push('0x');
  for (let i = 0; i < str.length; i++) {
    hexCharCode.push(str.charCodeAt(i).toString(16));
  }
  return hexCharCode.join('');
}

/**
 * utf8字符串转Unicode
 */
export function strToUnicode(s) {
  let str = '';
  for (let i = 0; i < s.length; i++) {
    str += '\\u' + s.charCodeAt(i).toString(16) + '\t';
  }
  return str;
}

/**
 * 含中文的UTF8字符串真正字节长度
 */
export function strLength_CN(str) {
  let length = 0;
  const data = str.toString();
  for (let i = 0; i < data.length; i++) {
    if (isCN(data[i])) {
      //是中文
      length += 2;
    } else {
      length += 1;
    }
  }
  return length;
}

/** 判断是否为中文 */
export function isCN(str) {
  if (/^[\u3220-\uFA29]+$/.test(str)) {
    return true;
  } else {
    return false;
  }
}

/** 返回八位数组 */
export function subStr(str) {
  const arr = [];
  if (str.length > 8) {
    //大于8
    for (let i = 0; i * 8 < str.length; i++) {
      const temp = str.substring(i * 8, 8 * i + 8);
      arr.push(temp);
    }
    return arr;
  } else {
    return str;
  }
}

/**
 * 单纯只有0x0a 的ArrayBuffer
 */
export function send0X0A() {
  const buffer = new ArrayBuffer(1);
  const dataView = new DataView(buffer);
  dataView.setUint8(0, 0x0a);
  return buffer;
}
