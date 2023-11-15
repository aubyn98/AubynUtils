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

export async function getFile(opts = { multiple: false }) {
  try {
    const fileList = [];
    const fileHandles = await window.showOpenFilePicker(opts);
    for (const item of fileHandles) {
      const file = await item.getFile();
      fileList.push(file);
    }
    return fileList;
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function imgFilesHandle(imgFiles = []) {
  try {
    const imgList = [];
    for (const file of imgFiles) {
      const dataURL = await readFileAs(file, 'DataURL');
      imgList.push({ dataURL, file });
    }
    return imgList;
  } catch (e) {
    return Promise.reject(e);
  }
}

const ImgPickerOpts = {
  types: [
    {
      description: '选择图片',
      accept: {
        'image/*': ['.png', '.gif', '.jpeg', '.jpg']
      }
    }
  ],
  excludeAcceptAllOption: true
};
export async function getImgFile(opts = { multiple: false }, dataURL = false) {
  try {
    const fileList = [];
    const fileHandles = await window.showOpenFilePicker({ ...ImgPickerOpts, ...opts });
    for (const item of fileHandles) {
      const file = await item.getFile();
      if (dataURL) {
        const dataURL = await readFileAs(file, 'DataURL');
        fileList.push({ dataURL, file });
        continue;
      }
      fileList.push({ file });
    }
    return fileList;
  } catch (e) {
    return Promise.reject(e);
  }
}

const ExelPickerOpts = {
  types: [
    {
      description: '选择excel表格',
      accept: {
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
      }
    }
  ],
  excludeAcceptAllOption: true
};
export async function getExcelFile(opts = { multiple: false }) {
  try {
    const fileList = [];
    const fileHandles = await window.showOpenFilePicker({ ...ExelPickerOpts, ...opts });
    for (const item of fileHandles) {
      const file = await item.getFile();
      fileList.push(file);
    }
    return fileList;
  } catch (e) {
    return Promise.reject(e);
  }
}

const XmlPickerOpts = {
  types: [
    {
      description: '选择xml文件',
      accept: {
        'xml/*': ['.xml']
      }
    }
  ],
  excludeAcceptAllOption: true
};
export async function getXmlFile(opts = { multiple: false }) {
  try {
    const fileList = [];
    const fileHandles = await window.showOpenFilePicker({ ...XmlPickerOpts, ...opts });
    for (const item of fileHandles) {
      const file = await item.getFile();
      fileList.push(file);
    }
    return fileList;
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function getInputFile(opts = { multiple: false }) {
  return new Promise((resolve, reject) => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      if (opts.multiple) fileInput.multiple = 'multiple';
      fileInput.accept = opts.accept;
      fileInput.onchange = e => {
        resolve([...e.target.files]);
      };
      fileInput.click();
    } catch (e) {
      reject(e);
    }
  });
}

export async function getImgFile2(opts = { multiple: false }, dataURL = false) {
  return getInputFile({ ...opts, accept: 'image/*' }, dataURL).then(fileList => {
    if (dataURL) return Promise.all(fileList.map(file => readFileAs(file, 'DataURL').then(i => ({ dataURL: i, file }))));
    else return fileList.map(file => ({ file }));
  });
}

export async function getVideoFile2(opts = { multiple: false }, dataURL = false) {
  return getInputFile({ ...opts, accept: 'video/*' }, dataURL).then(fileList => {
    if (dataURL) return Promise.all(fileList.map(file => readFileAs(file, 'DataURL').then(i => ({ dataURL: i, file }))));
    else return fileList.map(file => ({ file }));
  });
}

export async function getExcelFile2(opts = { multiple: false }) {
  return getInputFile({ ...opts, accept: '.xls,.xlsx' });
}

export async function getXmlFile2(opts = { multiple: false }) {
  return getInputFile({ ...opts, accept: 'xml/*' });
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

export function stringToBinary(str) {
  const buf = new ArrayBuffer(str.length);
  const ut8 = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    ut8[i] = str[i].charCodeAt(i).toString(2);
  }
  return buf;
}
