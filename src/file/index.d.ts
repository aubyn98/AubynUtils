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
 * 获取文件DataURL
 * @param { function } file 文件 Blob | File
 * @param { function } type 类型 'BinaryString' | 'DataURL' | 'Text' | 'ArrayBuffer'
 */
export function readFileAs(file: Blob | File, type: 'BinaryString' | 'DataURL' | 'Text'): Promise<string>;
export function readFileAs(file: Blob | File, type: 'ArrayBuffer'): Promise<ArrayBuffer>;

/**
 * 获取文件
 * @param { function } opts  可选项
 */
export function getFile(opts?: Opts): Promise<Array<Blob | File>>;

/**
 * 处理图片文件列表
 */
export function imgFilesHandle(imgFiles: FileList | Array<Blob | File>): Promise<{ dataURL: string; file: Blob | File }[]>;

/**
 * 获取图片文件
 * @param { function } opts  可选项
 * @param { boolean }  dataURL  默认false,开启则返回 dataURL -> base64
 */
export function getImgFile(opts?: Opts, dataURL = false): Promise<{ dataURL?: string; file: Blob | File }[]>;

/**
 * 获取图片文件2-input
 * @param { function } opts  可选项
 * @param { boolean }  dataURL  默认false,开启则返回 dataURL -> base64
 */
export function getImgFile2(opts?: Opts, dataURL = false): Promise<{ dataURL?: string; file: Blob | File }[]>;

/**
 * 获取视频文件2-input
 * @param { function } opts  可选项
 * @param { boolean }  dataURL  默认false,开启则返回 dataURL -> base64
 */
export function getVideoFile2(opts?: Opts, dataURL = false): Promise<{ dataURL?: string; file: Blob | File }[]>;

/**
 * 获取Excel文件
 * @param { function } opts  可选项
 */
export function getExcelFile(opts?: Opts): Promise<Array<Blob | File>>;
/**
 * 获取Excel文件2-input
 * @param { function } opts  可选项
 */
export function getExcelFile2(opts?: Opts): Promise<Array<Blob | File>>;

/**
 * 获取Xml文件
 * @param { function } opts  可选项
 */
export function getXmlFile(opts?: Opts): Promise<Array<Blob | File>>;
/**
 * 获取Xml文件2-input
 * @param { function } opts  可选项
 */
export function getXmlFile2(opts?: Opts): Promise<Array<Blob | File>>;

/**
 * 获取文件 - input元素获取
 * @param { function } opts  可选项
 */
export function getInputFile(opts: { multiple?: boolean; accept?: string }): Promise<Array<Blob | File>>;

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
 * 把字符串换成二进制数据
 * @param {string}   str     字符串;
 */
export function stringToBinary(str: string): ArrayBuffer;
