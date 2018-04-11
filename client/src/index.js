import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

let Component

const init = function (config) {
  Component = ReactDOM.render(<App config={config} />, document.getElementById('gource-root'))
  registerServiceWorker()
}

// ----------------------------------------------
// Public API methods
// ----------------------------------------------

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

export {
  init,
  setDate,
  setSphereView,
  setPlay,
  goToPrev,
  goToNext,
  on,
  getFirstCommit,
  getlastCommit
}
