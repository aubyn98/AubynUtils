import * as aubyn from './src';
console.log((window.aubyn = aubyn));
import { getFile, getInputFile, getPdfFile } from './src';
app.onclick = () => {
  aubyn.getFile(void 0, ['ArrayBuffer', 'Text', 'DataURL']).then(res => {
    console.log(res);
    /* aubyn.filesHandle(res, ['ArrayBuffer', 'Text']).then(r => {
      console.log(r[0]);
    }); */
  });
};

/* getImgFile(void 0, 'DataURL').then(res => {
  res.forEach(r => {
    r.DataURL;
  });
});

getImgFile(void 0, 'Text').then(res => {
  res.forEach(r => {
    r.Text;
  });
});

getImgFile(void 0, 'ArrayBuffer').then(res => {
  res.forEach(r => {
    r.ArrayBuffer;
  });
});

getZipFile(void 0, ['ArrayBuffer', 'Text']).then(res => {
  res.forEach(r => {
    r.ArrayBuffer;
    r.Text;
  });
}); */
