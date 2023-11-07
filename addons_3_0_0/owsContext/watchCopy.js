#!/usr/bin/env node
/* eslint-disable */

'use strict';

const path = require('path');
const fs = require('fs-extra');
const watch = require('watch');

const curDir = process.cwd();

if (process.argv.length < 4) {
  console.log('please specify source and target path');
  process.exit(0);
}

const sourcePath = path.join(curDir, process.argv[2]);
const targetPath = path.join(curDir, process.argv[3]);

console.log('sourcePath', sourcePath);
console.log('targetPath', targetPath);

if (!fs.existsSync(targetPath)) {
  throw new Error('target does not exist');
}

async function copy() {

  try {
    console.log(`Copying ${sourcePath} to ${targetPath}…`);
    await fs.copy(sourcePath, targetPath, {
      // do not copy node_modules
      filter: (src, dest) => {
        return src.indexOf('node_modules') === -1
      }
    });

    console.log('…done!');
  } catch (error) {
    console.log('errorA');
    console.log('error', error);
    const {
      stdout,
      stderr
    } = error;
    console.log(stdout);
    console.log(stderr);
  }
}

copy();

let timeout;

function throttle(callback, time) {
  if (!timeout) {
    timeout = setTimeout(function () {
      timeout = null;
      callback();
    }, time);
  }
}

watch.watchTree(sourcePath, function (f, curr, prev) {
  if (typeof f === 'object') {
    console.log('watching…');
  } else {
    throttle(copy, 1000);
  }
});
