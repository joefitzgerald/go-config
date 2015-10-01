'use babel'

function isFalsy (value) {
  if (typeof value === 'undefined') {
    return true
  }
  if (value) {
    return false
  }
  return true
}

function isTruthy (value) {
  return !isFalsy(value)
}

export { isFalsy, isTruthy }
