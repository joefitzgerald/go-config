'use babel'

import {CompositeDisposable} from 'atom'
import {isTruthy, isFalsy} from './check'
import {Executor} from './executor'
import {PathHelper} from './pathhelper'
import _ from 'lodash'
import fs from 'fs'
import os from 'os'
import path from 'path'

class RuntimeLocator {
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
    this.runtimeCandidates()
    return []
  }

  currentRuntime (options) {
    return {}
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
      if (isTruthy(c) && c.length > 0) {
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

export {RuntimeLocator}

/*
module.exports =
class GoRuntimeProvider
  gopathStrategies: null
  subscriptions: null

  constructor: ->
    @gopathStrategies = [new Environment()]
    @subscriptions = new CompositeDisposable

  detect: ->
    # Do stuff
    console.log 'detect!'

  current: ->
    return {}

  all: ->
    return []

  gopath: ->
    return ''

  dispose: ->
    @subscriptions?.dispose()
    @subscriptions = null

  # OLD VVV
  goTooldirOrGopathBinOrPathItem: (name) ->
    result = @goTooldirItem(name)
    result = @gopathBinOrPathItem(name) unless result? and result
    return result

  gopathBinOrPathItem: (name) ->
    result = @gopathBinItem(name)
    result = @pathItem(name) unless result? and result
    return result

  gopathBinItem: (name) ->
    return false unless name? and name isnt ''
    gopaths = @splitgopath()
    for item in gopaths
      result = path.resolve(path.normalize(path.join(item, 'bin', name + @exe)))
      return fs.realpathSync(result) if fs.existsSync(result)
    return false

  pathItem: (name) ->
    return false unless name? and name isnt ''
    pathresult = false
    # PATH
    p = if os.platform() is 'win32' then @env.Path else @env.PATH
    if p?
      elements = p.split(path.delimiter)
      for element in elements
        target = path.resolve(path.normalize(path.join(element, name + @exe)))
        pathresult = fs.realpathSync(target) if fs.existsSync(target)

    return pathresult

  gorootBinOrPathItem: (name) ->
    return false unless name? and name isnt ''
    result = @gorootBinItem(name)
    result = @pathItem(name) unless result? and result
    return result

  gorootBinItem: (name) ->
    return false unless name? and name isnt ''
    return false unless @goroot? and @goroot isnt ''
    result = path.join(@goroot, 'bin', name + @exe)
    return false unless fs.existsSync(result)
    return fs.realpathSync(result)

  goTooldirItem: (name) ->
    return false unless name? and name isnt ''
    result = path.join(@gotooldir, name + @exe)
    return fs.realpathSync(result) if fs.existsSync(result)
    return false

  toolsAreMissing: ->
    return true if @format() is false
    return true if @golint() is false
    return true if @vet() is false
    return true if @cover() is false
    return true if @gocode() is false
    return true if @oracle() is false
    return true if @git() is false
    return true if @hg() is false
    return false
*/
