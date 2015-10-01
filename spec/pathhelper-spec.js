'use babel'

import {PathHelper} from './../lib/pathhelper'
import os from 'os'
import path from 'path'

describe('pathhelper', () => {
  let pathhelper = null

  beforeEach(() => {
    runs(() => {
      pathhelper = new PathHelper()
    })
  })

  describe('when working with a single-item path', () => {
    it('expands the path', () => {
      let result = pathhelper.expand(process.env, path.join('~', 'go', 'go', '..', 'bin', 'goimports'), '~/go')
      expect(result).toBeDefined()
      expect(result).toBeTruthy()
      expect(result).toBe(path.join(pathhelper.home(), 'go', 'bin', 'goimports'))

      result = pathhelper.expand(process.env, path.join('$GOPATH', 'go', '..', 'bin', 'goimports'), '~/go')
      expect(result).toBeDefined()
      expect(result).toBeTruthy()
      expect(result).toBe(path.join(pathhelper.home(), 'go', 'bin', 'goimports'))

      let root = path.sep
      if (os.platform() === 'win32') {
        root = 'c:' + path.sep
      }
      result = pathhelper.expand(process.env, path.join(root, '$NONEXISTENT', 'go', '..', 'bin', 'goimports'), '~/go')
      expect(result).toBeDefined()
      expect(result).toBeTruthy()
      expect(result).toBe(path.join(root, '$NONEXISTENT', 'bin', 'goimports'))
    })
  })

  describe('when working with a multi-item path', () => {
    it('expands the path', () => {
      let result = pathhelper.expand(process.env, path.join('~', 'go', 'go', '..', 'bin', 'goimports'), '~/go' + path.delimiter + '~/othergo')
      expect(result).toBeDefined()
      expect(result).toBeTruthy()
      expect(result).toBe(path.join(pathhelper.home(), 'go', 'bin', 'goimports'))

      result = pathhelper.expand(process.env, path.join('$GOPATH', 'go', '..', 'bin', 'goimports'), '~/go' + path.delimiter + '~/othergo')
      expect(result).toBeDefined()
      expect(result).toBeTruthy()
      expect(result).toBe(path.join(pathhelper.home(), 'go', 'bin', 'goimports'))
    })
  })
})
