'use babel'

import {BufferedProcess} from 'atom'
import {spawnSync} from 'child_process'
import fs from 'fs-plus'
import {isTruthy, isFalsy} from './check'

class Executor {
  constructor (options) {
    this.environmentFn = null
    if (isFalsy(options) || isFalsy(options.environmentFn)) {
      return
    }

    this.environmentFn = options.environmentFn
  }

  dispose () {
    this.environmentFn = null
  }

  environment () {
    if (isFalsy(this.environmentFn)) {
      return process.env
    }

    return this.environmentFn()
  }

  execSync (command, cwd, env = this.environment(), args = [], input = null) {
    let options = {cwd: null, env: env, encoding: 'utf8'}
    if (cwd && cwd.length > 0) {
      options.cwd = fs.realpathSync(cwd)
    }

    if (input && input.length) {
      options.input = input
    }

    if (isFalsy(args)) {
      args = []
    }

    let done = spawnSync(command, args, options)
    let code = done.status

    let stdout = ''
    if (done.stdout && done.stdout.length > 0) {
      stdout = done.stdout
    }
    let stderr = ''
    if (done.stderr && done.stderr.length > 0) {
      stderr = done.stderr
    }
    let error = done.error
    if (error && error.code) {
      switch (error.code) {
        case 'ENOENT':
          code = 127
          break
        case 'ENOTCONN': // https://github.com/iojs/io.js/pull/1214
          error = null
          code = 0
          break
      }
    }

    return {code: code, stdout: stdout, stderr: stderr, error: error}
  }

  exec (command, cwd, env = this.environment(), callback = null, args = [], input = null) {
    let options = {cwd: null, env: env, encoding: 'utf8'}
    if (cwd && cwd.length > 0) {
      options.cwd = fs.realpathSync(cwd)
    }

    if (input && input.length) {
      options.input = input
    }

    let stdout = ''
    let stderr = ''
    let stdoutFn = (data) => { stdout += data }
    let stderrFn = (data) => { stderr += data }
    let exitFn = (code) => {
      if (isTruthy(callback)) {
        callback({exitcode: code, stdout: stdout, stderr: stderr}, null)
      }
    }
    if (isFalsy(args)) {
      args = []
    }
    let bufferedprocess = new BufferedProcess({command: command, args: args, options: options, stdout: stdoutFn, stderr: stderrFn, exit: exitFn})
    bufferedprocess.onWillThrowError((err) => {
      let e = err
      if (isTruthy(err)) {
        if (err.handle) {
          err.handle()
        }
        if (err.error) {
          e = err.error
        }
      }
      callback({exitcode: 127, stdout: stdout, stderr: stderr}, e)
    })

    if (input) {
      bufferedprocess.process.stdin.end(input)
    }
  }
}

export {Executor}
