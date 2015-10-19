'use babel'

import {CompositeDisposable} from 'atom'
import {isTruthy, isFalsy} from './check'
import {Executor} from './executor'
import {PathHelper} from './pathhelper'
import _ from 'lodash'
import fs from 'fs'
import os from 'os'
import path from 'path'

class Locator {
  constructor (options) {
    this.subscriptions = new CompositeDisposable()
    this.environmentFn = null
    this.executor = null
    this.executableSuffix = ''
    this.pathKey = 'PATH'
    if (os.platform() === 'win32') {
      this.executableSuffix = '.exe'
      this.pathKey = 'Path'
    }
    this.goExecutables = ['go' + this.executableSuffix, 'goapp' + this.executableSuffix]
    this.pathhelper = new PathHelper()
    this.readyFn = null
    if (isTruthy(options)) {
      if (isTruthy(options.environment)) {
        this.environmentFn = options.environment
      }
      if (isTruthy(options.ready)) {
        this.readyFn = options.ready
      }
      if (isTruthy(options.executor)) {
        this.executor = options.executor
      }
    }

    if (this.executor === null) {
      this.executor = new Executor({environmentFn: this.environment.bind(this)})
    }

    this.subscriptions.add(this.executor)
    this.goLocators = [
      () => { return this.editorconfigLocator() },
      () => { return this.configLocator() },
      () => { return this.pathLocator() },
      () => { return this.defaultLocator() }
    ]
  }

  dispose () {
    this.resetRuntimes()
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.goLocators = null
    this.executableSuffix = null
    this.pathKey = null
    this.goExecutables = null
    this.subscriptions = null
    this.environmentFn = null
    this.executor = null
    this.readyFn = null
  }

  runtimes (options) {
    if (isTruthy(this.runtimesCache)) {
      return this.runtimesCache
    }

    let candidates = this.runtimeCandidates()
    if (isFalsy(candidates) || candidates.constructor !== Array || candidates.length < 1) {
      return []
    }

    let viableCandidates = []
    for (let candidate of candidates) {
      let goversion = this.executor.execSync(candidate, path.dirname(candidate), undefined, ['version'], null)
      if (isTruthy(goversion) && goversion.code === 0 && goversion.stdout.startsWith('go ')) {
        let v = {path: candidate, version: goversion.stdout.replace(/\r?\n|\r/g, '')}
        let versionComponents = v.version.split(' ')
        v.name = versionComponents[2]
        v.semver = versionComponents[2]
        if (v.semver.startsWith('go')) {
          v.semver = v.semver.substring(2, v.semver.length)
        }
        viableCandidates.push(v)
      }
    }

    let finalCandidates = []
    for (let viableCandidate of viableCandidates) {
      let goenv = this.executor.execSync(viableCandidate.path, path.dirname(viableCandidate.path), undefined, ['env'], null)
      if (isTruthy(goenv) && goenv.code === 0 && goenv.stdout.trim() !== '') {
        let items = goenv.stdout.split('\n')
        for (let item of items) {
          item = item.replace(/[\n\r]/g, '')
          if (item.includes('=')) {
            let tuple = item.split('=')
            let key = tuple[0]
            let value = tuple[1]
            if (tuple.length > 2) {
              value = tuple.slice(1, tuple.length + 1).join('=')
            }
            if (os.platform() === 'win32') {
              if (key.startsWith('set ')) {
                key = key.substring(4, key.length)
              }
            } else {
              if (value.length > 2) {
                value = value.substring(1, value.length - 1)
              } else {
                value = ''
              }
            }
            viableCandidate[key] = value
          }
        }
        finalCandidates.push(viableCandidate)
      }
    }

    this.runtimesCache = finalCandidates
    return this.runtimesCache
  }

  resetRuntimes () {
    this.runtimesCache = null
  }

  statishSync (pathValue) {
    let stat = false
    if (isTruthy(pathValue) && !(pathValue.trim() === '')) {
      try { stat = fs.statSync(pathValue) } catch (e) { }
    }
    return stat
  }

  runtimeCandidates () {
    let candidates = []
    for (let locator of this.goLocators) {
      let c = locator()
      if (isTruthy(c) && c.constructor === Array && c.length > 0) {
        candidates = _.union(candidates, c)
      }
    }
    return candidates
  }

  editorconfigLocator () {
    // TODO: .editorconfig
    return false
  }

  configLocator () {
    let goinstallation = atom.config.get('go-plus.goInstallation')
    let stat = this.statishSync(goinstallation)
    if (isTruthy(stat)) {
      let d = goinstallation
      if (stat.isFile()) {
        d = path.dirname(goinstallation)
      }
      return this.findExecutablesInPath(d, this.executables)
    }

    return []
  }

  pathLocator () {
    return this.findExecutablesInPath(this.environment()[this.pathKey], this.goExecutables)
  }

  defaultLocator () {
    let installPaths = []
    if (os.platform() === 'win32') {
      /*
      c:\go\bin = Binary Distribution
      c:\tools\go\bin = Chocolatey
      */
      installPaths.push(path.join('c:', 'go', 'bin'))
      installPaths.push(path.join('c:', 'tools', 'go', 'bin'))
    } else {
      /*
      /usr/local/go/bin = Binary Distribution
      /usr/local/bin = Homebrew
      */
      installPaths.push(path.join('/', 'usr', 'local', 'go', 'bin'))
      installPaths.push(path.join('/', 'usr', 'local', 'bin'))
    }
    return this.findExecutablesInPath(installPaths.join(path.delimiter), this.goExecutables)
  }

  findExecutablesInPath (pathValue, executables) {
    let candidates = []
    if (isFalsy(pathValue) || pathValue.constructor !== String || pathValue.trim() === '') {
      return candidates
    }

    if (isFalsy(executables) || executables.constructor !== Array || executables.length < 1) {
      return candidates
    }

    let elements = this.pathhelper.expand(this.environment(), pathValue).split(path.delimiter)
    for (let element of elements) {
      for (let executable of executables) {
        let candidate = path.join(element, executable)
        let stat = this.statishSync(candidate)
        if (isTruthy(stat) && stat.isFile()) {
          candidates.push(candidate)
        }
      }
    }
    return candidates
  }

  gopath (options) {
    let e = this.environment()
    if (isFalsy(e.GOPATH) || e.GOPATH.trim() === '') {
      return false
    }

    return this.pathhelper.expand(e, e.GOPATH)
  }

  environment () {
    if (isFalsy(this.environmentFn)) {
      return process.env
    }

    let e = this.environmentFn()
    if (isFalsy(e)) {
      return process.env
    }
    return e
  }

  ready () {
    if (isFalsy(this.readyFn)) {
      return true
    }
    return this.readyFn()
  }
}

export {Locator}
