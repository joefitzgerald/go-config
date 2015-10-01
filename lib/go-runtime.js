'use babel'

import {CompositeDisposable} from 'atom'
import {isTruthy} from './check'
import {Executor} from './executor'

export default {
  environment: null,
  runtimeLocator: null,
  subscriptions: null,
  toolLocator: null,

  activate () {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', 'go-runtime:detect', () => { this.getRuntimeProvider().detect() }))
  },

  deactivate () {
    this.subscriptions.dispose()
    this.dispose()
  },

  dispose () {
    if (isTruthy(this.subscriptions)) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.environment = null
    this.runtimeLocator = null
    this.toolLocator = null
  },

  getExecutor (options) {
    let e = new Executor({environmentFn: this.getEnvironment.bind(this)})
    return e
  },

  getRuntimeLocator () {
    if (isTruthy(this.runtimeLocator)) {
      return this.runtimeLocator
    }
    let RuntimeLocator = require('./runtime-locator').RuntimeLocator
    this.runtimeLocator = new RuntimeLocator({
      environment: this.getEnvironment.bind(this),
      executor: this.getExecutor(),
      ready: this.ready.bind(this)
    })
    this.subscriptions.add(this.runtimeLocator)
    return this.runtimeLocator
  },

  getToolLocator () {
    if (isTruthy(this.toolLocator)) {
      return this.toolLocator
    }
    let ToolLocator = require('./tool-locator').ToolLocator
    this.toolLocator = new ToolLocator({
      environment: this.getEnvironment.bind(this),
      executor: this.getExecutor(),
      ready: this.ready.bind(this)
    })
    this.subscriptions.add(this.toolLocator)
    return this.toolLocator
  },

  ready () {
    if (isTruthy(this.environment)) {
      return true
    } else {
      return false
    }
  },

  getEnvironment () {
    if (this.ready()) {
      return this.environment
    }

    return process.env
  },

  provide () {
    return {executor: this.getExecutor(), runtime: this.getRuntimeLocator(), tools: this.getToolLocator()}
  },

  consumeEnvironment (environment) {
    this.environment = environment
  }
}
