'use babel'

import {isTruthy} from './../lib/check'
import {Executor} from './../lib/executor'
import {PathHelper} from './../lib/pathhelper'
import {RuntimeLocator} from './../lib/runtime-locator'
import temp from 'temp'
import fs from 'fs'
import os from 'os'
import path from 'path'

describe('Runtime Locator', () => {
  let env = null
  let environmentFn = null
  let executor = null
  let executableSuffix = null
  let pathhelper = null
  let pathkey = null
  let readyFn = null
  let runtimeLocator = null

  beforeEach(() => {
    temp.track()
    pathhelper = new PathHelper()
    env = process.env
    environmentFn = () => {
      return env
    }
    readyFn = () => { return true }
    executor = new Executor({environmentFn: environmentFn})
    executableSuffix = ''
    pathkey = 'PATH'
    if (os.platform() === 'win32') {
      executableSuffix = '.exe'
      pathkey = 'Path'
    }

    runtimeLocator = new RuntimeLocator({
      environment: environmentFn,
      executor: executor,
      ready: readyFn
    })
  })

  afterEach(() => {
    if (executor !== null) {
      executor.dispose()
      executor = null
    }

    if (runtimeLocator !== null) {
      runtimeLocator.dispose()
      runtimeLocator = null
    }

    environmentFn = null
    executableSuffix = null
    pathkey = null
    readyFn = null
  })

  describe('when the environment has a GOPATH that includes a tilde', () => {
    beforeEach(() => {
      env.GOPATH = path.join('~', 'go')
    })

    it('is defined', () => {
      expect(runtimeLocator).toBeDefined()
      expect(runtimeLocator).toBeTruthy()
    })

    it('gopath() returns a path with the home directory expanded', () => {
      expect(runtimeLocator.gopath).toBeDefined()
      expect(runtimeLocator.gopath()).toBe(path.join(pathhelper.home(), 'go'))
    })
  })

  describe('when the environment has an empty GOPATH', () => {
    beforeEach(() => {
      if (isTruthy(env.GOPATH)) {
        delete env.GOPATH
      }
    })

    it('gopath() returns false', () => {
      expect(runtimeLocator.gopath).toBeDefined()
      expect(runtimeLocator.gopath()).toBe(false)
    })
  })

  describe('when the environment has a GOPATH that is whitespace', () => {
    beforeEach(() => {
      env.GOPATH = '        '
    })

    it('gopath() returns false', () => {
      expect(runtimeLocator.gopath).toBeDefined()
      expect(runtimeLocator.gopath()).toBe(false)
    })
  })

  describe('when the PATH has a single directory with a go runtime in it', () => {
    let godir = null
    let go = null
    beforeEach(() => {
      godir = temp.mkdirSync('go-')
      go = path.join(godir, 'go' + executableSuffix)
      fs.writeFileSync(go, '', {encoding: 'utf8', mode: 511})
      env[pathkey] = godir
    })

    it('runtimeCandidates() finds the runtime', () => {
      expect(runtimeLocator.runtimeCandidates).toBeDefined()
      let candidates = runtimeLocator.runtimeCandidates()
      expect(candidates).toBeTruthy()
      expect(candidates.length).toBeGreaterThan(0)
      expect(candidates[0]).toBe(go)
    })
  })

  describe('when the PATH has multiple directories with a go runtime in it', () => {
    let godir = null
    let go1dir = null
    let go = null
    let go1 = null
    beforeEach(() => {
      godir = temp.mkdirSync('go-')
      go1dir = temp.mkdirSync('go1-')
      go = path.join(godir, 'go' + executableSuffix)
      go1 = path.join(go1dir, 'go' + executableSuffix)
      fs.writeFileSync(go, '', {encoding: 'utf8', mode: 511})
      fs.writeFileSync(go1, '', {encoding: 'utf8', mode: 511})
      env[pathkey] = godir + path.delimiter + go1dir
    })

    it('runtimeCandidates() returns the candidates in the correct order', () => {
      expect(runtimeLocator.runtimeCandidates).toBeDefined()
      let candidates = runtimeLocator.runtimeCandidates()
      expect(candidates).toBeTruthy()
      expect(candidates.length).toBeGreaterThan(1)
      expect(candidates[0]).toBe(go)
      expect(candidates[1]).toBe(go1)
    })

    it('runtimeCandidates() returns candidates in the correct order when a candidate occurs multiple times in the path', () => {
      env[pathkey] = godir + path.delimiter + go1dir + path.delimiter + godir
      expect(runtimeLocator.runtimeCandidates).toBeDefined()
      let candidates = runtimeLocator.runtimeCandidates()
      expect(candidates).toBeTruthy()
      expect(candidates.length).toBeGreaterThan(1)
      expect(candidates[0]).toBe(go)
      expect(candidates[1]).toBe(go1)
      if (candidates.length > 2) {
        expect(candidates[2]).not.toBe(go)
      }
    })
  })
})
