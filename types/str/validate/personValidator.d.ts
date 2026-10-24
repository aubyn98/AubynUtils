/**
 * 人员信息校验工具
 */

/** 中文姓名校验配置（均可选） */
export interface NameOptions {
  /** 最小长度（按Unicode码点计，间隔点计入），默认 2 */
  min?: number;
  /** 最大长度（按Unicode码点计，间隔点计入），默认 50 */
  max?: number;
  /** 禁用词列表，默认内置称谓词（先生/小姐/医生等） */
  forbiddenWords?: string[];
  /** 姓名为空时的提示文案，默认 '请输入姓名' */
  emptyMsg?: string;
}

/**
 * 校验中文姓名，返回错误提示文案，合法返回 ''
 *
 * 规则：仅允许汉字（含扩展A区/基本区/兼容区/扩展B区及以上）与间隔点·；
 * 汉字开头结尾，间隔点不能连续；长度按Unicode码点计；不能含禁用词。
 */
export declare function getNameError(name: string, options?: NameOptions): string;

/** 身份证号信息提取结果 */
export interface IdcardInfo {
  /** 性别：'1' 男，'2' 女 */
  gender: '1' | '2';
  /** 周岁年龄 */
  age: number;
}

/**
 * 从身份证号（18位或15位）提取性别与周岁年龄
 *
 * 校验：省份码、出生日期（含大小月/闰年，不早于1900年且不晚于当前日期）、
 * 18位证校验位；15位老证按19xx年出生升位处理。
 *
 * @returns 号码不合法返回 null
 */
export declare function getIdcardInfo(idcard: string): IdcardInfo | null;

/**
 * 校验身份证号（18位或15位）是否合法
 *
 * @param idcard 身份证号，内部会 trim 并转大写（兼容小写 x）
 */
export declare function validIdCard(idcard: string): boolean;
