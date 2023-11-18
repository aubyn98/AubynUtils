import * as aubyn from './src';
console.log(window.aubyn = aubyn);
import { getFile, getInputFile, getPdfFile } from './src';
app.onclick = () =>
  getPdfFile(void 0, 'ArrayBuffer').then(res => {
    console.log(res);
    res.forEach(r => {
      r.ArrayBuffer;
      r.Text;
    });
  });

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
