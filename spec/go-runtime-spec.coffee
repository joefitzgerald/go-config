GoRuntime = require '../lib/go-runtime'

describe "GoRuntime", ->
  [workspaceElement, goruntime] = []

  beforeEach ->
    runs ->
      workspaceElement = atom.views.getView(atom.workspace)

    waitsForPromise -> atom.packages.activatePackage('go-runtime').then (g) ->
      goruntime = g.mainModule

  describe "when the go-runtime:detect event is triggered", ->
    it "detects installed go runtimes", ->
      expect(goruntime).toBeDefined()
      expect(goruntime.provider).toBeDefined()

      atom.commands.dispatch workspaceElement, 'go-runtime:detect'
      expect(goruntime.provider).toBeDefined()
