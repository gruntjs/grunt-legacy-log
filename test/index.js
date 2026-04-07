/* globals QUnit */
'use strict';

var legacyLog = require('../');
var Log = legacyLog.Log;

// Helper for testing stdout
var hooker = require('hooker');
function stdoutEqual(assert, callback, expected) {
  var actual = '';
  // Hook process.stdout.write
  hooker.hook(process.stdout, 'write', {
    // This gets executed before the original process.stdout.write.
    pre: function(result) {
      // Concatenate uncolored result onto actual.
      actual += result;
      // Prevent the original process.stdout.write from executing.
      return hooker.preempt();
    },
  });
  // Execute the logging code to be tested.
  callback();
  // Restore process.stdout.write to its original value.
  stdoutUnmute();
  // Actually test the actually-logged stdout string to the expected value.
  // assert.equal(legacyLog.uncolor(actual), expected);
  assert.equal(actual, expected);
}

function stdoutMute() {
  hooker.hook(process.stdout, 'write', {
    pre: function() {
      return hooker.preempt();
    },
  });
}

function stdoutUnmute() {
  hooker.unhook(process.stdout, 'write');
}

// Helper function: repeat('a', 3) -> 'aaa', repeat('a', 3, '-') -> 'a-a-a'
function repeat(str, n, separator) {
  var result = str;
  for (var i = 1; i < n; i++) {
    result += (separator || '') + str;
  }
  return result;
}

var fooBuffer = Buffer.from('foo');

QUnit.module('Log instance', function(hooks) {
  hooks.beforeEach(function() {
    this.grunt = {fail: {errorcount: 0}};
  });
  hooks.afterEach(function() {
    stdoutUnmute();
  });
  QUnit.test('write', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() { log.write(''); }, '');
    stdoutEqual(assert, function() { log.write('foo'); }, 'foo');
    stdoutEqual(assert, function() { log.write('%s', 'foo'); }, 'foo');
    stdoutEqual(assert, function() { log.write(fooBuffer); }, 'foo');
  });
  QUnit.test('writeln', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() { log.writeln(); }, '\n');
    stdoutEqual(assert, function() { log.writeln('foo'); }, 'foo\n');
    stdoutEqual(assert, function() { log.writeln('%s', 'foo'); }, 'foo\n');
    stdoutEqual(assert, function() { log.writeln(fooBuffer); }, 'foo\n');
  });
  QUnit.test('warn', function(assert) {
    var log = new Log({grunt: this.grunt});

    stdoutEqual(assert, function() { log.warn(); }, 'ERROR'.red + '\n');
    stdoutEqual(assert, function() { log.warn('foo'); }, '>> '.red + 'foo\n');
    stdoutEqual(assert, function() { log.warn('%s', 'foo'); }, '>> '.red + 'foo\n');
    stdoutEqual(assert, function() { log.warn(fooBuffer); }, '>> '.red + 'foo\n');
    assert.equal(this.grunt.fail.errorcount, 0);
  });
  QUnit.test('error', function(assert) {
    var log = new Log({grunt: this.grunt});

    stdoutEqual(assert, function() { log.error(); }, 'ERROR'.red + '\n');
    stdoutEqual(assert, function() { log.error('foo'); }, '>> '.red + 'foo\n');
    stdoutEqual(assert, function() { log.error('%s', 'foo'); }, '>> '.red + 'foo\n');
    stdoutEqual(assert, function() { log.error(fooBuffer); }, '>> '.red + 'foo\n');
    assert.equal(this.grunt.fail.errorcount, 4);
  });
  QUnit.test('ok', function(assert) {
    var log = new Log({grunt: this.grunt});

    stdoutEqual(assert, function() { log.ok(); }, 'OK'.green + '\n');
    stdoutEqual(assert, function() { log.ok('foo'); }, '>> '.green + 'foo\n');
    stdoutEqual(assert, function() { log.ok('%s', 'foo'); }, '>> '.green + 'foo\n');
    stdoutEqual(assert, function() { log.ok(fooBuffer); }, '>> '.green + 'foo\n');
  });
  QUnit.test('errorlns', function(assert) {
    var log = new Log({grunt: this.grunt});

    stdoutEqual(assert, function() {
      log.errorlns(repeat('foo', 30, ' '));
    }, '>> '.red + repeat('foo', 19, ' ') +
      '\n>> '.red + repeat('foo', 11, ' ') + '\n');
    assert.equal(this.grunt.fail.errorcount, 1);
  });
  QUnit.test('oklns', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() {
      log.oklns(repeat('foo', 30, ' '));
    }, '>> '.green + repeat('foo', 19, ' ') +
      '\n>> '.green + repeat('foo', 11, ' ') + '\n');
  });
  QUnit.test('success', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() { log.success(); }, ''.green + '\n');
    stdoutEqual(assert, function() { log.success('foo'); }, 'foo'.green + '\n');
    stdoutEqual(assert, function() { log.success('%s', 'foo'); }, 'foo'.green + '\n');
    stdoutEqual(assert, function() { log.success(fooBuffer); }, 'foo'.green + '\n');
  });
  QUnit.test('fail', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() { log.fail(); }, ''.red + '\n');
    stdoutEqual(assert, function() { log.fail('foo'); }, 'foo'.red + '\n');
    stdoutEqual(assert, function() { log.fail('%s', 'foo'); }, 'foo'.red + '\n');
    stdoutEqual(assert, function() { log.fail(fooBuffer); }, 'foo'.red + '\n');
  });
  QUnit.test('header', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() { log.header(); }, ''.underline + '\n');
    stdoutEqual(assert, function() { log.header(); }, '\n' + ''.underline + '\n');
    stdoutEqual(assert, function() { log.header('foo'); }, '\n' + 'foo'.underline + '\n');
    stdoutEqual(assert, function() { log.header('%s', 'foo'); }, '\n' + 'foo'.underline + '\n');
    stdoutEqual(assert, function() { log.header(fooBuffer); }, '\n' + 'foo'.underline + '\n');
  });
  QUnit.test('subhead', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() { log.subhead(); }, ''.bold + '\n');
    stdoutEqual(assert, function() { log.subhead(); }, '\n' + ''.bold + '\n');
    stdoutEqual(assert, function() { log.subhead('foo'); }, '\n' + 'foo'.bold + '\n');
    stdoutEqual(assert, function() { log.subhead('%s', 'foo'); }, '\n' + 'foo'.bold + '\n');
    stdoutEqual(assert, function() { log.subhead(fooBuffer); }, '\n' + 'foo'.bold + '\n');
  });
  QUnit.test('writetableln', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() {
      log.writetableln([10], [repeat('foo', 10)]);
    }, 'foofoofoof\noofoofoofo\nofoofoofoo\n');
  });
  QUnit.test('writelns', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() {
      log.writelns(repeat('foo', 30, ' '));
    }, repeat('foo', 20, ' ') + '\n' +
      repeat('foo', 10, ' ') + '\n');
  });
  QUnit.test('writeflags', function(assert) {
    var log = new Log();

    stdoutEqual(assert, function() {
      log.writeflags(['a', 'b']);
    }, 'Flags: ' + 'a'.cyan + ', ' + 'b'.cyan + '\n');
    stdoutEqual(assert, function() {
      log.writeflags(['a', 'b'], 'Prefix');
    }, 'Prefix: ' + 'a'.cyan + ', ' + 'b'.cyan + '\n');
    stdoutEqual(assert, function() {
      log.writeflags({a: true, b: false, c: 0, d: null}, 'Prefix');
    }, 'Prefix: ' + 'a'.cyan + ', ' + 'b=false'.cyan + ', ' + 'c=0'.cyan + ', ' + 'd=null'.cyan + '\n');
  });
  QUnit.test('always', function(assert) {
    var log = new Log();

    assert.strictEqual(log.always, log);
    assert.strictEqual(log.verbose.always, log);
    assert.strictEqual(log.notverbose.always, log);
  });
  QUnit.test('or', function(assert) {
    var log = new Log();

    assert.strictEqual(log.verbose.or, log.notverbose);
    assert.strictEqual(log.notverbose.or, log.verbose);
  });
  QUnit.test('hasLogged', function(assert) {
    // Should only be true if output has been written!
    var log = new Log();
    assert.equal(log.hasLogged, false);
    assert.equal(log.verbose.hasLogged, false);
    assert.equal(log.notverbose.hasLogged, false);
    log.write('');
    assert.equal(log.hasLogged, true);
    assert.equal(log.verbose.hasLogged, true);
    assert.equal(log.notverbose.hasLogged, true);

    log = new Log({verbose: true});
    log.verbose.write('');
    assert.equal(log.hasLogged, true);
    assert.equal(log.verbose.hasLogged, true);
    assert.equal(log.notverbose.hasLogged, true);

    log = new Log();
    log.notverbose.write('');
    assert.equal(log.hasLogged, true);
    assert.equal(log.verbose.hasLogged, true);
    assert.equal(log.notverbose.hasLogged, true);

    stdoutMute();
    log = new Log({debug: true});
    log.debug('');
    assert.equal(log.hasLogged, true);
    assert.equal(log.verbose.hasLogged, true);
    assert.equal(log.notverbose.hasLogged, true);
    stdoutUnmute();

    // The following should be false since there's a verbose mismatch!
    log = new Log();
    log.verbose.write('');
    assert.equal(log.hasLogged, false);
    assert.equal(log.verbose.hasLogged, false);
    assert.equal(log.notverbose.hasLogged, false);

    log = new Log({verbose: true});
    log.notverbose.write('');
    assert.equal(log.hasLogged, false);
    assert.equal(log.verbose.hasLogged, false);
    assert.equal(log.notverbose.hasLogged, false);

    // The following should be false since there's a debug mismatch!
    log = new Log();
    log.debug('');
    assert.equal(log.hasLogged, false);
    assert.equal(log.verbose.hasLogged, false);
    assert.equal(log.notverbose.hasLogged, false);
  });
  QUnit.test('muted', function(assert) {
    var log = new Log();

    assert.equal(log.muted, false);
    assert.equal(log.verbose.muted, false);
    assert.equal(log.notverbose.muted, false);
    assert.equal(log.options.muted, false);
    assert.equal(log.verbose.options.muted, false);
    assert.equal(log.notverbose.options.muted, false);

    log.muted = true;
    assert.equal(log.muted, true);
    assert.equal(log.verbose.muted, true);
    assert.equal(log.notverbose.muted, true);
    assert.equal(log.options.muted, true);
    assert.equal(log.verbose.options.muted, true);
    assert.equal(log.notverbose.options.muted, true);

    log.muted = false;
    assert.equal(log.muted, false);
    assert.equal(log.verbose.muted, false);
    assert.equal(log.notverbose.muted, false);
    assert.equal(log.options.muted, false);
    assert.equal(log.verbose.options.muted, false);
    assert.equal(log.notverbose.options.muted, false);

    log.options.muted = true;
    assert.equal(log.muted, true);
    assert.equal(log.verbose.muted, true);
    assert.equal(log.notverbose.muted, true);
    assert.equal(log.options.muted, true);
    assert.equal(log.verbose.options.muted, true);
    assert.equal(log.notverbose.options.muted, true);

    log.options.muted = false;
    assert.equal(log.muted, false);
    assert.equal(log.verbose.muted, false);
    assert.equal(log.notverbose.muted, false);
    assert.equal(log.options.muted, false);
    assert.equal(log.verbose.options.muted, false);
    assert.equal(log.notverbose.options.muted, false);
  });
  QUnit.test('verbose', function(assert) {
    var log = new Log();
    log.muted = true;

    // Test verbose methods to make sure they always return the verbose object.
    assert.strictEqual(log.verbose.write(''), log.verbose);
    assert.strictEqual(log.verbose.writeln(''), log.verbose);
    assert.strictEqual(log.verbose.warn(''), log.verbose);
    assert.strictEqual(log.verbose.error(''), log.verbose);
    assert.strictEqual(log.verbose.ok(''), log.verbose);
    assert.strictEqual(log.verbose.errorlns(''), log.verbose);
    assert.strictEqual(log.verbose.oklns(''), log.verbose);
    assert.strictEqual(log.verbose.success(''), log.verbose);
    assert.strictEqual(log.verbose.fail(''), log.verbose);
    assert.strictEqual(log.verbose.header(''), log.verbose);
    assert.strictEqual(log.verbose.subhead(''), log.verbose);
    assert.strictEqual(log.verbose.debug(''), log.verbose);
    assert.strictEqual(log.verbose.writetableln([]), log.verbose);
    assert.strictEqual(log.verbose.writelns(''), log.verbose);
    assert.strictEqual(log.verbose.writeflags([]), log.verbose);
  });
  QUnit.test('notverbose', function(assert) {
    var log = new Log();
    log.muted = true;

    // Test notverbose methods to make sure they always return the notverbose object.
    assert.strictEqual(log.notverbose.write(''), log.notverbose);
    assert.strictEqual(log.notverbose.writeln(''), log.notverbose);
    assert.strictEqual(log.notverbose.warn(''), log.notverbose);
    assert.strictEqual(log.notverbose.error(''), log.notverbose);
    assert.strictEqual(log.notverbose.ok(''), log.notverbose);
    assert.strictEqual(log.notverbose.errorlns(''), log.notverbose);
    assert.strictEqual(log.notverbose.oklns(''), log.notverbose);
    assert.strictEqual(log.notverbose.success(''), log.notverbose);
    assert.strictEqual(log.notverbose.fail(''), log.notverbose);
    assert.strictEqual(log.notverbose.header(''), log.notverbose);
    assert.strictEqual(log.notverbose.subhead(''), log.notverbose);
    assert.strictEqual(log.notverbose.debug(''), log.notverbose);
    assert.strictEqual(log.notverbose.writetableln([]), log.notverbose);
    assert.strictEqual(log.notverbose.writelns(''), log.notverbose);
    assert.strictEqual(log.notverbose.writeflags([]), log.notverbose);
  });
  QUnit.test('options.debug = true', function(assert) {
    var log = new Log({debug: true});

    stdoutEqual(assert, function() { log.debug(); }, '[D] ' + ''.magenta + '\n');
    stdoutEqual(assert, function() { log.debug('foo'); }, '[D] ' + 'foo'.magenta + '\n');
    stdoutEqual(assert, function() { log.debug('%s', 'foo'); }, '[D] ' + 'foo'.magenta + '\n');
    stdoutEqual(assert, function() { log.debug(fooBuffer); }, '[D] ' + 'foo'.magenta + '\n');
  });
  QUnit.test('options.verbose = false', function(assert) {
    var log = new Log({verbose: false});

    stdoutEqual(assert, function() { log.notverbose.write('foo'); }, 'foo');
    stdoutEqual(assert, function() { log.notverbose.write('%s', 'foo'); }, 'foo');
    stdoutEqual(assert, function() { log.notverbose.write(fooBuffer); }, 'foo');
    stdoutEqual(assert, function() { log.verbose.write('foo'); }, '');
    stdoutEqual(assert, function() { log.verbose.write('%s', 'foo'); }, '');
    stdoutEqual(assert, function() { log.verbose.write(fooBuffer); }, '');
    stdoutEqual(assert, function() { log.verbose.write('a').or.write('b'); }, 'b');
  });
  QUnit.test('options.verbose = true', function(assert) {
    var log = new Log({verbose: true});

    stdoutEqual(assert, function() { log.verbose.write('foo'); }, 'foo');
    stdoutEqual(assert, function() { log.verbose.write('%s', 'foo'); }, 'foo');
    stdoutEqual(assert, function() { log.verbose.write(fooBuffer); }, 'foo');
    stdoutEqual(assert, function() { log.notverbose.write('foo'); }, '');
    stdoutEqual(assert, function() { log.notverbose.write('%s', 'foo'); }, '');
    stdoutEqual(assert, function() { log.notverbose.write(fooBuffer); }, '');
    stdoutEqual(assert, function() { log.notverbose.write('a').or.write('b'); }, 'b');
  });
  QUnit.test('options.debug = false', function(assert) {
    var log = new Log({debug: false});

    stdoutEqual(assert, function() { log.debug('foo'); }, '');
  });
  QUnit.test('options.color = true', function(assert) {
    var log = new Log({color: true});

    stdoutEqual(assert, function() { log.write('foo'.blue + 'bar'.underline); }, 'foo'.blue + 'bar'.underline);
  });
  QUnit.test('options.color = false', function(assert) {
    var log = new Log({color: false});

    stdoutEqual(assert, function() { log.write('foo'.blue + 'bar'.underline); }, 'foobar');
  });
  QUnit.test('perma-bind this when passing grunt in (backcompat)', function(assert) {
    var log = new Log({grunt: this.grunt});
    stdoutMute();
    [
      'write',
      'writeln',
      'warn',
      'error',
      'ok',
      'errorlns',
      'oklns',
      'success',
      'fail',
      'header',
      'subhead',
      'debug',
    ].forEach(function(method) {
      var fn = log[method];
      var verboseFn = log.verbose[method];
      var notVerboseFn = log.notverbose[method];
      assert.equal(fn(), log, 'Should return log if invoked in a way where this is not log.');
      assert.equal(verboseFn(), log.verbose, 'Should return log.verbose if invoked in a way where this is not log.');
      assert.equal(
        notVerboseFn(),
        log.notverbose,
        'Should return log.notverbose if invoked in a way where this is not log.'
      );
    });

    var fn;
    // Should not throw if invoked in a way where this is not log.
    fn = log.writetableln; fn([]);
    fn = log.writelns; fn([]);
    fn = log.writeflags; fn([]);
    fn = log.wordlist; fn([]);
    fn = log.uncolor; fn('');
    fn = log.wraptext; fn(1,'');
    fn = log.table; fn([],'');
  });
});

QUnit.module('Helpers', function() {
  QUnit.test('uncolor', function(assert) {
    var log = new Log();
    assert.ok(log.uncolor);
    assert.strictEqual(log.uncolor, legacyLog.uncolor);
  });
  QUnit.test('wordlist', function(assert) {
    var log = new Log();
    assert.ok(log.wordlist);
    assert.strictEqual(log.wordlist, legacyLog.wordlist);
  });
  QUnit.test('wraptext', function(assert) {
    var log = new Log();
    assert.ok(log.wraptext);
    assert.strictEqual(log.wraptext, legacyLog.wraptext);
  });
  QUnit.test('table', function(assert) {
    var log = new Log();
    assert.ok(log.table);
    assert.strictEqual(log.table, legacyLog.table);
  });
});
