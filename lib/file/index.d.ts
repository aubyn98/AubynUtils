interface Opts {
  types: Array<{
    description: string;
    accept: {
      [index: string]: string[];
    };
  }>;
  excludeAcceptAllOption: boolean;
  multiple: boolean;
}
/**
 * 将文件读取为某个类型
 * @param { Blob | File } file 文件 Blob | File
 * @param { string } type 类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function readFileAs(file: Blob | File, type: Exclude<Convert, 'ArrayBuffer'>): Promise<string>;
export function readFileAs(file: Blob | File, type: 'ArrayBuffer'): Promise<ArrayBuffer>;

type Convert = 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer';
type GatFileResType<T> = T extends 'ArrayBuffer' ? ArrayBuffer : string;
/**
 * 获取文件
 * @param { object } opts    可选项
 */
export function getFile(opts?: Opts): Promise<Array<File>>;
/**
 * 获取文件
 * @param { object } opts    可选项
 * @param { string | Array } convert 可选项 字符串或数组  转换类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function getFile<T extends Convert>(opts?: Opts, convert?: T): Promise<Array<{ file: File } & { [K in T]: GatFileResType<T> }>>;
/**
 * 获取文件
 * @param { object } opts    可选项
 * @param { string | Array } convert 可选项 字符串或数组  转换类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function getFile<T extends Convert[]>(
  opts?: Opts,
  convert?: T
): Promise<Array<{ file: File } & { [K in T extends Array<infer U> ? U : never]: GatFileResType<K> }>>;

/**
 * 处理文件列表，将文件读取为某个类型
 * @param files 文件数组 Blob[] | File[]
 */
export function filesHandle(files: FileList | Array<File>): Promise<{ DataURL: string; file: File }[]>;
export function filesHandle(files: Array<Blob>): Promise<{ DataURL: string; file: Blob }[]>;
/**
 * 处理文件列表，将文件读取为某个类型
 * @param files 文件数组 Blob[] | File[]
 * @param { string | Array } convert 可选项 字符串或数组  转换类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function filesHandle<T extends Convert>(files: FileList | Array<File>, convert?: T): Promise<Array<{ file: File } & { [K in T]: GatFileResType<T> }>>;
export function filesHandle<T extends Convert>(files: Array<Blob>, convert?: T): Promise<Array<{ file: Blob } & { [K in T]: GatFileResType<T> }>>;
/**
 * 处理文件列表，将文件读取为某个类型
 * @param files 文件数组 Blob[] | File[]
 * @param { string | Array } convert 可选项 字符串或数组  转换类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function filesHandle<T extends Convert[]>(
  files: FileList | Array<File>,
  convert?: T
): Promise<Array<{ file: File } & { [K in T extends Array<infer U> ? U : never]: GatFileResType<K> }>>;
export function filesHandle<T extends Convert[]>(
  files: Array<Blob>,
  convert?: T
): Promise<Array<{ file: Blob } & { [K in T extends Array<infer U> ? U : never]: GatFileResType<K> }>>;

/**
 * 获取图片文件
 */
export const getImgFile: typeof getFile;
/**
 * 获取视频文件
 */
export const getVideoFile: typeof getFile;
/**
 * 获取Excel文件
 */
export const getExcelFile: typeof getFile;
/**
 * 获取Xml文件
 */
export const getXmlFile: typeof getFile;
/**
 * 获取PDF文件
 */
export const getPdfFile: typeof getFile;
/**
 * 获取压缩文件
 */
export const getZipFile: typeof getFile;

type InputOpts = { multiple?: boolean; accept?: string };
/**
 * 获取文件 - input元素获取
 * @param { function } opts  可选项  { multiple?: boolean; accept?: string };
 */
export function getInputFile(opts?: InputOpts): Promise<Array<File>>;
/**
 * 获取文件
 * @param { object } opts    可选项  { multiple?: boolean; accept?: string };
 * @param { string | Array } convert 可选项 字符串或数组  转换类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function getInputFile<T extends Convert>(opts?: InputOpts, convert?: T): Promise<Array<{ file: File } & { [K in T]: GatFileResType<T> }>>;
/**
 * 获取文件
 * @param { object } opts    可选项  { multiple?: boolean; accept?: string };
 * @param { string | Array } convert 可选项 字符串或数组  转换类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function getInputFile<T extends Convert[]>(
  opts?: InputOpts,
  convert?: T
): Promise<Array<{ file: File } & { [K in T extends Array<infer U> ? U : never]: GatFileResType<K> }>>;

/**
 * 获取图片文件2-input
 */
export const getImgFile2: typeof getInputFile;

/**
 * 获取视频文件2-input
 */
export const getVideoFile2: typeof getInputFile;

/**
 * 获取Excel文件2-input
 */
export const getExcelFile2: typeof getInputFile;

/**
 * 获取Xml文件2-input
 */
export const getXmlFile2: typeof getInputFile;

/**
 * 获取PDF文件2-input
 */
export const getPdfFile2: typeof getInputFile;

/**
 * 获取压缩文件2-input
 */
export const getZipFile2: typeof getInputFile;

/**
 * 导出文件
 * @param { Blob } blob  blob或file数据类型
 * @param { string } name  文件名称
 */
export function exportFile(blob: Blob, name: string): void;

/**
 * base64字符串转换成blob
 * @param {string} str 字符串;
 */
export function base64ToBlob(str: string): Blob;

/**
 * arrayBuffer转换成base64
 * @param {ArrayBuffer} arrayBuffer 字符串;
 */
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): str;

/**
 * base64转换成arrayBuffer
 * @param {string} str 字符串;
 */
export function base64ToArrayBuffer(str: string): ArrayBuffer;
