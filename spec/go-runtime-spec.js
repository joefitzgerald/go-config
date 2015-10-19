'use babel'

describe('go-runtime', () => {
  let goruntimeMain = null

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage('environment')
    })
    waitsForPromise(() => {
      return atom.packages.activatePackage('go-runtime').then(pack => {
        goruntimeMain = pack.mainModule
      })
    })
    waitsFor(() => { return goruntimeMain.ready() })
  })

  describe('when the go-runtime package is activated', () => {
    it('manages subscriptions', () => {
      expect(goruntimeMain).toBeDefined()
      expect(goruntimeMain.subscriptions).toBeDefined()
      expect(goruntimeMain.subscriptions).toBeTruthy()
    })

    it('disposes correctly', () => {
      expect(goruntimeMain).toBeDefined()
      expect(goruntimeMain.subscriptions).toBeDefined()
      expect(goruntimeMain.subscriptions).toBeTruthy()
      expect(goruntimeMain.environment).toBeDefined()
      expect(goruntimeMain.environment).toBeTruthy()
      goruntimeMain.getLocator()
      expect(goruntimeMain.locator).toBeDefined()
      expect(goruntimeMain.locator).toBeTruthy()

      goruntimeMain.dispose()
      expect(goruntimeMain.subscriptions).toBeFalsy()
      expect(goruntimeMain.environment).toBeFalsy()
      expect(goruntimeMain.locator).toBeFalsy()

      goruntimeMain.activate()
    })

    it('gets a Locator', () => {
      expect(goruntimeMain.getLocator).toBeDefined()
      let locator = goruntimeMain.getLocator()
      expect(locator).toBeDefined()
      expect(locator).toBeTruthy()
    })

    it('gets an executor', () => {
      expect(goruntimeMain.getExecutor).toBeDefined()
      let executor = goruntimeMain.getExecutor()
      expect(executor).toBeDefined()
      expect(executor).toBeTruthy()
    })

    it('is ready', () => {
      expect(goruntimeMain.ready).toBeDefined()
      expect(goruntimeMain.ready()).toBe(true)
    })

    it('provides a service', () => {
      expect(goruntimeMain.provide).toBeDefined()
      let provider = goruntimeMain.provide()
      expect(provider).toBeTruthy()
      expect(provider.executor).toBeTruthy()
      expect(provider.locator).toBeTruthy()
    })
  })

  describe('when the environment is not available', () => {
    let e = null
    beforeEach(() => {
      e = goruntimeMain.environment
      goruntimeMain.environment = null
    })
    afterEach(() => {
      goruntimeMain.environment = e
    })

    it('is not ready', () => {
      expect(goruntimeMain.ready).toBeDefined()
      expect(goruntimeMain.ready()).toBe(false)
    })

    it('returns the process environment', () => {
      expect(goruntimeMain.environment).toBeFalsy()
      expect(goruntimeMain.getEnvironment).toBeDefined()
      expect(goruntimeMain.getEnvironment()).toBeTruthy()
      expect(goruntimeMain.getEnvironment()).toBe(process.env)
    })

    it('consumes an environment', () => {
      expect(goruntimeMain.environment).toBeFalsy()
      goruntimeMain.consumeEnvironment({PING: 'PONG'})
      expect(goruntimeMain.environment).toBeTruthy()
      expect(goruntimeMain.environment.PING).toBe('PONG')
      expect(goruntimeMain.environment.PONG).not.toBeDefined()
    })
  })
})
