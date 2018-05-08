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

    this.repo = this.config.git.repo
    this.repoChanges = this.config.git.repo + '_changes'

    this.initFireBase()
    this.anonymousSignin()

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
    this.APICalled = false
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

  initFireBase () {
    firebase.initializeApp(this.config.fireBase)
    this.firebaseDB = firebase.firestore()
    const settings = {timestampsInSnapshots: true}
    this.firebaseDB.settings(settings)
    this.docRef = this.firebaseDB.collection(this.config.git.repo)
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
    requestAnimationFrame(this.animate.bind(this))
    this.renderFrame()
  }

  renderFrame () {
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
    this.APIprocessing = true
    let commits
    let singleCommit = false

    // only get changed data in play mode
    if (this.state.play) {
      // this.docRef = this.firebaseDB.collection(this.config.git.repo + '_changes')
      // console.log('changes')
    }

    // load commit by hash
    if (this.loadCommitHash !== '') {
      commits = this.docRef.doc(this.loadCommitHash)
      this.loadCommitHash = ''
      singleCommit = true
    } else if (this.loadPrevCommit) { // load previous commit
      commits = this.docRef.where('index', '==', (this.state.currentCommitIndex - 1)).limit(1)
      this.loadPrevCommit = false
    } else if (this.loadNextCommit) { // load next commit
      commits = this.docRef.where('index', '==', (this.state.currentCommitIndex + 1)).limit(1)
      this.loadNextCommit = false
    } else if (this.config.git.loadLatest && !this.state.latestTime) {
      commits = this.docRef.orderBy('index', 'desc').limit(1)
      this.config.git.loadLatest = false
    } else {
      commits = this.docRef.orderBy('index', 'asc').where('index', '>=', this.state.currentCommitIndex + 1).limit(1)
    }

    let snapshot = await commits.get()

    // if no results found for the passed date, load latest commit
    if (snapshot.empty && this.state.latestTime) {
      commits = this.docRef.orderBy('index', 'desc').limit(1)
      snapshot = await commits.get()
    }

    if (snapshot.docs && snapshot.docs.length === 0) {
      setTimeout(() => {
        this.callAPI()
      }, 60000)
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
          changedState.latestTime = commit.date + 1
          changedState.currentDate = moment.unix(commit.date / 1000).format('MM/DD/YYYY HH:mm:ss')
          changedState.currentCommitHash = commit.sha
          changedState.currentAuthor = commit.author + ' <' + commit.email + '>'
          changedState.currentMsg = commit.msg
          changedState.currentAdded = isNaN(changes.a) ? Object.keys(changes.a).length : changes.a
          changedState.currentChanged = isNaN(changes.c) ? changes.c.length : changes.c
          changedState.currentRemoved = isNaN(changes.r) ? changes.r.length : changes.r
          // this.currentCommitIndex = commit.index
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

          this.populateSideBar()

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

  getGravatar (email, size) {
    // MD5 (Message-Digest Algorithm) by WebToolkit
    var MD5 = function (s) { function L (k, d) { return (k << d) | (k >>> (32 - d)) } function K (G, k) { var I, d, F, H, x; F = (G & 2147483648); H = (k & 2147483648); I = (G & 1073741824); d = (k & 1073741824); x = (G & 1073741823) + (k & 1073741823); if (I & d) { return (x ^ 2147483648 ^ F ^ H) } if (I | d) { if (x & 1073741824) { return (x ^ 3221225472 ^ F ^ H) } else { return (x ^ 1073741824 ^ F ^ H) } } else { return (x ^ F ^ H) } } function r (d, F, k) { return (d & F) | ((~d) & k) } function q (d, F, k) { return (d & k) | (F & (~k)) } function p (d, F, k) { return (d ^ F ^ k) } function n (d, F, k) { return (F ^ (d | (~k))) } function u (G, F, aa, Z, k, H, I) { G = K(G, K(K(r(F, aa, Z), k), I)); return K(L(G, H), F) } function f (G, F, aa, Z, k, H, I) { G = K(G, K(K(q(F, aa, Z), k), I)); return K(L(G, H), F) } function D (G, F, aa, Z, k, H, I) { G = K(G, K(K(p(F, aa, Z), k), I)); return K(L(G, H), F) } function t (G, F, aa, Z, k, H, I) { G = K(G, K(K(n(F, aa, Z), k), I)); return K(L(G, H), F) } function e (G) { var Z; var F = G.length; var x = F + 8; var k = (x - (x % 64)) / 64; var I = (k + 1) * 16; var aa = Array(I - 1); var d = 0; var H = 0; while (H < F) { Z = (H - (H % 4)) / 4; d = (H % 4) * 8; aa[Z] = (aa[Z] | (G.charCodeAt(H) << d)); H++ }Z = (H - (H % 4)) / 4; d = (H % 4) * 8; aa[Z] = aa[Z] | (128 << d); aa[I - 2] = F << 3; aa[I - 1] = F >>> 29; return aa } function B (x) { var k = '', F = '', G, d; for (d = 0; d <= 3; d++) { G = (x >>> (d * 8)) & 255; F = '0' + G.toString(16); k = k + F.substr(F.length - 2, 2) } return k } function J (k) { k = k.replace(/rn/g, 'n'); var d = ''; for (var F = 0; F < k.length; F++) { var x = k.charCodeAt(F); if (x < 128) { d += String.fromCharCode(x) } else { if ((x > 127) && (x < 2048)) { d += String.fromCharCode((x >> 6) | 192); d += String.fromCharCode((x & 63) | 128) } else { d += String.fromCharCode((x >> 12) | 224); d += String.fromCharCode(((x >> 6) & 63) | 128); d += String.fromCharCode((x & 63) | 128) } } } return d } var C = Array(); var P, h, E, v, g, Y, X, W, V; var S = 7, Q = 12, N = 17, M = 22; var A = 5, z = 9, y = 14, w = 20; var o = 4, m = 11, l = 16, j = 23; var U = 6, T = 10, R = 15, O = 21; s = J(s); C = e(s); Y = 1732584193; X = 4023233417; W = 2562383102; V = 271733878; for (P = 0; P < C.length; P += 16) { h = Y; E = X; v = W; g = V; Y = u(Y, X, W, V, C[P + 0], S, 3614090360); V = u(V, Y, X, W, C[P + 1], Q, 3905402710); W = u(W, V, Y, X, C[P + 2], N, 606105819); X = u(X, W, V, Y, C[P + 3], M, 3250441966); Y = u(Y, X, W, V, C[P + 4], S, 4118548399); V = u(V, Y, X, W, C[P + 5], Q, 1200080426); W = u(W, V, Y, X, C[P + 6], N, 2821735955); X = u(X, W, V, Y, C[P + 7], M, 4249261313); Y = u(Y, X, W, V, C[P + 8], S, 1770035416); V = u(V, Y, X, W, C[P + 9], Q, 2336552879); W = u(W, V, Y, X, C[P + 10], N, 4294925233); X = u(X, W, V, Y, C[P + 11], M, 2304563134); Y = u(Y, X, W, V, C[P + 12], S, 1804603682); V = u(V, Y, X, W, C[P + 13], Q, 4254626195); W = u(W, V, Y, X, C[P + 14], N, 2792965006); X = u(X, W, V, Y, C[P + 15], M, 1236535329); Y = f(Y, X, W, V, C[P + 1], A, 4129170786); V = f(V, Y, X, W, C[P + 6], z, 3225465664); W = f(W, V, Y, X, C[P + 11], y, 643717713); X = f(X, W, V, Y, C[P + 0], w, 3921069994); Y = f(Y, X, W, V, C[P + 5], A, 3593408605); V = f(V, Y, X, W, C[P + 10], z, 38016083); W = f(W, V, Y, X, C[P + 15], y, 3634488961); X = f(X, W, V, Y, C[P + 4], w, 3889429448); Y = f(Y, X, W, V, C[P + 9], A, 568446438); V = f(V, Y, X, W, C[P + 14], z, 3275163606); W = f(W, V, Y, X, C[P + 3], y, 4107603335); X = f(X, W, V, Y, C[P + 8], w, 1163531501); Y = f(Y, X, W, V, C[P + 13], A, 2850285829); V = f(V, Y, X, W, C[P + 2], z, 4243563512); W = f(W, V, Y, X, C[P + 7], y, 1735328473); X = f(X, W, V, Y, C[P + 12], w, 2368359562); Y = D(Y, X, W, V, C[P + 5], o, 4294588738); V = D(V, Y, X, W, C[P + 8], m, 2272392833); W = D(W, V, Y, X, C[P + 11], l, 1839030562); X = D(X, W, V, Y, C[P + 14], j, 4259657740); Y = D(Y, X, W, V, C[P + 1], o, 2763975236); V = D(V, Y, X, W, C[P + 4], m, 1272893353); W = D(W, V, Y, X, C[P + 7], l, 4139469664); X = D(X, W, V, Y, C[P + 10], j, 3200236656); Y = D(Y, X, W, V, C[P + 13], o, 681279174); V = D(V, Y, X, W, C[P + 0], m, 3936430074); W = D(W, V, Y, X, C[P + 3], l, 3572445317); X = D(X, W, V, Y, C[P + 6], j, 76029189); Y = D(Y, X, W, V, C[P + 9], o, 3654602809); V = D(V, Y, X, W, C[P + 12], m, 3873151461); W = D(W, V, Y, X, C[P + 15], l, 530742520); X = D(X, W, V, Y, C[P + 2], j, 3299628645); Y = t(Y, X, W, V, C[P + 0], U, 4096336452); V = t(V, Y, X, W, C[P + 7], T, 1126891415); W = t(W, V, Y, X, C[P + 14], R, 2878612391); X = t(X, W, V, Y, C[P + 5], O, 4237533241); Y = t(Y, X, W, V, C[P + 12], U, 1700485571); V = t(V, Y, X, W, C[P + 3], T, 2399980690); W = t(W, V, Y, X, C[P + 10], R, 4293915773); X = t(X, W, V, Y, C[P + 1], O, 2240044497); Y = t(Y, X, W, V, C[P + 8], U, 1873313359); V = t(V, Y, X, W, C[P + 15], T, 4264355552); W = t(W, V, Y, X, C[P + 6], R, 2734768916); X = t(X, W, V, Y, C[P + 13], O, 1309151649); Y = t(Y, X, W, V, C[P + 4], U, 4149444226); V = t(V, Y, X, W, C[P + 11], T, 3174756917); W = t(W, V, Y, X, C[P + 2], R, 718787259); X = t(X, W, V, Y, C[P + 9], O, 3951481745); Y = K(Y, h); X = K(X, E); W = K(W, v); V = K(V, g) } var i = B(Y) + B(X) + B(W) + B(V); return i.toLowerCase() }
    return 'https://secure.gravatar.com/avatar/' + MD5(email) + '.jpg?s=' + size
  }

  async populateSideBar () {
    let docRef = this.firebaseDB.collection(this.config.git.repo + '_changes')
    if (this.state.currentCommitIndex < 4) {
      docRef = this.firebaseDB.collection(this.config.git.repo)
    }
    const commits = docRef.orderBy('index', 'asc').where('index', '>=', this.state.currentCommitIndex - 2).limit(5)
    const snapshot = await commits.get()
    let sideBarCommits = []
    snapshot.forEach(snapshot => {
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

    this.setState({
      sideBarCommits: sideBarCommits,
      sidebarCurrentCommitIndex: this.state.currentCommitIndex
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
    if (hash === '') {
      hash = this.commitInput.value.trim()
    }
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
