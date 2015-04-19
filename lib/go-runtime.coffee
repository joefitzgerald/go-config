{CompositeDisposable} = require 'atom'

module.exports = GoRuntime =
  provider: null
  subscriptions: null

  activate: (state) ->
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.commands.add 'atom-workspace', 'go-runtime:detect': => @getProvider().detect()

  deactivate: ->
    @subscriptions?.dispose()
    @subscriptions = null
    @provider = null

  getProvider: ->
    return @provider if @provider?
    GoRuntimeProvider = require('./go-runtime-provider')
    @provider = new GoRuntimeProvider()
    @subscriptions.add(@provider)
    return @provider

  provide: ->
    return @getProvider()
