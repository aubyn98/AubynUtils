import { encode } from './gbk';
export * from './gbk';
export * from './gbk2';

/**
 * 含中文的16进制字符串转ArrayBuffer （含gbk转码）
 */
export function CN_hexStrToBufferByGBK(str) {
  //str='中国：WXHSH'
  const buffer = new ArrayBuffer(sumStrLength(str) * 4);
  const dataView = new DataView(buffer);
  const data = str.toString();
  let p = 0; //ArrayBuffer 偏移量
  for (let i = 0; i < data.length; i++) {
    if (isCN(data[i])) {
      //是中文
      //调用GBK 转码
      const t = encode(data[i]);
      for (let j = 0; j < 2; j++) {
        //var code = t[j * 2] + t[j * 2 + 1];
        const code = t[j * 3 + 1] + t[j * 3 + 2];
        const temp = parseInt(code, 16);
        //var temp = strToHexCharCode(code);
        dataView.setUint8(p++, temp);
      }
    } else {
      const temp = data.charCodeAt(i);
      dataView.setUint8(p++, temp);
    }
  }
  return buffer;
}
