// 3rd Party
import React, { Component } from 'react'
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import deepAssign from 'deep-assign'
import EventEmitter from 'eventemitter3'
import mixin from 'mixin'
import moment from 'moment'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import MD5 from './libs/MD5'

// Post
import { EffectComposer, ShaderPass, RenderPass } from './libs/post/EffectComposer'
import Vignette from './libs/post/Vignette'

// Libs
import Config from './Config'
import FDG from './libs/FDG'

// CSS
import './App.css'

class App extends mixin(EventEmitter, Component) {
  constructor (props) {
    super(props)

    this.config = deepAssign(Config, this.props.config)

    this.initFireBase()

    this.running = true // whether the app is running

    this.currentFrame = 0 // current frame of animation
    this.prevAPICallFrame = 0 // last frame which API was called on

    this.FDG = null // Force Directed Graph class

    this.userInteracting = true // whether user is interacting with graph

    this.mousePos = new THREE.Vector2() // keep track of mouse position
    this.mouseDelta = new THREE.Vector2() // keep track of mouse position

    let timestampToLoad = this.setTimestampToLoad() // should a specific timestamp be loaded

    this.commitsToProcess = [] // list of commits to process
    this.nodes = {} // node data
    this.edges = [] // edge data
    this.loadPrevCommit = false // load in the previous commit
    this.loadNextCommit = false // load in the next commit

    this.state = {
      play: this.config.FDG.autoPlay,
      currentDate: null,
      currentCommitHash: '',
      spherize: this.config.FDG.sphereProject,
      currentCommit: null,
      currentAuthor: null,
      currentMsg: null,
      currentAdded: null,
      currentChanged: null,
      currentRemoved: null,
      timestampToLoad: timestampToLoad,
      currentCommitIndex: -1,
      sideBarCommits: [],
      sidebarCurrentCommitIndex: -1,
      selectedFileCommitID: '',
      selectedFilePath: '',
      selectedFileAuthorLogin: '',
      selectedFileAuthorName: '',
      selectedFileAuthorEmail: '',
      selectedFileAuthorImg: '',
      selectedFileDate: '',
      selectedFileName: '',
      selectedFileMessage: '',
      fileInfoLocation: {x: 0, y: 0},
      showFileInfo: false,
      loadingFileInfo: true
    }

    this.loadCommitHash = this.config.git.commitHash
  }

  setTimestampToLoad () {
    let timestampToLoad = 0
    if (typeof URLSearchParams !== 'undefined') {
      // get date from URL
      let urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('date')) {
        timestampToLoad = moment(urlParams.get('date')).valueOf()
      } else {
        if (this.config.git.commitDate) {
          timestampToLoad = moment(this.config.git.commitDate).valueOf()
        }
      }
    }
    return timestampToLoad
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
      timestampToLoad: date
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
    // set firebase collection names
    this.repo = this.config.git.repo
    this.repoChanges = this.config.git.repo + '_changes'
    this.repoFileInfo = this.config.git.repo + '_fileInfo'

    try {
      firebase.initializeApp(this.config.fireBase)

      const settings = {timestampsInSnapshots: true}
      firebase.firestore().settings(settings)

      await firebase.firestore().enablePersistence()
    } catch (error) {
      console.log(error)
    }

    this.firebaseDB = firebase.firestore()

    this.docRef = this.firebaseDB.collection(this.repo)
    this.docRefChanges = this.firebaseDB.collection(this.repoChanges)
    this.docRefFileInfo = this.firebaseDB.collection(this.repoFileInfo)

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
    this.OrbitControls = OrbitContructor(THREE)
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
      this.camera,
      this.mousePos,
      this
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

    if (this.FDG && this.config.dev.debugPicker) {
      this.renderer.render(this.FDG.pickingScene, this.camera)
    } else {
      // this.renderer.render(this.scene, this.camera)
      this.composer.render()
    }
  }

  addEvents () {
    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

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

    this.canvas.addEventListener('touchstart', (e) => {
      timeout.call(this)
    })

    this.canvas.addEventListener('mousedown', (e) => {
      timeout.call(this)
      if (this.FDG && this.FDG.enabled) {
        this.FDG.onMouseDown()
      }
    })

    this.canvas.addEventListener('mouseup', (e) => {
      if (this.FDG && this.FDG.enabled) {
        this.FDG.onMouseUp()
      }
    })

    this.canvas.addEventListener('wheel', (e) => {
      timeout.call(this)
    })

    this.canvas.addEventListener('mousewheel', (e) => {
      timeout.call(this)
    })

    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false)

    this.on('nodeDeselect', function (data) {
      this.controls.enabled = true
      this.controls.enableDamping = true
      this.setState({
        showFileInfo: false
      })
    })

    // call github API when selecting node
    this.on('nodeSelect', async function (data) {
      if (!this.config.FDG.usePicker) {
        return
      }

      this.controls.enableDamping = false
      this.controls.enabled = false

      // check dist of popup from screen edge
      let fileInfoLocation = data.mousePos.clone()
      fileInfoLocation.x += window.scrollX
      fileInfoLocation.y += window.scrollY
      let distFromRightEdge = this.canvas.width - data.mousePos.x
      if (distFromRightEdge < 400) {
        fileInfoLocation.x -= 390
      }

      let distFromBottomEdge = this.canvas.height - data.mousePos.y
      if (distFromBottomEdge < 100) {
        fileInfoLocation.y -= 50
      }

      let distFromTopEdge = data.mousePos.y
      if (distFromTopEdge < 50) {
        fileInfoLocation.y += 50
      }

      this.setState({
        loadingFileInfo: true,
        selectedFilePath: data.nodeData.p,
        fileInfoLocation: fileInfoLocation,
        showFileInfo: true
      })

      let commitDate = moment(this.state.currentCommit.date).format()

      let uri = 'https://us-central1-webgl-gource-1da99.cloudfunctions.net/github-fileInfo?repo=' + this.config.git.repo +
      '&branch=' + this.config.git.branch +
      '&owner=' + this.config.git.owner +
      '&path=' + data.nodeData.p +
      '&date=' + commitDate

      uri = uri.replace('+', '%2B')

      window.fetch(uri, {
        method: 'POST'
      })
        .then(res => res.text())
        .then((body) => {
          let fileCommitDetails = JSON.parse(body)

          let fileNameArr = data.nodeData.p.split('/')
          let fileName = fileNameArr[fileNameArr.length - 1]

          this.setState({
            selectedFileCommitID: fileCommitDetails.oid,
            selectedFileAuthorLogin: fileCommitDetails.author.user !== null ? fileCommitDetails.author.user.login : fileCommitDetails.author.email,
            selectedFileAuthorEmail: fileCommitDetails.author.email,
            selectedFileAuthorName: fileCommitDetails.author.name,
            selectedFileAuthorImg: fileCommitDetails.author.avatarUrl,
            selectedFileCommitURL: fileCommitDetails.commitUrl,
            selectedFileDate: fileCommitDetails.author.date,
            selectedFileDateRelative: moment(fileCommitDetails.author.date).fromNow(),
            selectedFileMessage: fileCommitDetails.message,
            selectedFileName: fileName,
            showFileInfo: true,
            loadingFileInfo: false
          })
        })
        .catch(() => {
          this.controls.enableDamping = true
          this.controls.enabled = true
          this.setState({
            showFileInfo: false,
            loadingFileInfo: false
          })
        })
    }.bind(this))
  }

  onMouseMove (e) {
    this.mousePos.x = e.clientX
    this.mousePos.y = e.clientY
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
    this.canvas = document.querySelector('#' + this.config.scene.canvasID)

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.scene.antialias,
      canvas: this.canvas
    })
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

    this.FDG.resize(this.width, this.height)
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

    if (this.config.fireBase.useChangesDB) {
      // only get changed data in play mode
      if (this.state.play) {
        this.docRef = this.firebaseDB.collection(this.repoChanges)
      } else {
        this.docRef = this.firebaseDB.collection(this.repo)
      }
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
    } else if (this.config.git.loadLatest && !this.state.timestampToLoad) {
      commits = this.docRef.orderBy('index', 'desc').limit(1)
    } else if (this.state.timestampToLoad) {
      commits = this.docRef.where('date', '>=', this.state.timestampToLoad).limit(1)
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

    let snapshotOptions = {}

    if (this.state.timestampToLoad) {
      snapshotOptions.includeMetadataChanges = true
    }

    commits.onSnapshot(snapshotOptions,
      async function (querySnapshot) {
        // if loading from a particular date, disable local storage cache
        if (this.state.timestampToLoad && querySnapshot.metadata.fromCache) {
          return
        }

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
        if (this.state.timestampToLoad && snapshots.length === 0) {
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

        const addCommits = async () => {
          await this.asyncForEach(snapshots, async (snapshot) => {
            await this.updateGraph(snapshot)
          })
          this.APIprocessing = false
          this.callAPI()
        }
        addCommits()
      }.bind(this), function (error) {
        console.log(error)
      })
  }

  async updateGraph (doc) {
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
        this.edges = JSON.parse(commit.edges)

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

          for (const newIndex in nodeChanges.i) {
            if (nodeChanges.i.hasOwnProperty(newIndex)) {
              const newNode = nodeChanges.i[newIndex]

              for (const key in this.nodes) {
                if (this.nodes.hasOwnProperty(key)) {
                  const oldNode = this.nodes[key]
                  if (oldNode.p === newNode.p) {
                    delete this.nodes[key]
                  }
                }
              }

              this.nodes[newIndex] = newNode
            }
          }

          for (const key in nodeChanges.a) {
            if (nodeChanges.a.hasOwnProperty(key)) {
              const node = nodeChanges.a[key]
              node.u = 1.0
              this.nodes[key] = node
            }
          }
        }

        let changedState = {}

        changedState.timestampToLoad = 0
        changedState.currentCommit = commit
        changedState.currentDate = moment.unix(commit.date / 1000).format('MM/DD/YYYY HH:mm:ss')
        changedState.currentCommitHash = commit.sha
        changedState.currentAuthor = commit.author + ' <' + commit.email + '>'
        changedState.currentMsg = commit.msg

        let changes
        if (!commit.changeDetail) {
          changes = JSON.parse(commit.changes)
          changedState.currentAdded = isNaN(changes.a) ? Object.keys(changes.a).length : changes.a
          changedState.currentChanged = isNaN(changes.c) ? changes.c.length : changes.c
          changedState.currentRemoved = isNaN(changes.r) ? changes.r.length : changes.r
        } else {
          changes = JSON.parse(commit.changeDetail)
          changedState.currentAdded = changes.a
          changedState.currentChanged = changes.c + changes.rn
          changedState.currentRemoved = changes.r
        }

        changedState.currentCommitIndex = commit.index

        this.cameraAccommodateNodes()

        if (this.FDG) {
          if (this.FDG.firstRun) {
            this.FDG.init({
              nodeData: this.nodes,
              edgeData: this.edges,
              nodeCount: this.config.FDG.nodeCount
            })
            this.FDG.setFirstRun(false)
            this.toggleSpherize()
            setTimeout(() => {
              this.toggleSpherize()
            }, 1000)
          } else {
            this.FDG.refresh()
            this.FDG.init({
              nodeData: this.nodes,
              edgeData: this.edges,
              nodeCount: this.config.FDG.nodeCount
            })
          }
        }

        this.populateSideBar(changedState.currentCommitIndex)

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

        if (this.state.play) {
          resolve()
        } else {
          this.APIprocessing = false
        }
      }, this.config.FDG.delayAmount)
    })
  }

  async asyncForEach (array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
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

    let commitsAbove = this.docRef.orderBy('index', 'asc').where('index', '>', currentCommitIndex).limit(this.config.display.sidebarCommitLimit)
    let commitsBelow = this.docRef.orderBy('index', 'desc').where('index', '<', currentCommitIndex).limit(this.config.display.sidebarCommitLimit)

    // this.sidebarRunCount = 0

    let snapshotOptions = {}
    if (this.state.timestampToLoad) {
      snapshotOptions.includeMetadataChanges = true
    }

    commitsAbove.onSnapshot(snapshotOptions, function (querySnapshot) {
      if (this.state.timestampToLoad && querySnapshot.metadata.fromCache) {
        return
      }

      this.commitsAboveArr = []

      querySnapshot.forEach(snapshot => {
        let data = snapshot.data()
        data.dateLong = moment(data.date).format('dddd, MMMM Do YYYY, h:mm:ss a')
        data.dateShort = moment(data.date).format('MMM Do')
        data.sha = snapshot.id
        data.gravatar = this.getGravatar(data.email, 40)
        this.commitsAboveArr.push(data)
      })

      commitsBelow.onSnapshot(function (querySnapshot) {
        if (this.state.timestampToLoad && querySnapshot.metadata.fromCache) {
          return
        }

        this.commitsBelowArr = []
        querySnapshot.forEach(snapshot => {
          let data = snapshot.data()

          data.dateLong = moment(data.date).format('dddd, MMMM Do YYYY, h:mm:ss a')
          data.dateShort = moment(data.date).format('MMM Do')
          data.sha = snapshot.id
          data.gravatar = this.getGravatar(data.email, 40)
          this.commitsBelowArr.push(data)
        })

        this.sortCommitsSidebar(currentCommitIndex)
      }.bind(this), function (error) {
        console.log(error)
      })
    }.bind(this), function (error) {
      console.log(error)
    })
  }

  sortCommitsSidebar (currentCommitIndex) {
    /* if (this.sidebarRunCount > 0 && this.state.timestampToLoad === 0) {
      return
    }

    this.sidebarRunCount++ */

    if (typeof this.commitsAboveArr === 'undefined' || typeof this.commitsBelowArr === 'undefined') {
      return
    }

    // current commit
    let data = this.state.currentCommit
    data.dateLong = moment(data.date).format('dddd, MMMM Do YYYY, h:mm:ss a')
    data.dateShort = moment(data.date).format('MMM Do')
    data.gravatar = this.getGravatar(data.email, 40)
    let sidebarCommits = [data]

    let added = 0
    for (let index = 0; index < this.config.display.sidebarCommitLimit * 2; index++) {
      let commitToAddAbove = this.commitsAboveArr.shift()
      if (typeof commitToAddAbove !== 'undefined') {
        sidebarCommits.push(commitToAddAbove)
        added++
      }
      let commitToAddBelow = this.commitsBelowArr.shift()
      if (typeof commitToAddBelow !== 'undefined') {
        sidebarCommits.push(commitToAddBelow)
        added++
      }

      if (added === this.config.display.sidebarCommitLimit - 1) {
        break
      }
    }

    sidebarCommits.sort((a, b) => {
      return b.index - a.index
    })

    this.setState({
      sideBarCommits: sidebarCommits,
      sidebarCurrentCommitIndex: currentCommitIndex
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

  fileInfoWidget () {
    return (
      <div className='gource-file-info-widget' style={{ left: this.state.fileInfoLocation.x + 30, top: this.state.fileInfoLocation.y - 50, display: this.state.showFileInfo ? 'block' : 'none' }}>
        <div className='file-info-loading' style={{ display: this.state.loadingFileInfo ? 'block' : 'none' }}>
          <img width='70' src='assets/images/loading.svg' alt='Loading' />
        </div>
        <div className='file-info-contents' style={{ display: this.state.loadingFileInfo ? 'none' : 'block' }}>
          <div className='file-info-gravatar'>
            <img src={this.state.selectedFileAuthorImg} width='40' height='40' alt='' />
          </div>
          <div className='file-info-details'>
            <div className='file-info-author-name'>
              <p>
                <a href={'https://github.com/' + this.config.git.owner + '/' + this.config.git.repo + '/commits?author=' + this.state.selectedFileAuthorLogin}
                  target='_blank'
                  title={'View all commits by ' + this.state.selectedFileAuthorName}
                >
                  {this.state.selectedFileAuthorName}
                </a> {this.state.selectedFileDateRelative}
              </p>
            </div>

            <div className='file-info-name'>
              <p>{this.state.selectedFileName}</p>
            </div>
            <div className='file-info-message'>
              <p>{this.state.selectedFileMessage}</p>
            </div>
            <div className='file-info-links'>
              <a className='' href={'https://github.com/' + this.config.git.owner + '/' + this.config.git.repo + '/blob/' + this.state.selectedFileCommitID + '/' + this.state.selectedFilePath}
                target='_blank'
                title='View file on GitHub'
              >View file</a>&nbsp;|&nbsp;
              <a href={this.state.selectedFileCommitURL}
                target='_blank'
                title='View full commit on GitHub'
              >View commit</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    return (
      <div className='App'>
        {this.fileInfoWidget()}
        {this.UI()}
        <canvas width={this.config.scene.width} height={this.config.scene.height} id={this.config.scene.canvasID} />
      </div>
    )
  }
}

export default App
