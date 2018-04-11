import React, { Component } from 'react'
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import deepAssign from 'deep-assign'
import EventEmitter from 'eventemitter3'

// Post
import { EffectComposer, ShaderPass, RenderPass } from './libs/post/EffectComposer'
import Vignette from './libs/post/Vignette'

import Config from './Config'
import FDG from './libs/FDG'

// CSS
import './App.css'

const mixin = require('mixin')

const moment = require('moment')

const firebase = require('firebase')
require('firebase/firestore')

class App extends mixin(EventEmitter, Component) {
  constructor (props) {
    super(props)

    this.config = deepAssign(Config, this.props.config)

    this.repo = Config.git.repo
    this.repoChanges = Config.git.repo + '_changes'

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
      } else {
        if (Config.git.commitDate) {
          latestTime = moment(Config.git.commitDate).valueOf()
        }
      }
    }

    this.commitsToProcess = []
    this.fetchFullCommit = true
    this.nodes = {}
    this.APICalled = false
    this.currentCommitIndex = 0
    this.loadPrevCommit = false
    this.loadNextCommit = false

    this.state = {
      play: Config.FDG.autoPlay,
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
  }

  /**
   * Set date to load commits from, if date is later
   * than the latest commit date, the latest commit
   * will be loaded
   *
   * @param {string} date
   */
  setDate (dateString) {
    let date = moment(dateString).valueOf()
    this.setState({
      latestTime: date
    })
    if (!this.state.play) {
      this.callAPI()
    } else {
      this.setPlay(false)
      this.callAPI()
    }
  }

  /**
   * Toggle sphere projection mode
   *
   * @param {bool} bool
   */
  setSphereView (bool) {
    Config.FDG.sphereProject = bool
    this.setState({spherize: Config.FDG.sphereProject})
  }

  initFireBase () {
    firebase.initializeApp(Config.fireBase)
    this.firebaseDB = firebase.firestore()
    this.docRef = this.firebaseDB.collection(Config.git.repo)
  }

  componentDidMount () {
    this.callAPI()
    this.initStage()
  }

  initStage () {
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initPost()
    this.initControls()
    this.initFDG()
    this.addEvents()
    this.animate()
  }

  initPost () {
    this.composer = new EffectComposer(this.renderer)
    this.renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(this.renderPass)

    if (Config.post.vignette) {
      this.vignettePass = new ShaderPass(Vignette)
      this.vignettePass.material.uniforms.bgColor.value = new THREE.Color(Config.scene.bgColor)
      this.vignettePass.renderToScreen = true
      this.composer.addPass(this.vignettePass)
    } else {
      this.renderPass.renderToScreen = true
    }
  }

  initControls () {
    this.controls = new this.OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 200
    this.controls.maxDistance = 10000
    this.controls.enablePan = false
    this.controls.autoRotate = Config.scene.autoRotate
    this.controls.autoRotateSpeed = Config.scene.autoRotateSpeed
    this.controls.zoomSpeed = 0.7
    this.controls.rotateSpeed = 0.07
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.04
  }

  initFDG () {
    this.FDG = new FDG(this.renderer, this.scene, this.config)
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.renderFrame()
  }

  renderFrame () {
    if (this.FDG) {
      this.FDG.update()
    }

    this.controls.update()

    this.composer.render()
  }

  addEvents () {
    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()
  }

  initScene () {
    this.scene = new THREE.Scene()
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
      canvas: document.getElementById(Config.scene.canvasID)
    })

    this.composer = new EffectComposer(this.renderer)
  }

  /**
   * Window resize
   */
  resize () {
    if (Config.scene.fullScreen) {
      this.width = window.innerWidth
      this.height = window.innerHeight
    } else {
      this.width = Config.scene.width
      this.height = Config.scene.height
    }

    Config.scene.width = this.width
    Config.scene.height = this.height

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height, false)

    this.composer.setSize(this.width, this.height)

    this.FDG.resize()
  }

  /**
   * Get commit data
   */
  async callAPI () {
    this.APIprocessing = true
    let commits
    let singleCommit = false

    // only get changed data in play mode
    if (!this.fetchFullCommit) {
      this.docRef = this.firebaseDB.collection(Config.git.repo + '_changes')
    }

    this.fetchFullCommit = !this.play

    // load commit by hash
    if (this.loadCommitHash !== '') {
      commits = this.docRef.doc(this.loadCommitHash)
      this.loadCommitHash = ''
      singleCommit = true
    } else if (this.loadPrevCommit) { // load previous commit
      commits = this.docRef.where('index', '==', (this.currentCommitIndex - 1)).limit(1)
      this.loadPrevCommit = false
    } else if (this.loadNextCommit) { // load next commit
      commits = this.docRef.where('index', '==', (this.currentCommitIndex + 1)).limit(1)
      this.loadNextCommit = false
    } else if (Config.git.loadLatest && !this.state.latestTime) {
      commits = this.docRef.orderBy('date', 'desc').limit(1)
      Config.git.loadLatest = false
    } else {
      commits = this.docRef.orderBy('date', 'asc').where('date', '>=', this.state.latestTime).limit(10)
    }

    let snapshot = await commits.get()

    // if no results found for the passed date, load latest commit
    if (snapshot.empty && this.state.latestTime) {
      commits = this.docRef.orderBy('date', 'desc').limit(1)
      snapshot = await commits.get()
    }

    if (snapshot.docs && snapshot.docs.length === 0) {
      setTimeout(() => {
        this.callAPI()
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

    let updateGraph = async function (doc) {
      return new Promise((resolve, reject) => {
        if (!doc.exists) {
          console.log('Error: Commit ' + doc.id + ' does not exist in repo')
          resolve()
        }
        let commit = doc.data()
        commit.sha = doc.id

        if (this.commitsToProcess.indexOf(doc.id) === -1) {
          resolve()
        }

        setTimeout(() => {
          let edges = JSON.parse(commit.edges)

          if (doc.ref.parent.id === this.repo) {
            this.nodes = JSON.parse(commit.nodes)[0]
          } else {
            let nodeChanges = JSON.parse(commit.changes)
            nodeChanges.r.forEach((path) => {
              for (const key in this.nodes) {
                if (this.nodes.hasOwnProperty(key)) {
                  const node = this.nodes[key]
                  if (node.p === path) {
                    delete this.nodes[key]
                  }
                }
              }
            })

            for (const id in this.nodes) {
              if (this.nodes.hasOwnProperty(id)) {
                if (nodeChanges.c.indexOf(this.nodes[id].p) !== -1) {
                  this.nodes[id].u = 1.0
                } else {
                  delete this.nodes[id].u
                }
              }
            }

            this.nodes = Object.keys(this.nodes).map(function (key) {
              return this.nodes[key]
            })

            for (const key in nodeChanges.a) {
              if (nodeChanges.a.hasOwnProperty(key)) {
                const node = nodeChanges.a[key]
                node.u = 1.0
                this.nodes[key] = node
              }
            }
          }

          let changedState = {}
          let changes = JSON.parse(commit.changes)
          changedState.latestTime = commit.date + 1
          changedState.currentDate = moment.unix(commit.date / 1000).format('MM/DD/YYYY HH:mm:ss')
          changedState.currentCommitHash = commit.sha
          changedState.currentAuthor = commit.author + ' <' + commit.email + '>'
          changedState.currentMsg = commit.msg
          changedState.currentAdded = isNaN(changes.a) ? Object.keys(changes.a).length : changes.a
          changedState.currentChanged = isNaN(changes.c) ? changes.c.length : changes.c
          changedState.currentRemoved = isNaN(changes.r) ? changes.r.length : changes.r
          this.currentCommitIndex = commit.index

          this.setState(changedState)

          this.emit('commitChanged', {
            removed: changedState.currentRemoved,
            changed: changedState.currentChanged,
            added: changedState.currentAdded,
            msg: changedState.currentMsg,
            author: changedState.currentAuthor,
            hash: changedState.currentCommitHash,
            date: changedState.currentDate,
            index: commit.index
          })

          if (this.FDG) {
            if (this.FDG.firstRun) {
              this.FDG.init({
                nodeData: this.nodes,
                edgeData: edges,
                nodeCount: Config.FDG.nodeCount
              })
              this.FDG.setFirstRun(false)
            } else {
              this.FDG.refresh()
              this.FDG.init({
                nodeData: this.nodes,
                edgeData: edges,
                nodeCount: Config.FDG.nodeCount
              })
            }
          }

          if (this.state.play) {
            resolve()
          } else {
            this.APIprocessing = false
          }
        }, this.delayAmount)
      })
    }

    const addCommits = async () => {
      await asyncForEach(snapshots, async (snapshot) => {
        await updateGraph.call(this, snapshot)
      })
      this.APIprocessing = false
      this.callAPI()
    }
    addCommits()
  }

  toggleSpherize () {
    Config.FDG.sphereProject = !this.state.spherize
    this.setState({spherize: Config.FDG.sphereProject})
  }

  setPlay (bool) {
    let play = bool
    this.setState({play: play})

    if (!play) {
      this.APIprocessing = false
      this.commitsToProcess = []
    }

    if (play && !this.APIprocessing) {
      this.callAPI()
    }
  }

  togglePlay () {
    let play = !this.state.play
    this.setState({play: play})

    if (!play) {
      this.APIprocessing = false
      this.commitsToProcess = []
    }

    if (play && !this.APIprocessing) {
      this.callAPI()
    }
  }

  loadCommit () {
    let commit = this.commitInput.value.trim()
    if (commit) {
      this.loadCommitHash = commit
      this.commitsToProcess = [commit]
      this.setState({play: false})
      this.callAPI()
    }
  }

  goToPrev () {
    this.loadPrevCommit = true
    this.commitsToProcess = []
    this.setState({play: false})
    this.callAPI()
  }

  goToNext () {
    this.loadNextCommit = true
    this.commitsToProcess = []
    this.setState({play: false})
    this.callAPI()
  }

  async getFirstCommit () {
    let ref = this.firebaseDB.collection(this.repoChanges)
    let commits = ref.orderBy('date', 'asc').limit(1)
    let snapshot = await commits.get()
    return snapshot.docs[0].data()
  }

  async getlastCommit () {
    let ref = this.firebaseDB.collection(this.repoChanges)
    let commits = ref.orderBy('date', 'desc').limit(1)
    let snapshot = await commits.get()
    return snapshot.docs[0].data()
  }

  UI () {
    if (!Config.display.showUI) {
      return
    }
    if (Config.display.customUI) {

    } else {
      return (
        <div className='gource-ui'>
          <div className='info'>
            <div className='currentAdded'><span>Files Added:</span> <b>{this.state.currentAdded}</b></div>
            <div className='currentChanged'><span>Files Changed:</span> <b>{this.state.currentChanged}</b></div>
            <div className='currentRemoved'><span>Files Removed:</span> <b>{this.state.currentRemoved}</b></div>
            <div className='currentAuthor'><span>Author:</span> <b>{this.state.currentAuthor}</b></div>
            <div className='currentMsg'><span>Message:</span> <b>{this.state.currentMsg}</b></div>
            <div className='currentDate'><span>Commit Date:</span> <b>{this.state.currentDate}</b></div>
            <div className='currentCommitHash'><span>Commit Hash:</span> <b>{this.state.currentCommitHash}</b></div>
          </div>
          <div className='gource-controls'>
            <button className='previousCommit' onClick={this.goToPrev.bind(this)}>&lt; Prev</button>
            <button className='nextCommit' onClick={this.goToNext.bind(this)}>Next &gt;</button>
            <label>
              Play:
              <input
                name='play'
                type='checkbox'
                checked={this.state.play}
                onChange={this.togglePlay.bind(this)} />
            </label>
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
            <label>
              Sphere Projection:
              <input
                name='spherize'
                type='checkbox'
                checked={this.state.spherize}
                onChange={this.toggleSpherize.bind(this)} />
            </label>
          </div>
        </div>
      )
    }
  }

  render () {
    return (
      <div className='App'>
        {this.UI()}
        <canvas width={Config.scene.width} height={Config.scene.height} id={Config.scene.canvasID} />
      </div>
    )
  }
}

export default App
