/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path: string): boolean;

/**
 * 校验URL
 * @param {string} url
 * @returns {Boolean}
 */
export function validURL(url): boolean;

/**
 * 校验小写字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validLowerCase(str): boolean;

/**
 * 校验大写字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validUpperCase(str): boolean;

/**
 * 校验字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validAlphabets(str): boolean;

/**
 * 校验邮箱
 * @param {string} email
 * @returns {Boolean}
 */
export function validEmail(email): boolean;

/**
 * 校验日期
 * @param {string} str
 * @returns {Boolean}
 */
export function validDate(str): boolean;

/**
 * 校验手机号码
 * @param {string} str
 * @returns {Boolean}
 */
export function validPhone(str): boolean;

/**
 * 校验身份证号码
 * @param {string} str
 * @returns {Boolean}
 */
export function validIDCard(str): boolean;

/**
 * 校验邮政编码
 * @param {string} str
 * @returns {Boolean}
 */
export function validPostalCode(str): boolean;
