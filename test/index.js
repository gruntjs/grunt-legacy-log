'use strict';

// var es = require('event-stream');
var legacyLog = require('../');
var Log = legacyLog.Log;


// Helper for testing stdout
var hooker = require('hooker');
var stdoutEqual = function(test, callback, expected) {
  var actual = '';
  // Hook process.stdout.write
  hooker.hook(process.stdout, 'write', {
    // This gets executed before the original process.stdout.write.
    pre: function(result) {
      // Concatenate uncolored result onto actual.
      actual += legacyLog.uncolor(result);
      // Prevent the original process.stdout.write from executing.
      return hooker.preempt();
    }
  });
  // Execute the logging code to be tested.
  callback();
  // Restore process.stdout.write to its original value.
  hooker.unhook(process.stdout, 'write');
  // Actually test the actually-logged stdout string to the expected value.
  test.equal(actual, expected);
};

// Helper function: repeat('a', 3) -> 'aaa', repeat('a', 3, '-') -> 'a-a-a'
function repeat(str, n, separator) {
  var result = str;
  for (var i = 1; i < n; i++) {
    result += (separator || '') + str;
  }
  return result;
}

var fooBuffer = new Buffer('foo');

exports['log'] = {
  'setUp': function(done) {
    this.grunt = {fail: {errorcount: 0}};
    done();
  },
  'write': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.write(''); }, '');
    stdoutEqual(test, function() { log.write('foo'); }, 'foo');
    stdoutEqual(test, function() { log.write('%s', 'foo'); }, 'foo');
    stdoutEqual(test, function() { log.write(fooBuffer); }, 'foo');

    test.done();
  },
  'writeln': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.writeln(); }, '\n');
    stdoutEqual(test, function() { log.writeln('foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.writeln('%s', 'foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.writeln(fooBuffer); }, 'foo\n');

    test.done();
  },
  'warn': function(test) {
    test.expect(5);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() { log.warn(); }, 'ERROR\n');
    stdoutEqual(test, function() { log.warn('foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.warn('%s', 'foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.warn(fooBuffer); }, '>> foo\n');
    test.equal(this.grunt.fail.errorcount, 0);

    test.done();
  },
  'error': function(test) {
    test.expect(5);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() { log.error(); }, 'ERROR\n');
    stdoutEqual(test, function() { log.error('foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.error('%s', 'foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.error(fooBuffer); }, '>> foo\n');
    test.equal(this.grunt.fail.errorcount, 4);

    test.done();
  },
  'ok': function(test) {
    test.expect(4);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() { log.ok(); }, 'OK\n');
    stdoutEqual(test, function() { log.ok('foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.ok('%s', 'foo'); }, '>> foo\n');
    stdoutEqual(test, function() { log.ok(fooBuffer); }, '>> foo\n');

    test.done();
  },
  'errorlns': function(test) {
    test.expect(2);
    var log = new Log({grunt: this.grunt});

    stdoutEqual(test, function() {
      log.errorlns(repeat('foo', 30, ' '));
    }, '>> ' + repeat('foo', 19, ' ') + '\n' +
      '>> ' + repeat('foo', 11, ' ') + '\n');
    test.equal(this.grunt.fail.errorcount, 1);

    test.done();
  },
  'oklns': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.oklns(repeat('foo', 30, ' '));
    }, '>> ' + repeat('foo', 19, ' ') + '\n' +
      '>> ' + repeat('foo', 11, ' ') + '\n');

    test.done();
  },
  'success': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.success(); }, '\n');
    stdoutEqual(test, function() { log.success('foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.success('%s', 'foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.success(fooBuffer); }, 'foo\n');

    test.done();
  },
  'fail': function(test) {
    test.expect(4);
    var log = new Log();

    stdoutEqual(test, function() { log.fail(); }, '\n');
    stdoutEqual(test, function() { log.fail('foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.fail('%s', 'foo'); }, 'foo\n');
    stdoutEqual(test, function() { log.fail(fooBuffer); }, 'foo\n');

    test.done();
  },
  'header': function(test) {
    test.expect(5);
    var log = new Log();

    stdoutEqual(test, function() { log.header(); }, '\n');
    stdoutEqual(test, function() { log.header(); }, '\n\n');
    stdoutEqual(test, function() { log.header('foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.header('%s', 'foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.header(fooBuffer); }, '\nfoo\n');

    test.done();
  },
  'subhead': function(test) {
    test.expect(5);
    var log = new Log();

    stdoutEqual(test, function() { log.subhead(); }, '\n');
    stdoutEqual(test, function() { log.subhead(); }, '\n\n');
    stdoutEqual(test, function() { log.subhead('foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.subhead('%s', 'foo'); }, '\nfoo\n');
    stdoutEqual(test, function() { log.subhead(fooBuffer); }, '\nfoo\n');

    test.done();
  },
  'options.debug = true': function(test) {
    test.expect(4);
    var log = new Log({debug: true});

    stdoutEqual(test, function() { log.debug(); }, '[D] \n');
    stdoutEqual(test, function() { log.debug('foo'); }, '[D] foo\n');
    stdoutEqual(test, function() { log.debug('%s', 'foo'); }, '[D] foo\n');
    stdoutEqual(test, function() { log.debug(fooBuffer); }, '[D] foo\n');

    test.done();
  },
  'options.debug = false': function(test) {
    test.expect(1);
    var log = new Log({debug: false});

    stdoutEqual(test, function() { log.debug('foo'); }, '');

    test.done();
  },
  'writetableln': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.writetableln([10], [repeat('foo', 10)]);
    }, 'foofoofoof\noofoofoofo\nofoofoofoo\n');

    test.done();
  },
  'writelns': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.writelns(repeat('foo', 30, ' '));
    }, repeat('foo', 20, ' ') + '\n' +
      repeat('foo', 10, ' ') + '\n');

    test.done();
  },
  'writeflags': function(test) {
    test.expect(1);
    var log = new Log();

    stdoutEqual(test, function() {
      log.writeflags(['foo', 'bar'], 'test');
    }, 'test: foo, bar\n');

    test.done();
  },
  'verbose': function(test) {
    test.expect(1);
    var log = new Log();
    log.muted = true;

    // Test a chain to make sure it's always returning the verbose object.
    var obj;
    ['write','writeln','warn','error','ok'].forEach(function(key) {
      obj = obj ? obj[key]('foo') : log.verbose[key]('foo');
    });

    test.strictEqual(obj, log.verbose);

    test.done();
  },
  // 'notverbose': function(test) {
  //   test.expect(1);
  //   hooker.hook(process.stdout, 'write', {
  //     pre: function() { return hooker.preempt(); }
  //   });

  //   // Test a chain to make sure it's always returning the notverbose object.
  //   var obj;
  //   ['write','writeln','warn','error','ok'].forEach(function(key) {
  //     obj = obj ? obj[key]('foo') : log.notverbose[key]('foo');
  //   });

  //   test.strictEqual(obj, log.notverbose);

  //   hooker.unhook(process.stdout, 'write');
  //   test.done();
  // }
};
