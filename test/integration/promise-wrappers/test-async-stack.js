var config = require('../../common.js').config;

var assert = require('assert');
const isAsyncSupported = require('is-async-supported');
const ErrorStackParser = require('error-stack-parser');

var skipTest = false;
if (!isAsyncSupported) {
  console.log('no async/await support, skipping test');
  skipTest = true;
  process.exit(0);
}

var assert = require('assert');

var createConnection = require('../../../promise.js').createConnection;
var createPool = require('../../../promise.js').createPool;

function test() {
  // TODO check this is actially required. This meant as a help for pre async/await node
  // to load entire file and do isAsyncSupported check instead of failing with syntax error

  let e1, e2;

  async function test1() {
    e1 = new Error();
    const conn = await createConnection({ host: '0.42.42.42' });
    let [rows, fields] = conn.query('select 1 + 1');
    await Promise.all([conn.query('select 1+1'), conn.query('syntax error')]);
  }

  test1().catch(err => {
    const stack = ErrorStackParser.parse(err);
    const stackExpected = ErrorStackParser.parse(e1);
    assert(stack[1].getLineNumber() === stackExpected[0].getLineNumber() + 1);
  });

  async function test2() {
    const conn = await createConnection(config);
    let [rows, fields] = conn.query('select 1 + 1');
    try {
      e2 = new Error();
      await Promise.all([conn.query('select 1+1'), conn.query('syntax error')]);
    } catch (err) {
      const stack = ErrorStackParser.parse(err);
      const stackExpected = ErrorStackParser.parse(e2);
      assert(stack[1].getLineNumber() === stackExpected[0].getLineNumber() + 1);
      conn.end();
    }
  }

  test2();
}

test();
