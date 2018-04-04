import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

const init = function (config) {
  ReactDOM.render(<App config={config} />, document.getElementById('gource-root'))
  registerServiceWorker()
}

export {init}
