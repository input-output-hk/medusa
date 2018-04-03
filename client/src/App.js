import React, { Component } from 'react'
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from './Config'
import FDG from './libs/FDG'

// CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

const moment = require('moment')

const firebase = require('firebase')
require('firebase/firestore')

class App extends Component {
  constructor () {
    super()

    this.initFireBase()
    this.OrbitControls = OrbitContructor(THREE)

    this.FDG = null // Force Directed Graph class
    this.delayAmount = Config.FDG.delayAmount // how long to wait between graph updates

    let latestTime = 0

    if (typeof URLSearchParams !== 'undefined') {
      // get date from URL
      let urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('date')) {
        latestTime = moment(urlParams.get('date')).valueOf()
      }
    }

    this.commitsToProcess = []

    this.state = {
      play: false,
      currentDate: null,
      currentCommitHash: '',
      spherize: Config.FDG.sphereProject,
      currentAuthor: null,
      currentMsg: null,
      currentAdded: null,
      currentChanged: null,
      currentRemoved: null,
      latestTime: latestTime
    }

    this.loadCommitHash = Config.git.commitHash

    this.docRef = this.firebaseDB.collection(Config.git.repo)
  }

  initFireBase () {
    firebase.initializeApp(Config.fireBase)
    this.firebaseDB = firebase.firestore()
  }

  componentDidMount () {
    this.callApi()
    this.initStage()
  }

  initStage () {
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initControls()
    this.initFDG()
    this.addEvents()
    this.animate()
  }

  initControls () {
    // controls
    this.controls = new this.OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 1000000
  }

  initFDG () {
    this.FDG = new FDG(this.renderer, this.scene)
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.renderFrame()
  }

  renderFrame () {
    if (this.FDG) {
      this.FDG.update()
    }

    this.renderer.render(this.scene, this.camera)
  }

  addEvents () {
    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()
  }

  initScene () {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, Config.scene.fogDensity)
    this.scene.background = new THREE.Color(Config.scene.bgColor)
  }

  /**
   * Set up stage camera with defaults
   */
  initCamera () {
    // initial position of camera in the scene
    this.defaultCameraPos = Config.camera.initPos
    // xy bounds of the ambient camera movement
    this.cameraDriftLimitMax = {
      x: 100.0,
      y: 100.0
    }
    this.cameraDriftLimitMin = {
      x: -100.0,
      y: -100.0
    }

    this.cameraMoveStep = 200.0 // how much to move the camera forward on z-axis
    this.cameraLerpSpeed = 0.05 // speed of camera lerp

    // scene camera
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, window.innerWidth / window.innerHeight, 0.1, 2000000)
    this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z)
    this.camera.updateMatrixWorld()

    this.cameraPos = this.camera.position.clone() // current camera position
    this.targetCameraPos = this.cameraPos.clone() // target camera position

    this.cameraLookAtPos = new THREE.Vector3(0, 0, 0) // current camera lookat
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0) // target camera lookat
    this.camera.lookAt(this.cameraLookAtPos)

    // set initial camera rotations
    this.cameraFromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion)
    let cameraToRotation = new THREE.Euler().copy(this.camera.rotation)
    this.cameraToQuaternion = new THREE.Quaternion().setFromEuler(cameraToRotation)
    this.cameraMoveQuaternion = new THREE.Quaternion()
  }

  /**
   * Set up default stage renderer
   */
  initRenderer () {
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: document.getElementById('stage'),
      autoClear: true
      // precision: 'mediump'
    })
  }

  /**
   * Window resize
   */
  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height, false)
  }

  /**
   * Get commit data
   */
  async callApi () {
    let commits
    let singleCommit = false
    if (this.loadCommitHash !== null) {
      commits = this.docRef.doc(this.loadCommitHash)
      this.loadCommitHash = null
      singleCommit = true
    } else {
      commits = this.docRef.orderBy('date', 'asc').where('date', '>=', this.state.latestTime).limit(10)
    }

    const snapshot = await commits.get()

    if (snapshot.docs && snapshot.docs.length === 0) {
      setTimeout(() => {
        this.callApi()
      }, 5000)
      return
    }

    let snapshots = []
    this.commitsToProcess = []

    if (singleCommit) {
      snapshots.push(snapshot)
      this.commitsToProcess.push(snapshot.id)
    } else {
      snapshot.forEach(snapshot => {
        snapshots.push(snapshot)
        this.commitsToProcess.push(snapshot.id)
      })
    }

    async function asyncForEach (array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
      }
    }

    let that = this

    let updateGraph = async function (doc) {
      return new Promise((resolve, reject) => {
        let commit = doc.data()
        commit.sha = doc.id

        if (that.commitsToProcess.indexOf(doc.id) === -1) {
          resolve()
        }

        setTimeout(() => {
          let edges = JSON.parse(commit.edges)
          let nodes = JSON.parse(commit.nodes)[0]

          let nodeCount = commit.count

          let changedState = {}
          let changes = JSON.parse(commit.changes)
          changedState.latestTime = commit.date + 1
          changedState.currentDate = moment.unix(commit.date / 1000).format('MM/DD/YYYY HH:mm:ss')
          changedState.currentCommitHash = commit.sha
          changedState.currentAuthor = commit.author + ' <' + commit.email + '>'
          changedState.currentMsg = commit.msg
          changedState.currentAdded = changes.a
          changedState.currentChanged = changes.c
          changedState.currentRemoved = changes.r
          that.setState(changedState)

          if (that.FDG) {
            if (that.FDG.firstRun) {
              that.FDG.init({
                nodeData: nodes,
                edgeData: edges,
                nodeCount: nodeCount + 1
              })
              that.FDG.setFirstRun(false)
            } else {
              that.FDG.refresh()
              that.FDG.init({
                nodeData: nodes,
                edgeData: edges,
                nodeCount: nodeCount + 1
              })
            }
          }

          if (that.state.play) {
            resolve()
          }
        }, that.delayAmount)
      })
    }

    const addCommits = async () => {
      await asyncForEach(snapshots, async (snapshot) => {
        await updateGraph(snapshot)
      })
      this.callApi()
    }
    addCommits()
  }

  toggleSpherize () {
    Config.FDG.sphereProject = !this.state.spherize
    this.setState({spherize: Config.FDG.sphereProject})
  }

  togglePlay () {
    let play = !this.state.play
    this.setState({play: play})

    if (play) {
      this.callApi()
    }
  }

  loadCommit () {
    let commit = this.commitInput.value.trim()
    if (commit) {
      this.loadCommitHash = commit
      this.commitsToProcess = [commit]
      this.setState({play: false})
      this.callApi()
    }
  }

  render () {
    return (
      <div className='App'>
        <div className='info'>
          <div className='currentAdded'>Files Added: {this.state.currentAdded}</div>
          <div className='currentChanged'>Files Changed: {this.state.currentChanged}</div>
          <div className='currentRemoved'>Files Removed: {this.state.currentRemoved}</div>
          <div className='currentAuthor'>Author: {this.state.currentAuthor}</div>
          <div className='currentMsg'>Message: {this.state.currentMsg}</div>
          <div className='currentDate'>Commit Date: {this.state.currentDate}</div>
          <div className='currentCommitHash'>Commit Hash: {this.state.currentCommitHash}</div>
          <label>
            Play:
            <input
              name='play'
              type='checkbox'
              checked={this.state.play}
              onChange={this.togglePlay.bind(this)} />
          </label>
          <br />
          <label>
            Commit:
            <input
              ref={input => {
                this.commitInput = input
              }}
              name='commitInput'
              type='text' />
            <button onClick={this.loadCommit.bind(this)}>Go</button>
          </label>
          <br />
          <label>
            Sphere Projection:
            <input
              name='spherize'
              type='checkbox'
              checked={this.state.spherize}
              onChange={this.toggleSpherize.bind(this)} />
          </label>
        </div>
        <canvas id='stage' />
      </div>
    )
  }
}

export default App
