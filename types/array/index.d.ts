export type GetArrObj<T, P = never> = T extends Array<infer U> ? U : P;
export type GetArrObjKeys<T, P = never> = T extends Array<infer U> ? keyof U : P;
/**
 *  平铺树型数据
 *  @param tree  树型数据
 *  @param key  要平铺的键
 *  @param fn   回调，参数1：迭代的每个元素
 */
export function flatWithKey<T extends Record<string, any>[]>(tree: T, key?: GetArrObjKeys<T, string>, fn?: (it: T extends Array<infer U> ? U : T) => void): T;

/**
 * 获取树型数据对应的数据项
 *  @param tree  树型数据
 *  @param fn    条件函数
 *  @param childrenKey  子节点的键 默认children
 */
export function findTreeItem<T extends Record<string, any>[]>(
  tree: T,
  fn: (item: GetArrObj<T, null>) => boolean,
  childrenKey?:string
): T extends Array<infer U> ? U : any;

type TISP<T, C extends keyof any, P extends keyof any> = Omit<T, C> & {
  [K in C]: TISP<T, C, P>[];
} & { [K in P]: TISP<T, C, P> };
/**
 * 获取树型数据对应的数据项的父级引用
 *  @param tree          树型数据
 *  @param childrenKey   子节点的键
 *  @param parentKey     设置的父级引用的键
 *  @param parent        父级引用
 */
export function treeItemSetParent<T extends Record<string, any>[], C extends keyof any = 'children', P extends keyof any = '$parent'>(
  tree: T,
  childrenKey?: GetArrObjKeys<T, string>,
  parentKey?: P,
  parent?: GetArrObj<T, null>
): T extends Array<infer U> ? TISP<U, C, P>[] : any[];

/**
 * 获取树型数据项的路径
 *  @param item          树型数据项
 *  @param key           父级引用的键
 */
export function getTreePath<T extends Record<string, any>, P extends keyof any = '$parent'>(item: T, key?: P): T[];

/**
 * 过滤树形结构数据
 *  @param tree  树型数据
 *  @param fn    条件函数
 *  @param childrenKey  子节点的键
 */
export function filterTree<T extends Record<string, any>[]>(tree: T, fn: (item: GetArrObj<T, null>) => boolean, childrenKey?: string): T;

type GruopByCb<T> = (item?: GetArrObj<T>, quote?: Record<string, any>) => void;
type GruopByCbAll<T> = (item?: GetArrObj<T>, index?: number) => void;
/**
 * 数组分组
 * @param {Array}    keys           分组的层级key条件,元素可以是字符串，也可以是数组;
 * @param {Array}    arr            分组的数据;
 * @param {Function} callback       可选参数,回调函数,参数1：item为将要分组同组中的每个元素，参数2：quote为同组中的引用对象，最终会合并到外层同组的数据上;
 * @param {Function} callbackAll    可选参数;回调函数,参数1：item为原数组的每一项，参数2：index为原数组每一项的索引
 * @param {string}   join           可选参数;同组多项条件分组时用于连接的字符串，默认为 ","
 * @param {number}   num            可选参数;
 */
export function groupBy<T extends Record<string, any>[]>(
  keys: [GetArrObjKeys<T>],
  arr: T,
  callback?: GruopByCb<T>,
  callbackAll?: GruopByCbAll<T>,
  join?: string,
  num?: number
): Array<{ key: string; value: GetArrObj<T>[] }>;
export function groupBy<T extends Record<string, any>[]>(
  keys: [GetArrObjKeys<T>[]],
  arr: T,
  callback?: GruopByCb<T>,
  callbackAll?: GruopByCbAll<T>,
  join?: string,
  num?: number
): Array<{ key: any[]; value: GetArrObj<T>[] }>;
export function groupBy<T extends Record<string, any>[]>(
  keys: Array<GetArrObjKeys<T> | Array<GetArrObjKeys<T>>>,
  arr: T,
  callback?: GruopByCb<T>,
  callbackAll?: GruopByCbAll<T>,
  join?: string,
  num?: number
): Array<any>;

/**
 * 数组倒循环
 * @param {Array}      arr       数组;
 * @param {Funtction}  callback  回调函数;
 */
export function reverseForEach<T extends any[]>(arr: T, callback: (item: GetArrObj<T>, index: number) => void): void;

/**
 * 数组元素交换位置
 * @param {Array}   arr     数组;
 * @param {number}  index   索引1;
 * @param {number}  index2  索引2;
 */
export function exchangeArrP<T extends any[]>(arr: T, index: number, index2: number): void;
