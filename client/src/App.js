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

    // get date from URL
    let urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('date')) {
      latestTime = moment(urlParams.get('date')).valueOf()
    }

    this.state = {
      play: false,
      currentDate: null,
      currentCommitHash: null,
      latestTime: latestTime
    }

    console.log(this.state)
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
    this.controls.maxDistance = 1350000
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
    this.defaultCameraPos = new THREE.Vector3(0.0, 0.0, 1000.0)
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
    let docRef = this.firebaseDB.collection(Config.git.repo)
    let commits = docRef.orderBy('commitDate', 'asc').where('commitDate', '>=', this.state.latestTime).limit(100)

    const snapshot = await commits.get()

    let commitData = []
    snapshot.forEach((doc) => {
      let docData = doc.data()
      docData.sha = doc.id
      commitData.push(docData)
    })

    let lastCommit = commitData[commitData.length - 1]

    let delay = this.delayAmount

    commitData.forEach((commit) => {
      let edges = JSON.parse(commit.edges)
      let nodes = JSON.parse(commit.nodes)[0]

      let nodeCount = commit.nodeCounter

      let sortedNodes = []
      for (const key in nodes) {
        if (nodes.hasOwnProperty(key)) {
          const node = nodes[key]
          sortedNodes[node.id] = {
            id: node.id,
            type: node.type,
            filePath: node.filePath,
            updated: node.updated
            // parentId: node.parentId
          }
        }
      }

      setTimeout(function () {
        let changedState = {}
        changedState.latestTime = commit.commitDate + 1
        changedState.currentDate = moment.unix(commit.commitDate / 1000).format('MM/DD/YYYY HH:mm:ss')
        changedState.currentCommitHash = commit.sha
        this.setState(changedState)

        if (this.FDG) {
          if (this.FDG.firstRun) {
            this.FDG.init({
              nodeData: sortedNodes,
              edgeData: edges,
              nodeCount: nodeCount + 1
            })
            this.FDG.setFirstRun(false)
          } else {
            this.FDG.refresh()
            this.FDG.init({
              nodeData: sortedNodes,
              edgeData: edges,
              nodeCount: nodeCount + 1
            })
          }
        }


        // call api again once we've reached last commit in this batch
        if (lastCommit.commitDate === commit.commitDate) {
          this.callApi()
        }
      }.bind(this), delay)
      delay += this.delayAmount
    })
  }

  render () {
    return (
      <div className='App'>
        <div className='controls'>
          <button className='play' onClick={() => { this.setState({play: true}) }}>Play</button>
          <button className='play' onClick={() => { this.setState({play: false}) }}>Pause</button>
        </div>
        <div className='info'>
          <div className='currentDate'>Commit Date: {this.state.currentDate}</div>
          <div className='currentCommitHash'>Commit Hash: {this.state.currentCommitHash}</div>
        </div>
        <canvas id='stage' />
      </div>
    )
  }
}

export default App
