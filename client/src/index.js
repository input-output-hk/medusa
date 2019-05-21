import React from 'react'
import ReactDOM from 'react-dom'
//import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

let Component
let Container

const init = function (config) {
  Container = document.getElementById('medusa-root')
  Component = ReactDOM.render(<App config={config} />, Container)
  registerServiceWorker()
  return this
}

/**
 * Check if medusa can run
 */
const canRun = function () {
  if (!window.WebGLRenderingContext) {
    console.log('Your browser does not support WebGL')
    return false
  }

  let glContext = document.createElement('canvas').getContext('webgl')
  if (glContext === null) {
    glContext = document.createElement('canvas').getContext('experimental-webgl')
  }

  if (glContext === null) {
    console.log('Your browser does not support WebGL')
    return false
  }

  const gl = glContext.getSupportedExtensions()

  if (gl.indexOf('ANGLE_instanced_arrays') === -1) {
    console.log('ANGLE_instanced_arrays support is required to run this app')
    return false
  }

  if (gl.indexOf('OES_texture_float') === -1) {
    console.log('OES_texture_float support is required to run this app')
    return false
  }

  if (gl.indexOf('OES_texture_float_linear') === -1) {
    console.log('OES_texture_float support is required to run this app')
    return false
  }

  if (gl.indexOf('OES_texture_half_float') === -1) {
    console.log('OES_texture_float support is required to run this app')
    return false
  }

  if (gl.indexOf('OES_texture_half_float_linear') === -1) {
    console.log('OES_texture_float support is required to run this app')
    return false
  }

  return true
}

// ----------------------------------------------
// Public API methods
// ----------------------------------------------

/**
 * Load a commit from commit hash
 *
 * @param {string} hash
 */
const loadCommit = function (hash) {
  if (!Component) {
    return
  }
  Component.loadCommit(hash)
}

/**
 * Set date to load commits from, if date is later
 * than the latest commit date, the latest commit
 * will be loaded
 *
 * @param {string} date
 */
const setDate = function (date) {
  if (!Component) {
    return
  }
  Component.setDate(date)
}

/**
 * Toggle sphere projection mode
 *
 * @param {bool} bool
 */
const setSphereView = function (bool) {
  if (!Component) {
    return
  }
  Component.setSphereView(bool)
}

/**
 * Toggle play mode
 *
 * @param {bool} bool
 */
const setPlay = function (bool) {
  if (!Component) {
    return
  }
  Component.setPlay(bool)
}

/**
 * Previous commit
 */
const goToPrev = function () {
  if (!Component) {
    return
  }
  Component.goToPrev()
}

/**
 * Next commit
 */
const goToNext = function () {
  if (!Component) {
    return
  }
  Component.goToNext()
}

/**
 * Event emitter
 *
 * @param {string} event
 * @param {function} fn
 */
const on = function (event, fn) {
  if (!Component) {
    return
  }
  return Component.on(event, fn)
}

/**
 * Get first commit in data store
 */
const getFirstCommit = async function () {
  if (!Component) {
    return
  }
  return Component.getFirstCommit()
}

/**
 * Get last commit in data store
 */
const getlastCommit = async function () {
  if (!Component) {
    return
  }
  return Component.getlastCommit()
}

/**
 * Dynamically update a config setting
 *
 * @param {object} config
 */
const setConfig = async function (config) {
  if (!Component) {
    return
  }
  return Component.setConfig(config)
}

/**
 * Destroy application instance
 */
const destroy = async function (config) {
  if (!Component) {
    return
  }
  Component.destroy()
  ReactDOM.unmountComponentAtNode(Container)
  Component = null
  Container = null
}

export {
  init,
  canRun,
  setDate,
  setSphereView,
  setPlay,
  goToPrev,
  goToNext,
  on,
  getFirstCommit,
  getlastCommit,
  setConfig,
  destroy,
  loadCommit
}
