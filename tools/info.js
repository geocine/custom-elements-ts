const pretty = require('./pretty-hrtime');
const chalk = require('chalk');

Number.prototype.padLeft = function(base,chr){
  var  len = (String(base || 10).length - String(this).length)+1;
  return len > 0? new Array(len).join(chr || '0')+this : this;
}

const getTime = () => {
  const date = new Date();
  return chalk.grey([ 
    date.getHours().padLeft(),
    date.getMinutes().padLeft(),
    date.getSeconds().padLeft()].join(':'));
};

const transformText = (task, message) => {
  message = (message) ? (':' + message) : '';
  return chalk.cyan(task + message);
};

const startAsync = (task, message) => {
  return new Promise((resolve, reject) => {
    const text = transformText(task, message);
    console.log(`[${getTime()}] Starting '${text}'...`);
    resolve(process.hrtime());
  });
};

const doneAsync = async (task, message, startTime) => {
  return new Promise((resolve, reject) => {
    const text = transformText(task, message);
    const endTime = chalk.magenta(pretty(process.hrtime(startTime)));
    console.log(`[${getTime()}] Finished '${text}' after ${endTime}`);
    resolve();
  });
};

exports.startAsync = startAsync;
exports.doneAsync = doneAsync;