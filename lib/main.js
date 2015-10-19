'use babel'

import {CompositeDisposable} from 'atom'
import {isTruthy} from './check'
import {Executor} from './executor'

export default {
  environment: null,
  locator: null,
  subscriptions: null,

  activate () {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', 'go-runtime:detect', () => { }))
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
    this.locator = null
  },

  getExecutor (options) {
    let e = new Executor({environmentFn: this.getEnvironment.bind(this)})
    return e
  },

  getLocator () {
    if (isTruthy(this.locator)) {
      return this.locator
    }
    let Locator = require('./locator').Locator
    this.locator = new Locator({
      environment: this.getEnvironment.bind(this),
      executor: this.getExecutor(),
      ready: this.ready.bind(this)
    })
    this.subscriptions.add(this.locator)
    return this.locator
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
    return {executor: this.getExecutor(), locator: this.getLocator()}
  },

  consumeEnvironment (environment) {
    this.environment = environment
  }
}
