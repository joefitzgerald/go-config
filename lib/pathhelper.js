'use babel'

import path from 'path'
import os from 'os'
import osHomedir from 'os-homedir'
import {isFalsy} from './check'

class PathHelper {
  constructor () {
  }

  expand (env, thepath) {
    if (isFalsy(thepath) || thepath.trim() === '') {
      return ''
    }

    if (isFalsy(env)) {
      return thepath
    }

    thepath = thepath.replace(/(~|\$[^\\/:]*|%[^\\;%]*%)+?/gim, (text, match) => {
      if (match === '~') {
        return this.home()
      } else {
        let m = match
        if (os.platform() === 'win32') {
          m = match.replace('%', '')
        } else {
          m = match.replace('\$', '')
        }
        if (typeof env[m] !== 'undefined') {
          return env[m]
        } else {
          return match
        }
      }
    })

    if (thepath.indexOf(path.delimiter) === -1) {
      return this.resolveAndNormalize(thepath)
    }

    let paths = thepath.split(path.delimiter)
    let result = ''
    for (let pathItem of paths) {
      pathItem = this.resolveAndNormalize(pathItem)
      if (result === '') {
        result = pathItem
      } else {
        result = result + path.delimiter + pathItem
      }
    }

    return result
  }

  resolveAndNormalize (pathitem) {
    if (isFalsy(pathitem) || pathitem.trim() === '') {
      return ''
    }
    let result = path.resolve(path.normalize(pathitem))
    return result
  }

  home () {
    return osHomedir()
  }
}
export {PathHelper}
