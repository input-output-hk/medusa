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
import MD5 from './libs/MD5'

// CSS
import './App.css'

const mixin = require('mixin')

const moment = require('moment')

const firebase = require('firebase/app')
require('firebase/firestore')
require('firebase/auth')

class App extends mixin(EventEmitter, Component) {
  constructor (props) {
    super(props)

    this.running = true

    this.config = deepAssign(Config, this.props.config)

    this.repo = this.config.git.repo
    this.repoChanges = this.config.git.repo + '_changes'

    this.initFireBase()

    this.currentFrame = 0
    this.prevAPICallFrame = 0

    this.OrbitControls = OrbitContructor(THREE)

    this.FDG = null // Force Directed Graph class
    this.delayAmount = this.config.FDG.delayAmount // how long to wait between graph updates

    this.userInteracting = true

    let latestTime = 0
    if (typeof URLSearchParams !== 'undefined') {
      // get date from URL
      let urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('date')) {
        latestTime = moment(urlParams.get('date')).valueOf()
      } else {
        if (this.config.git.commitDate) {
          latestTime = moment(this.config.git.commitDate).valueOf()
        }
      }
    }

    this.commitsToProcess = []
    this.nodes = {}
    this.loadPrevCommit = false
    this.loadNextCommit = false

    this.state = {
      play: this.config.FDG.autoPlay,
      currentDate: null,
      currentCommitHash: '',
      spherize: this.config.FDG.sphereProject,
      currentAuthor: null,
      currentMsg: null,
      currentAdded: null,
      currentChanged: null,
      currentRemoved: null,
      latestTime: latestTime,
      currentCommitIndex: -1,
      sideBarCommits: [],
      sidebarCurrentCommitIndex: -1
    }

    this.loadCommitHash = this.config.git.commitHash
  }

  /**
   * Slow down a potential DDOS attack by requiring the user to be signed in anonymously
   */
  anonymousSignin () {
    firebase.auth().signInAnonymously().catch(function (error) {
      console.log(error.code)
      console.log(error.message)
    })
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
    this.config.FDG.sphereProject = bool
    this.setState({spherize: this.config.FDG.sphereProject})
  }

  async initFireBase () {
    try {
      firebase.initializeApp(this.config.fireBase)

      const settings = {timestampsInSnapshots: true}
      firebase.firestore().settings(settings)

      await firebase.firestore().enablePersistence()
    } catch (error) {
      console.log(error)
    }

    this.firebaseDB = firebase.firestore()

    this.docRef = this.firebaseDB.collection(this.config.git.repo)
    this.docRefChanges = this.firebaseDB.collection(this.config.git.repo + '_changes')

    this.anonymousSignin()

    this.callAPI()

    // send ready event
    this.emit('ready')
  }

  componentDidMount () {
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

    this.setPostSettings()
  }

  setPostSettings () {
    if (this.config.post.vignette) {
      if (this.vignettePass) {
        this.vignettePass.enabled = true
        this.renderPass.renderToScreen = false
      } else {
        this.vignettePass = new ShaderPass(Vignette)
        this.vignettePass.material.uniforms.bgColor.value = new THREE.Color(this.config.scene.bgColor)
        this.vignettePass.renderToScreen = true
        this.composer.addPass(this.vignettePass)
      }
    } else {
      if (this.vignettePass) {
        this.vignettePass.enabled = false
      }
      this.renderPass.renderToScreen = true
    }
  }

  initControls () {
    this.controls = new this.OrbitControls(this.camera, this.renderer.domElement)
    this.setControlsSettings()
  }

  setControlsSettings () {
    this.controls.minDistance = 200
    this.controls.maxDistance = 10000
    this.controls.enablePan = false
    this.controls.enableZoom = this.config.camera.enableZoom
    this.controls.zoomSpeed = 0.7
    this.controls.rotateSpeed = 0.07
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.04
  }

  initFDG () {
    this.FDG = new FDG(
      this.renderer,
      this.scene,
      this.config,
      this.camera
    )
  }

  animate () {
    window.requestAnimationFrame(this.animate.bind(this))
    this.renderFrame()
  }

  renderFrame () {
    if (!this.running) {
      window.cancelAnimationFrame(this.animate)
      return
    }

    this.currentFrame++

    if (this.FDG) {
      this.FDG.update()
    }

    if (this.config.scene.autoRotate) {
      this.scene.rotation.y += this.config.scene.autoRotateSpeed
    }

    this.cameraFollowTarget()

    this.controls.update()

    this.composer.render()
  }

  addEvents () {
    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    const canvas = document.querySelector('#' + this.config.scene.canvasID)

    const timeout = function () {
      this.userInteracting = true
      clearTimeout(this.interactionTimeout)
      this.interactionTimeout = setTimeout(() => {
        this.userInteracting = false
        const camPos = this.camera.getWorldPosition(new THREE.Vector3())
        this.cameraPos.x = camPos.x
        this.cameraPos.y = camPos.y
        this.cameraPos.z = camPos.z
        this.targetCameraPos.x = camPos.x
        this.targetCameraPos.y = camPos.y
        this.targetCameraPos.z = camPos.z
      }, 3000)
    }

    canvas.addEventListener('touchstart', (e) => {
      timeout.call(this)
    })

    canvas.addEventListener('mousedown', (e) => {
      timeout.call(this)
    })

    canvas.addEventListener('wheel', (e) => {
      timeout.call(this)
    })

    canvas.addEventListener('mousewheel', (e) => {
      timeout.call(this)
    })
  }

  initScene () {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(this.config.scene.bgColor)
  }

  /**
   * Set up camera with defaults
   */
  initCamera () {
    this.camera = new THREE.PerspectiveCamera(this.config.camera.fov, window.innerWidth / window.innerHeight, 0.1, 2000000)
    this.camera.position.x = this.config.camera.initPos.x
    this.camera.position.y = this.config.camera.initPos.y
    this.camera.position.z = this.config.camera.initPos.z

    // speed of lerp
    this.cameraLerpSpeed = 0.03

    // set target positions
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

    this.camera.updateMatrixWorld()
    this.setCameraSettings()
  }

  setCameraSettings () {
    this.camera.fov = this.config.camera.fov
    this.camera.updateMatrixWorld()
  }

  /**
   * Move camera to target position
   */
  cameraFollowTarget () {
    this.camera.lookAt(this.cameraLookAtPos)
    if (!this.userInteracting) {
      // lerp camera position to target
      this.cameraPos.lerp(this.targetCameraPos, this.cameraLerpSpeed)
      this.camera.position.copy(this.cameraPos)

      // constantly look at target
      this.cameraLookAtPos.lerp(this.targetCameraLookAt, this.cameraLerpSpeed)
    }
  }

  /**
   * Set up default stage renderer
   */
  initRenderer () {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.scene.antialias,
      canvas: document.getElementById(this.config.scene.canvasID)
    })

    this.composer = new EffectComposer(this.renderer)
  }

  /**
   * Window resize
   */
  resize () {
    if (this.config.scene.fullScreen) {
      this.width = window.innerWidth
      this.height = window.innerHeight
    } else {
      this.width = this.config.scene.width
      this.height = this.config.scene.height
    }

    this.config.scene.width = this.width
    this.config.scene.height = this.height

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
    // only call this method if tab in focus
    let animID = this.callAPI
    if (this.currentFrame === this.prevAPICallFrame) {
      window.requestAnimationFrame(animID.bind(this))
      return
    } else {
      window.cancelAnimationFrame(animID)
    }

    this.prevAPICallFrame = this.currentFrame

    this.APIprocessing = true
    let commits

    // only get changed data in play mode
    if (this.state.play) {
      // this.docRef = this.firebaseDB.collection(this.config.git.repo + '_changes')
      // console.log('changes')
    }
    this.commitsToProcess = []

    this.direction = ''

    // load commit by hash
    if (this.loadCommitHash !== '') {
      commits = this.docRef.doc(this.loadCommitHash)
    } else if (this.loadPrevCommit) { // load previous commit
      commits = this.docRef.where('index', '==', this.state.currentCommitIndex - 1).limit(1)
      this.direction = 'prev'
    } else if (this.loadNextCommit) { // load next commit
      commits = this.docRef.where('index', '==', this.state.currentCommitIndex + 1).limit(1)
      this.direction = 'next'
    } else if (this.config.git.loadLatest && !this.state.latestTime) {
      commits = this.docRef.orderBy('index', 'desc').limit(1)
    } else if (this.state.latestTime) {
      commits = this.docRef.where('date', '>=', this.state.latestTime).limit(1)
    } else {
      commits = this.docRef.where('index', '==', this.state.currentCommitIndex + 1).limit(1)
      this.direction = 'next'
    }

    // reset flags
    this.loadCommitHash = ''
    this.loadPrevCommit = false
    this.loadNextCommit = false
    this.config.git.loadLatest = false

    // collect snapshots
    let snapshots = []

    commits.onSnapshot(async function (querySnapshot) {
      // no results found for this index, check for next/prev index in db
      if (querySnapshot.size === 0) {
        let commits = null
        if (this.direction === 'prev') {
          commits = this.docRef.where('index', '<', this.state.currentCommitIndex).orderBy('index', 'desc').limit(1)
        } else {
          commits = this.docRef.where('index', '>', this.state.currentCommitIndex).orderBy('index', 'asc').limit(1)
        }
        let snapshot = await commits.get()
        if (snapshot.size !== 0) {
          let commit = snapshot.docs[0].data()
          if (this.direction === 'prev') {
            this.setState({currentCommitIndex: commit.index + 1})
            this.loadPrevCommit = true
          } else {
            this.setState({currentCommitIndex: commit.index - 1})
            this.loadNextCommit = true
          }
          this.callAPI()
        }

        return
      }

      if (typeof querySnapshot.docs !== 'undefined') {
        querySnapshot.forEach(snapshot => {
          snapshots.push(snapshot)
          this.commitsToProcess.push(snapshot.id)
        })
      } else {
        snapshots.push(querySnapshot)
        this.commitsToProcess.push(querySnapshot.id)
      }

      // if no results found for the passed date, load latest commit
      if (this.state.latestTime && snapshots.length === 0) {
        commits = this.docRef.orderBy('index', 'desc').limit(1)
        let snapshot = await commits.get()
        snapshots.push(snapshot)
      // if no newer results, check again in a minute
      } else if (snapshots.length === 0) {
        setTimeout(() => {
          if (this.state.play) {
            this.callAPI()
          }
        }, 60000)
        return
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
              }.bind(this))

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
            changedState.latestTime = 0
            changedState.currentDate = moment.unix(commit.date / 1000).format('MM/DD/YYYY HH:mm:ss')
            changedState.currentCommitHash = commit.sha
            changedState.currentAuthor = commit.author + ' <' + commit.email + '>'
            changedState.currentMsg = commit.msg
            changedState.currentAdded = isNaN(changes.a) ? Object.keys(changes.a).length : changes.a
            changedState.currentChanged = isNaN(changes.c) ? changes.c.length : changes.c
            changedState.currentRemoved = isNaN(changes.r) ? changes.r.length : changes.r
            changedState.currentCommitIndex = commit.index

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

            this.cameraAccommodateNodes()

            if (this.FDG) {
              if (this.FDG.firstRun) {
                this.FDG.init({
                  nodeData: this.nodes,
                  edgeData: edges,
                  nodeCount: this.config.FDG.nodeCount
                })
                this.FDG.setFirstRun(false)
              } else {
                this.FDG.refresh()
                this.FDG.init({
                  nodeData: this.nodes,
                  edgeData: edges,
                  nodeCount: this.config.FDG.nodeCount
                })
              }
            }

            this.populateSideBar(changedState.currentCommitIndex)

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
    }.bind(this), function (error) {
      console.log(error)
    })
  }

  /**
   * Roughly keep all nodes visible to camera
   */
  cameraAccommodateNodes () {
    // get vector to center
    let toCentre = this.camera.getWorldPosition(new THREE.Vector3()).normalize()

    const nodeCount = Object.keys(this.nodes).length

    // y = ax^2 + bx + c
    let dist = (0.0001 * (Math.pow(nodeCount, 2))) + (1 * (nodeCount)) + this.config.camera.initPos.z
    if (this.state.spherize) {
      if (this.config.scene.width > this.config.scene.height) {
        dist = this.config.FDG.sphereRadius + 1200.0
      } else {
        dist = this.config.FDG.sphereRadius + 1600.0
      }
    }
    let newPos = toCentre.multiplyScalar(dist)
    this.targetCameraPos.x = newPos.x
    this.targetCameraPos.y = newPos.y
    this.targetCameraPos.z = newPos.z
  }

  /**
   * Get a link to a gravatar image
   * @param {string} email
   * @param {int} size
   */
  getGravatar (email, size) {
    return 'https://secure.gravatar.com/avatar/' + MD5(email) + '.jpg?s=' + size
  }

  async populateSideBar (currentCommitIndex) {
    if (!this.config.display.showSidebar) {
      return
    }
    let commits

    if (currentCommitIndex < 4) {
      commits = this.docRef.orderBy('index', 'asc').where('index', '>=', currentCommitIndex - 2).limit(this.config.display.sidebarCommitLimit)
    } else {
      commits = this.docRef.orderBy('index', 'desc').where('index', '<=', currentCommitIndex + 2).limit(this.config.display.sidebarCommitLimit)
    }

    commits.onSnapshot(function (querySnapshot) {
      let sideBarCommits = []
      querySnapshot.forEach(snapshot => {
        let data = snapshot.data()
        data.dateLong = moment(data.date).format('dddd, MMMM Do YYYY, h:mm:ss a')
        data.dateShort = moment(data.date).format('MMM Do')
        data.sha = snapshot.id
        data.gravatar = this.getGravatar(data.email, 40)
        sideBarCommits.push(data)
      })

      sideBarCommits.sort((a, b) => {
        return b.date - a.date
      })

      // due to enablePersistance(), onSnapshot() will immediately return the results we have locally from IndexedDB,
      // we need to wait until we have the complete set from firebase
      if (sideBarCommits.length !== this.config.display.sidebarCommitLimit) {
        return
      }

      this.setState({
        sideBarCommits: sideBarCommits,
        sidebarCurrentCommitIndex: currentCommitIndex
      })
    }.bind(this), function (error) {
      console.log(error)
    })
  }

  toggleSpherize () {
    this.config.FDG.sphereProject = !this.state.spherize
    this.setState({spherize: this.config.FDG.sphereProject})
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

  loadCommit (hash = '') {
    if (hash) {
      this.loadCommitHash = hash
      this.commitsToProcess = [hash]
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

  setConfig (newConfig) {
    this.config = deepAssign(this.config, newConfig)

    this.setControlsSettings()
    this.setPostSettings()
    this.setCameraSettings()

    if (this.FDG && this.FDG.active === true) {
      this.FDG.triggerUpdate()
    }
  }

  destroy () {
    this.renderer.dispose()

    this.scene.traverse(function (object) {
      if (object.geometry) {
        object.geometry.dispose()
      }
      if (object.material) {
        object.material.dispose()
      }
    })

    this.controls.dispose()

    delete this.composer
    delete this.renderer
    delete this.scene
    delete this.controls
    delete this.FDG

    window.cancelAnimationFrame(this.animate)
    this.running = false
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

  sideBar () {
    if (this.config.display.showSidebar) {
      return (
        <ol className='gource-sidebar'>
          {this.state.sideBarCommits.map((commit) =>
            <li key={commit.sha}
              className={commit.index === this.state.sidebarCurrentCommitIndex ? 'current' : ''}
              onClick={() => { this.loadCommit(commit.sha) }}>
              <div className='sidebar-gravatar'>
                <img src={commit.gravatar} width='40' height='40' alt='' />
              </div>
              <div className='sidebar-details'>
                <p>
                  <span className='sidebar-author'>{commit.author}</span> <span className='sidebar-date' title={commit.dateLong}>{commit.dateShort}</span>
                  <a className='sidebar-github-view' target='_blank' title='View Commit on GitHub' href={'https://github.com/' + this.config.git.owner + '/' + this.config.git.repo + '/commit/' + commit.sha}>
                  View on GitHub
                  </a>
                </p>
                <p>
                  <span className='sidebar-message'>
                    {commit.msg}
                  </span>
                </p>
              </div>
            </li>
          )}
        </ol>
      )
    }
  }

  UI () {
    if (!this.config.display.showUI) {
      return (
        <div className='gource-ui'>
          {this.sideBar()}
        </div>
      )
    }

    return (
      <div className='gource-ui'>
        {this.sideBar()}
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
            <button onClick={() => { this.loadCommit(this.commitInput.value.trim()) }}>Go</button>
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

  render () {
    return (
      <div className='App'>
        {this.UI()}
        <canvas width={this.config.scene.width} height={this.config.scene.height} id={this.config.scene.canvasID} />
      </div>
    )
  }
}

export default App
