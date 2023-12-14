export function readFileAs(file, type) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader['readAs' + type](file);
    fileReader.onload = e => {
      resolve(e.target.result);
    };
    fileReader.onerror = e => {
      reject(e);
    };
  });
}

export async function getFile(opts = { multiple: false }, convert) {
  const isString = typeof convert === 'string';
  const len = convert && convert.length;
  try {
    const fileList = [];
    const fileHandles = await window.showOpenFilePicker(opts);
    for (const item of fileHandles) {
      const file = await item.getFile();
      if (convert) {
        const res = { file };
        if (isString) {
          res[convert] = await readFileAs(file, convert);
        } else if (len) {
          for (let i = 0; i < len; i++) {
            const type = convert[i];
            res[type] = await readFileAs(file, type);
          }
        }
        fileList.push(res);
        continue;
      }
      fileList.push(file);
    }
    return fileList;
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function filesHandle(files = [], convert = 'DataURL') {
  const isString = typeof convert === 'string';
  const len = convert && convert.length;
  try {
    const fileList = [];
    for (const file of files) {
      const res = { file };
      if (isString) {
        res[convert] = await readFileAs(file, convert);
      } else if (len) {
        for (let i = 0; i < len; i++) {
          const type = convert[i];
          res[type] = await readFileAs(file, type);
        }
      }
      fileList.push(res);
    }
    return fileList;
  } catch (e) {
    return Promise.reject(e);
  }
}

const typesDict = {
  img: [
    {
      description: '选择图片',
      accept: {
        'image/*': ['.png', '.gif', '.jpeg', '.jpg']
      }
    }
  ],
  excel: [
    {
      description: '选择excel表格',
      accept: {
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
      }
    }
  ],
  xml: [
    {
      description: '选择xml文件',
      accept: {
        'xml/*': ['.xml']
      }
    }
  ],
  pdf: [
    {
      description: '选择PDF文件',
      accept: {
        'application/vnd.sealedmedia.softseal.pdf': ['.pdf']
      }
    }
  ],
  zip: [
    {
      description: '选择压缩文件',
      accept: {
        'application/zip': ['.zip'],
        'application/x-7z-compressed': ['.7z'],
        'application/x-rar-compressed': ['.rar']
      }
    }
  ],
  video: [
    {
      description: '选择视频文件',
      accept: {
        'video/*': []
      }
    }
  ]
};
function getTypePickerOpts(type, multiple = false) {
  return {
    types: typesDict[type],
    excludeAcceptAllOption: true,
    multiple
  };
}

export async function getImgFile(opts = { multiple: false }, convert) {
  return getFile({ ...getTypePickerOpts('img'), ...opts }, convert);
}

export async function getVideoFile(opts = { multiple: false }, convert) {
  return getFile({ ...getTypePickerOpts('video'), ...opts }, convert);
}

export async function getExcelFile(opts = { multiple: false }, convert) {
  return getFile({ ...getTypePickerOpts('excel'), ...opts }, convert);
}

export async function getXmlFile(opts = { multiple: false }, convert) {
  return getFile({ ...getTypePickerOpts('xml'), ...opts }, convert);
}
export async function getPdfFile(opts = { multiple: false }, convert) {
  return getFile({ ...getTypePickerOpts('pdf'), ...opts }, convert);
}

export async function getZipFile(opts = { multiple: false }, convert) {
  return getFile({ ...getTypePickerOpts('zip'), ...opts }, convert);
}

export async function getInputFile(opts = { multiple: false }, convert) {
  return new Promise((resolve, reject) => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      if (opts.multiple) fileInput.multiple = 'multiple';
      fileInput.accept = opts.accept;
      fileInput.onchange = async e => {
        const files = [...e.target.files];
        if (convert) {
          const fileList = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const res = { file };
            if (typeof convert === 'string') {
              res[convert] = await readFileAs(file, convert);
            } else if (convert.length) {
              for (let i = 0; i < convert.length; i++) {
                const type = convert[i];
                res[type] = await readFileAs(file, type);
              }
            }
            fileList.push(res);
          }
          resolve(fileList);
        } else {
          resolve(files);
        }
      };
      fileInput.click();
    } catch (e) {
      reject(e);
    }
  });
}

export async function getImgFile2(opts = { multiple: false }, convert) {
  return getInputFile({ ...opts, accept: 'image/*' }, convert);
}

export async function getVideoFile2(opts = { multiple: false }, convert) {
  return getInputFile({ ...opts, accept: 'video/*' }, convert);
}

export async function getExcelFile2(opts = { multiple: false }, convert) {
  return getInputFile({ ...opts, accept: '.xls,.xlsx' }, convert);
}

export async function getXmlFile2(opts = { multiple: false }, convert) {
  return getInputFile({ ...opts, accept: 'xml/*' }, convert);
}

export async function getPdfFile2(opts = { multiple: false }, convert) {
  return getInputFile({ ...opts, accept: '.pdf' }, convert);
}

export async function getZipFile2(opts = { multiple: false }, convert) {
  return getInputFile({ ...opts, accept: '.zip,.rar,.7z' }, convert);
}

export function exportFile(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 5000);
}

export function base64ToBlob(url) {
  const arr = url.split(',');
  const data = window.atob(arr[1]);
  const mime = arr[0].match(/:(.*?);/)[1];
  const ia = new Uint8Array(data.length);
  for (var i = 0; i < data.length; i++) {
    ia[i] = data.charCodeAt(i);
  }
  return new Blob([ia], {
    type: mime
  });
}
