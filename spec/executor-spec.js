'use babel'

import {Executor} from '../lib/executor'
import {PathHelper} from './../lib/pathhelper'
import os from 'os'
import path from 'path'

describe('executor', () => {
  let executor = null
  let prefix = null
  let pathhelper = null
  let result = null
  let error = null

  beforeEach(() => {
    runs(() => {
      result = null
      error = null
      prefix = '/'
      if (os.platform() === 'win32') {
        prefix = 'C:\\'
      }
      pathhelper = new PathHelper()
      executor = new Executor()
    })
  })

  describe('when the executor is used', () => {
    it('has a valid environment', () => {
      expect(executor).toBeDefined()
      expect(executor.environment).toBeDefined()
      expect(executor.environment()).toBeDefined()
      expect(executor.environment()).toBeTruthy()
      expect(executor.environment().PATH).toBeDefined()
      expect(executor.environment().PATH).not.toBe('')
    })
  })

  describe('when asynchronously executing a command', () => {
    it('succeeds', () => {
      let complete = false
      runs(() => {
        let command = 'env'
        if (os.platform() === 'win32') {
          command = path.resolve(__dirname, 'tools', 'env', 'env_windows_amd64.exe')
        }
        let done = (r, e) => {
          result = r
          error = e
          complete = true
        }

        executor.exec(command, prefix, null, done, [])
      })

      waitsFor(() => {
        return complete === true
      })

      runs(() => {
        expect(result).toBeDefined()
        expect(result.exitcode).toBeDefined()
        expect(result.exitcode).toBe(0)
        expect(result.stdout).toBeDefined()
        expect(result.stdout).not.toBe('')
        expect(result.stderr).toBeDefined()
        expect(result.stderr).toBe('')

        expect(error).toBeFalsy()
      })
    })

    it('sets the working directory correctly', () => {
      let complete = false
      runs(() => {
        let command = 'pwd'
        if (os.platform() === 'win32') {
          command = path.resolve(__dirname, 'tools', 'pwd', 'pwd_windows_amd64.exe')
        }
        let done = (r, e) => {
          result = r
          error = e
          complete = true
        }

        executor.exec(command, pathhelper.home(), null, done, [])
      })

      waitsFor(() => {
        return complete === true
      })

      runs(() => {
        expect(result).toBeDefined()
        expect(result.exitcode).toBeDefined()
        expect(result.exitcode).toBe(0)
        expect(result.stdout).toBeDefined()
        expect(result.stdout).toBe(pathhelper.home() + '\n')
        expect(result.stderr).toBeDefined()
        expect(result.stderr).toBe('')

        expect(error).toBeFalsy()
      })
    })

    it('sets the environment correctly', () => {
      let complete = false
      runs(() => {
        let command = 'env'
        if (os.platform() === 'win32') {
          command = path.resolve(__dirname, 'tools', 'env', 'env_windows_amd64.exe')
        }
        let done = (r, e) => {
          result = r
          error = e
          complete = true
        }
        let env = {testenv: 'testing'}

        executor.exec(command, null, env, done, null)
      })

      waitsFor(() => {
        return complete === true
      })

      runs(() => {
        expect(result).toBeDefined()
        expect(result.exitcode).toBeDefined()
        expect(result.exitcode).toBe(0)
        expect(result.stdout).toBeDefined()
        expect(result.stdout).toContain('testenv=testing\n')
        expect(result.stderr).toBeDefined()
        expect(result.stderr).toBe('')

        expect(error).toBeFalsy()
      })
    })

    it('handles and returns an ENOENT error if the command was not found', () => {
      let complete = false
      runs(() => {
        let done = (r, e) => {
          result = r
          error = e
          complete = true
        }

        executor.exec('nonexistentcommand', null, null, done, null)
      })

      waitsFor(() => {
        return complete === true
      })

      runs(() => {
        expect(result).toBeDefined()
        expect(result.exitcode).toBeDefined()
        expect(result.exitcode).not.toBe(0)
        expect(result.exitcode).toBe(127)
        expect(result.stdout).toBeDefined()
        expect(result.stdout).toBe('')
        expect(result.stderr).toBeDefined()
        expect(result.stderr).toBe('')

        expect(error).toBeDefined()
        expect(error).toBeTruthy()
        expect(error.code).toBe('ENOENT')
        expect(error.errno).toBe('ENOENT')
        expect(error.message).toBe('spawn nonexistentcommand ENOENT')
        expect(error.path).toBe('nonexistentcommand')
      })
    })
  })

  describe('when synchronously executing a command', () => {
    it('succeeds', () => {
      let command = 'env'
      if (os.platform() === 'win32') {
        command = path.resolve(__dirname, 'tools', 'env', 'env_windows_amd64.exe')
      }

      let result = executor.execSync(command)
      expect(result.code).toBeDefined()
      expect(result.code).toBe(0)
      expect(result.stdout).toBeDefined()
      expect(result.stdout).not.toBe('')
      expect(result.stderr).toBeDefined()
      expect(result.stderr).toBe('')
      expect(result.error).toBeFalsy()
    })

    it('returns a message if the command was not found', () => {
      let result = executor.execSync('nonexistentcommand')
      expect(result.code).toBeDefined()
      expect(result.code).toBe(127)
      expect(result.stdout).toBeDefined()
      expect(result.stdout).toBe('')
      expect(result.stderr).toBeDefined()
      expect(result.stderr).toBe('')
      expect(result.error).toBeTruthy()
      expect(result.error.code).toBe('ENOENT')
      expect(result.error.errno).toBe('ENOENT')
      expect(result.error.message).toBe('spawnSync nonexistentcommand ENOENT')
      expect(result.error.path).toBe('nonexistentcommand')
    })
  })
})
