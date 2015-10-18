'use babel'

import {CompositeDisposable} from 'atom'
import {isTruthy, isFalsy} from './check'
import {Executor} from './executor'
// import path from 'path'

class ToolLocator {
  constructor (options) {
    this.subscriptions = new CompositeDisposable()
    this.environmentFn = null
    this.executor = null
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
  }

  dispose () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.environmentFn = null
    this.executor = null
    this.readyFn = null
  }

  findTool (options) {
    return
  }

  getTool (options) {
    return
  }

  environment () {
    if (isFalsy(this.environmentFn)) {
      return process.env
    }

    return this.environmentFn()
  }

  ready () {
    if (isFalsy(this.readyFn)) {
      return true
    }
    return this.readyFn()
  }
}

export {ToolLocator}

/*
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
