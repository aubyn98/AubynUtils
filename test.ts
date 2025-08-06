/* import * as aubyn from './src';
console.log((window.aubyn = aubyn)); */
import { getFile, getInputFile, getPdfFile, getTreePath, findTreeItem, treeItemSetParent, performChunk, idleHandle, WebSocketClient } from './lib';
const socket = new WebSocketClient('ws://localhost:13528')
socket.connect().addEventListener('open', e => console.log('socket connected', e))
performChunk(
  1000,
  (item, i, a) => {
    console.log(1)
  },
  task => {
    idleHandle(e => {
      e.timeRemaining() > 0;
      task(() => e.timeRemaining() > 0);
    });
  }
);
performChunk(1000, (item, i, a) => {
  item;
  i;
  a;
});
