'use babel'
/* eslint-env jasmine */

describe('go-config', () => {
  let goconfigMain = null

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage('environment')
    })
    waitsForPromise(() => {
      return atom.packages.activatePackage('go-config').then((pack) => {
        goconfigMain = pack.mainModule
      })
    })
    waitsFor(() => { return goconfigMain.ready() })
  })

  describe('when the go-config package is activated', () => {
    it('manages subscriptions', () => {
      expect(goconfigMain).toBeDefined()
      expect(goconfigMain.subscriptions).toBeDefined()
      expect(goconfigMain.subscriptions).toBeTruthy()
    })

    it('disposes correctly', () => {
      expect(goconfigMain).toBeDefined()
      expect(goconfigMain.subscriptions).toBeDefined()
      expect(goconfigMain.subscriptions).toBeTruthy()
      expect(goconfigMain.environment).toBeDefined()
      expect(goconfigMain.environment).toBeTruthy()
      goconfigMain.getLocator()
      expect(goconfigMain.locator).toBeDefined()
      expect(goconfigMain.locator).toBeTruthy()

      goconfigMain.dispose()
      expect(goconfigMain.subscriptions).toBeFalsy()
      expect(goconfigMain.environment).toBeFalsy()
      expect(goconfigMain.locator).toBeFalsy()

      goconfigMain.activate()
    })

    it('gets a Locator', () => {
      expect(goconfigMain.getLocator).toBeDefined()
      let locator = goconfigMain.getLocator()
      expect(locator).toBeDefined()
      expect(locator).toBeTruthy()
    })

    it('gets an executor', () => {
      expect(goconfigMain.getExecutor).toBeDefined()
      let executor = goconfigMain.getExecutor()
      expect(executor).toBeDefined()
      expect(executor).toBeTruthy()
    })

    it('is ready', () => {
      expect(goconfigMain.ready).toBeDefined()
      expect(goconfigMain.ready()).toBe(true)
    })

    it('provides a service', () => {
      expect(goconfigMain.provide).toBeDefined()
      let provider = goconfigMain.provide()
      expect(provider).toBeTruthy()
      expect(provider.executor).toBeTruthy()
      expect(provider.locator).toBeTruthy()
      expect(provider.locator.runtimes).toBeDefined()
      expect(provider.locator.runtime).toBeDefined()
      expect(provider.locator.gopath).toBeDefined()
      expect(provider.locator.findTool).toBeDefined()
      expect(provider.locator.runtimeCandidates).not.toBeDefined()
      let p = false

      waitsForPromise(() => {
        p = provider.locator.runtimes().then((runtimes) => {
          expect(runtimes.length).toBeGreaterThan(0)
          return true
        })
        return p
      })

      waitsForPromise(() => {
        p = provider.locator.runtime().then((runtime) => {
          expect(runtime).toBeTruthy()
          return true
        })
        return p
      })
    })
  })

  describe('when the environment is not available', () => {
    let e = null
    beforeEach(() => {
      e = goconfigMain.environment
      goconfigMain.environment = null
    })
    afterEach(() => {
      goconfigMain.environment = e
    })

    it('is not ready', () => {
      expect(goconfigMain.ready).toBeDefined()
      expect(goconfigMain.ready()).toBe(false)
    })

    it('returns the process environment', () => {
      expect(goconfigMain.environment).toBeFalsy()
      expect(goconfigMain.getEnvironment).toBeDefined()
      expect(goconfigMain.getEnvironment()).toBeTruthy()
      expect(goconfigMain.getEnvironment()).toBe(process.env)
    })

    it('consumes an environment', () => {
      expect(goconfigMain.environment).toBeFalsy()
      goconfigMain.consumeEnvironment({PING: 'PONG'})
      expect(goconfigMain.environment).toBeTruthy()
      expect(goconfigMain.environment.PING).toBe('PONG')
      expect(goconfigMain.environment.PONG).not.toBeDefined()
    })
  })
})
