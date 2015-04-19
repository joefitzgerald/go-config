{CompositeDisposable}  = require('atom')
_ = require('underscore-plus')
path = require('path')

module.exports =
class GoRuntimeProvider
  subscriptions: null

  constructor: ->
    @subscriptions = new CompositeDisposable

  detect: ->
    # Do stuff
    console.log 'detect!'

  dispose: ->
    @subscriptions?.dispose()
    @subscriptions = null
