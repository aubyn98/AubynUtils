// 人员信息校验工具
// getNameError：中文姓名校验，返回错误提示文案，合法返回''
// getIdcardInfo：从身份证号提取性别与周岁年龄，号码不合法返回null

// ========== 中文姓名校验 ==========
// 姓名长度范围（按Unicode码点计，间隔点计入）
const DEFAULT_MIN = 2;
const DEFAULT_MAX = 50;
// 姓名禁用词
const DEFAULT_FORBIDDEN_WORDS = ['先生', '小姐', '太太', '女士', '销售', '医生', '醫生', '护士', '護士', '老师', '老師', '经理', '經理', '客服'];
// 单个汉字：扩展A区/基本区/兼容区 + 扩展B区及以上（代理对表示，如"𠮷"）
const HAN_ATOM = '(?:[\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAD9]|[\\uD840-\\uD87E][\\uDC00-\\uDFFF])';
// 仅允许汉字与间隔点·
const NAME_CHARS_REX = new RegExp('^(?:' + HAN_ATOM + '|\\u00B7)+$');
// 结构：汉字开头结尾，间隔点·不能连续
const NAME_REX = new RegExp('^' + HAN_ATOM + '+(?:\\u00B7' + HAN_ATOM + '+)*$');

// 统计Unicode码点数（代理对计为1）
const codePointCount = str => {
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    n++;
    if (str.charCodeAt(i) >= 0xd800 && str.charCodeAt(i) <= 0xdbff) i++;
  }
  return n;
};

// 校验中文姓名
// options: { min, max, forbiddenWords, emptyMsg } 均可选
const getNameError = (name, options) => {
  const opts = options || {};
  const min = opts.min != null ? opts.min : DEFAULT_MIN;
  const max = opts.max != null ? opts.max : DEFAULT_MAX;
  const forbiddenWords = opts.forbiddenWords || DEFAULT_FORBIDDEN_WORDS;
  if (!name) return opts.emptyMsg || '请输入姓名';
  const len = codePointCount(name);
  if (len < min || len > max) return '姓名长度须为' + min + '~' + max + '个字符';
  if (!NAME_CHARS_REX.test(name)) return '姓名仅支持中文，可含间隔点·';
  if (!NAME_REX.test(name)) return '间隔点·不能位于首尾或连续出现';
  if (forbiddenWords.some(w => name.indexOf(w) !== -1)) return '姓名不合格，不能含先生/小姐/医生等称谓';
  return '';
};

// ========== 身份证号信息提取 ==========
// 18位/15位身份证号格式
const PROVINCES = new Set([
  11,
  12,
  13,
  14,
  15, // 华北
  21,
  22,
  23, // 东北
  31,
  32,
  33,
  34,
  35,
  36,
  37, // 华东
  41,
  42,
  43,
  44,
  45,
  46, // 中南
  50,
  51,
  52,
  53,
  54, // 西南
  61,
  62,
  63,
  64,
  65, // 西北
  71,
  81,
  82,
  83 // 台湾预留/港澳台居住证，按业务取舍
]);

const W = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK = '10X98765432';

function validIdCard(input) {
  const id = String(input).trim().toUpperCase();
  const is18 = /^\d{17}[\dX]$/.test(id);
  const is15 = /^\d{15}$/.test(id);
  if (!is18 && !is15) return false;

  // 15 位老证升为 18 位（老证持有人出生年份均为 19xx）
  const full = is15 ? id.slice(0, 6) + '19' + id.slice(6) : id;

  // ① 省份码
  if (!PROVINCES.has(Number(full.slice(0, 2)))) return false;

  // ② 出生日期（用 Date 回读，自动处理大小月和闰年）
  const y = +full.slice(6, 10),
    m = +full.slice(10, 12),
    d = +full.slice(12, 14);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
  if (y < 1900 || dt.getTime() > Date.now()) return false;

  // ③ 校验位（仅 18 位证有）
  if (is18) {
    let sum = 0;
    for (let i = 0; i < 17; i++) sum += +full[i] * W[i];
    if (CHECK[sum % 11] !== full[17]) return false;
  }
  return true;
}

// 从身份证号提取性别与周岁年龄
// 返回 { gender: '1'男 / '2'女, age: 周岁 }，号码不合法返回null
const getIdcardInfo = idcard => {
  if (!idcard || !validIdCard(idcard)) return null;
  let birth;
  let genderCode;
  if (idcard.length === 18) {
    birth = idcard.slice(6, 14);
    genderCode = idcard.charAt(16);
  } else {
    birth = '19' + idcard.slice(6, 12);
    genderCode = idcard.charAt(14);
  }
  const year = Number(birth.slice(0, 4));
  const month = Number(birth.slice(4, 6));
  const day = Number(birth.slice(6, 8));
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) {
    age--;
  }
  return {
    gender: Number(genderCode) % 2 === 1 ? '1' : '2',
    age
  };
};

export { getNameError, getIdcardInfo, validIdCard };
