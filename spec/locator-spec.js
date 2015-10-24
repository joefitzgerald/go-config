'use babel'

import {isTruthy} from './../lib/check'
import {Executor} from './../lib/executor'
import {PathHelper} from './../lib/pathhelper'
import {Locator} from './../lib/locator'
import temp from 'temp'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

describe('Locator', () => {
  let env = null
  let environmentFn = null
  let executor = null
  let arch = null
  let executableSuffix = null
  let pathhelper = null
  let pathkey = null
  let readyFn = null
  let locator = null

  beforeEach(() => {
    temp.track()
    pathhelper = new PathHelper()
    env = process.env
    environmentFn = () => {
      return env
    }
    readyFn = () => { return true }
    arch = process.platform
    executor = new Executor({environmentFn: environmentFn})
    executableSuffix = ''
    pathkey = 'PATH'
    if (os.platform() === 'win32') {
      arch = 'windows'
      executableSuffix = '.exe'
      pathkey = 'Path'
    }

    locator = new Locator({
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

    if (locator !== null) {
      locator.dispose()
      locator = null
    }

    arch = null
    environmentFn = null
    executableSuffix = null
    pathkey = null
    readyFn = null
  })

  describe('when the environment is process.env', () => {
    it('findExecutablesInPath returns an empty array if its arguments are invalid', () => {
      expect(locator.findExecutablesInPath).toBeDefined()
      expect(locator.findExecutablesInPath(false, false).length).toBe(0)
      expect(locator.findExecutablesInPath('', false).length).toBe(0)
      expect(locator.findExecutablesInPath('abcd', false).length).toBe(0)
      expect(locator.findExecutablesInPath('abcd', {bleh: 'abcd'}).length).toBe(0)
      expect(locator.findExecutablesInPath('abcd', 'abcd').length).toBe(0)
      expect(locator.findExecutablesInPath('abcd', []).length).toBe(0)
      expect(locator.findExecutablesInPath([], []).length).toBe(0)
    })

    it('findExecutablesInPath returns an array with elements if its arguments are valid', () => {
      expect(locator.findExecutablesInPath).toBeDefined()
      if (os.platform() === 'win32') {
        expect(locator.findExecutablesInPath('c:\\windows\\system32', ['cmd.exe']).length).toBe(1)
        expect(locator.findExecutablesInPath('c:\\windows\\system32', ['cmd.exe'])[0]).toBe('c:\\windows\\system32\\cmd.exe')
      } else {
        expect(locator.findExecutablesInPath('/bin', ['sh']).length).toBe(1)
        expect(locator.findExecutablesInPath('/bin', ['sh'])[0]).toBe('/bin/sh')
      }
    })
  })

  describe('when the environment has a GOPATH that includes a tilde', () => {
    beforeEach(() => {
      env.GOPATH = path.join('~', 'go')
    })

    it('is defined', () => {
      expect(locator).toBeDefined()
      expect(locator).toBeTruthy()
    })

    it('gopath() returns a path with the home directory expanded', () => {
      expect(locator.gopath).toBeDefined()
      expect(locator.gopath()).toBe(path.join(pathhelper.home(), 'go'))
    })
  })

  describe('when the environment has an empty GOPATH', () => {
    beforeEach(() => {
      if (isTruthy(env.GOPATH)) {
        delete env.GOPATH
      }
    })

    it('gopath() returns false', () => {
      expect(locator.gopath).toBeDefined()
      expect(locator.gopath()).toBe(false)
    })
  })

  describe('when the environment has a GOPATH that is whitespace', () => {
    beforeEach(() => {
      env.GOPATH = '        '
    })

    it('gopath() returns false', () => {
      expect(locator.gopath).toBeDefined()
      expect(locator.gopath()).toBe(false)
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
      env.GOPATH = path.join('~', 'go')
    })

    it('runtimeCandidates() finds the runtime', () => {
      expect(locator.runtimeCandidates).toBeDefined()
      let candidates = locator.runtimeCandidates()
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
      expect(locator.runtimeCandidates).toBeDefined()
      let candidates = locator.runtimeCandidates()
      expect(candidates).toBeTruthy()
      expect(candidates.length).toBeGreaterThan(1)
      expect(candidates[0]).toBe(go)
      expect(candidates[1]).toBe(go1)
    })

    it('runtimeCandidates() returns candidates in the correct order when a candidate occurs multiple times in the path', () => {
      env[pathkey] = godir + path.delimiter + go1dir + path.delimiter + godir
      expect(locator.runtimeCandidates).toBeDefined()
      let candidates = locator.runtimeCandidates()
      expect(candidates).toBeTruthy()
      expect(candidates.length).toBeGreaterThan(1)
      expect(candidates[0]).toBe(go)
      expect(candidates[1]).toBe(go1)
      if (candidates.length > 2) {
        expect(candidates[2]).not.toBe(go)
      }
    })
  })

  describe('when the path includes a directory with go 1.5.1 in it', () => {
    let godir = null
    let gopathdir = null
    let go = null
    beforeEach(() => {
      godir = temp.mkdirSync('go-')
      gopathdir = temp.mkdirSync('gopath-')
      let fakeexecutable = 'go_' + arch + '_amd64' + executableSuffix
      let go151json = path.join(__dirname, 'fixtures', 'go-151-' + arch + '.json')
      let fakego = path.join(__dirname, 'tools', 'go', fakeexecutable)
      go = path.join(godir, 'go' + executableSuffix)
      fs.copySync(fakego, go)
      fs.copySync(go151json, path.join(godir, 'go.json'))
      env[pathkey] = godir
      env['GOPATH'] = gopathdir
    })

    it('runtimeCandidates() finds the runtime', () => {
      expect(locator.runtimeCandidates).toBeDefined()
      let candidates = locator.runtimeCandidates()
      expect(candidates).toBeTruthy()
      expect(candidates.length).toBeGreaterThan(0)
      expect(candidates[0]).toBe(go)
    })

    it('runtimes() returns the runtime', () => {
      expect(locator.runtimes).toBeDefined()
      let runtimes = null
      let done = locator.runtimes().then((r) => { runtimes = r })

      waitsForPromise(() => { return done })

      runs(() => {
        expect(runtimes).toBeTruthy()
        expect(runtimes.length).toBeGreaterThan(1)
        expect(runtimes[0].name).toBe('go1.5.1')
        expect(runtimes[0].semver).toBe('1.5.1')
        expect(runtimes[0].version).toBe('go version go1.5.1 ' + arch + '/amd64')
        expect(runtimes[0].path).toBe(go)
        expect(runtimes[0].GOARCH).toBe('amd64')
        expect(runtimes[0].GOBIN).toBe('')
        if (os.platform() === 'win32') {
          expect(runtimes[0].GOEXE).toBe('.exe')
        } else {
          expect(runtimes[0].GOEXE).toBe('')
        }
        expect(runtimes[0].GOHOSTARCH).toBe('amd64')
        expect(runtimes[0].GOHOSTOS).toBe(arch)
        expect(runtimes[0].GOOS).toBe(arch)
        expect(runtimes[0].GOPATH).toBe(gopathdir)
        expect(runtimes[0].GORACE).toBe('')
        if (os.platform() === 'win32') {
          expect(runtimes[0].GOROOT).toBe('c:\\go')
          expect(runtimes[0].GOTOOLDIR).toBe('c:\\go\\pkg\\tool\\windows_amd64')
          expect(runtimes[0].CC).toBe('gcc')
          expect(runtimes[0].GOGCCFLAGS).toBe('-m64 -mthreads -fmessage-length=0')
          expect(runtimes[0].CXX).toBe('g++')
        } else if (os.platform() === 'darwin') {
          expect(runtimes[0].GOROOT).toBe('/usr/local/Cellar/go/1.5.1/libexec')
          expect(runtimes[0].GOTOOLDIR).toBe('/usr/local/Cellar/go/1.5.1/libexec/pkg/tool/darwin_amd64')
          expect(runtimes[0].CC).toBe('clang')
          expect(runtimes[0].GOGCCFLAGS).toBe('-fPIC -m64 -pthread -fno-caret-diagnostics -Qunused-arguments -fmessage-length=0 -fno-common')
          expect(runtimes[0].CXX).toBe('clang++')
        } else if (os.platform() === 'linux') {
          expect(runtimes[0].GOROOT).toBe('/usr/local/go')
          expect(runtimes[0].GOTOOLDIR).toBe('/usr/local/go/pkg/tool/linux_amd64')
          expect(runtimes[0].CC).toBe('gcc')
          expect(runtimes[0].GOGCCFLAGS).toBe('-fPIC -m64 -pthread -fmessage-length=0')
          expect(runtimes[0].CXX).toBe('g++')
        }
        expect(runtimes[0].GO15VENDOREXPERIMENT).toBe('')
        expect(runtimes[0].CGO_ENABLED).toBe('1')
      })
    })

    it('findTool() finds the go tool', () => {
      expect(locator.findTool).toBeDefined()
      let tool = null
      let done = locator.findTool('go', false, null).then((t) => { tool = t })

      waitsForPromise(() => { return done })

      runs(() => {
        expect(tool).toBeTruthy()
        if (os.platform() === 'win32') {
          expect(tool).toBe('c:\\go\\bin\\go.exe')
        } else if (os.platform() === 'darwin') {
          expect(tool).toBe('/usr/local/Cellar/go/1.5.1/libexec/bin/go')
        } else if (os.platform() === 'linux') {
          expect(tool).toBe('/usr/local/go/bin/go')
        }
      })
    })

    it('findTool() finds tools in GOROOT', () => {
      let tools = ['go', 'godoc', 'gofmt']
      let runtime = false
      let tool = null
      let toolPath = false
      let done = locator.runtimeForProject(false).then((r) => { runtime = r })

      waitsForPromise(() => { return done })

      runs(() => {
        for (let toolItem of tools) {
          tool = null
          done = null
          toolPath = path.join(runtime.GOROOT, 'bin', toolItem + runtime.GOEXE)
          done = locator.findTool(toolItem, false, null).then((t) => { tool = t })
          waitsForPromise(() => { return done })

          runs(() => {
            expect(tool).toBeTruthy()
            expect(tool).toBe(toolPath)
          })
        }
      })
    })

    it('stat() returns false for nonexistent files', () => {
      let stat = null
      let done = locator.stat('nonexistentthing').then((s) => { stat = s })
      waitsForPromise(() => { return done })

      runs(() => {
        expect(stat).toBe(false)
      })
    })

    it('findTool() finds tools in GOTOOLDIR', () => {
      let tools = ['addr2line', 'cgo', 'dist', 'link', 'pack', 'trace', 'api', 'compile', 'doc', 'nm', 'pprof', 'vet', 'asm', 'cover', 'fix', 'objdump', 'yacc']
      let runtime = false
      let done = locator.runtimeForProject(false).then((r) => { runtime = r })

      waitsForPromise(() => { return done })

      runs(() => {
        for (let toolItem of tools) {
          let tool = null
          let toolPath = path.join(runtime.GOTOOLDIR, toolItem + runtime.GOEXE)
          let done = locator.findTool(toolItem, false, null).then((t) => { tool = t })
          waitsForPromise(() => { return done })

          runs(() => {
            expect(tool).toBeTruthy()
            expect(tool).toBe(toolPath)
          })
        }
      })
    })
  })
})
