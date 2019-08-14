// 3rd Party
import React, { Component } from 'react'

import {
  Vector2,
  Vector3,
  Color,
  Scene,
  PerspectiveCamera,
  Quaternion,
  Euler,
  WebGLRenderer
} from './vendor/three/Three'

import OrbitControls from './vendor/three-orbit-controls/OrbitControls'
import deepAssign from 'deep-assign'
import EventEmitter from 'eventemitter3'
import mixin from 'mixin'
import moment from 'moment'
import 'moment/locale/ja'
import 'moment/locale/zh-cn'
import 'moment/locale/ko'
import 'moment/locale/en-gb'


import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import MD5 from './libs/MD5'
import Media from 'react-media'

import {
  BrowserRouter
} from 'react-router-dom'

// Post
import {
  EffectComposer,
  ShaderPass,
  RenderPass
  // UnrealBloomPass
} from './libs/post/EffectComposer'
import Vignette from './libs/post/Vignette'

// Libs
import Config from './Config'
import FDG from './libs/FDG'

// Components
import FileInfo from './components/FileInfo'
import CommitList from './components/CommitList'
import Controls from './components/Controls'
import Sidebar from './components/Sidebar'
import Calendar from './components/Calendar'
import Legend from './components/Legend'
import Content from './components/Content'
import Head from './components/Head'
import About from './components/About'
import Widget from './components/Widget'
import DatePicker from 'react-datepicker'

import Smallogo from './style/images/logo-xs.svg'

// Slider
import Slider, { createSliderWithTooltip } from 'rc-slider'

import SVG from 'react-inlinesvg'

// Styles
import './style/medusa.scss'
import FullscreenCloseImg from './style/images/close-fullscreen.svg'
import IconCalendar from './style/images/control-calendar.svg'
import IconPlay from './style/images/control-play.svg'
import IconPause from './style/images/control-pause.svg'
import IconPrev from './style/images/control-prev.svg'
import IconNext from './style/images/control-next.svg'
import IconClock from './style/images/icon-clock.svg'
import IconInfo from './style/images/icon-info-circle.svg'

const SliderWithTooltip = createSliderWithTooltip(Slider)

const UIlabels = {
  en: {
    widget: {
      head: {
        title: 'MEDUSA',
        subtitle: 'Github project activity',
        content: 'Introduction'
      },
      about: {
        title: 'About',
      },
      commitList: {
        title: 'Commit List',
        showing: 'Showing',
        addition: 'Addition',
        removal: 'Removal',
        change: 'Change',
        additions: 'Additions',
        removals: 'Removals',
        changes: 'Changes',
        viewfile: 'View file',
        viewcommit: 'View commit',
      },
      calendar: {
        title: 'Calendar',
      }
    },
    legend: {
      committed: {
        title: 'Committed file',
      },
      updated: {
        title: 'Updated file',
      },
      cold: {
        title: 'Cold file',
      }
    }
  },
  ja: {
    widget: {
      head: {
        title: 'MEDUSA',
        subtitle: 'Github プロジェクトアクティビティ ライブ',
        content: ''
      },
      about: {
        title: '内容',
      },
      commitList: {
        title: 'コミットリスト',
        showing: '表示中',
        addition: '添加',
        removal: '除去',
        change: '変化する',
        additions: '追加',
        removals: '削除',
        changes: '変更点',
        viewfile: 'ファイルを閲覧する',
        viewcommit: 'コミットを見る',
      },
      calendar: {
        title: 'カレンダー',
      }
    },
    legend: {
      committed: {
        title: 'コミットされたファイル',
      },
      updated: {
        title: '更新ファイル',
      },
      cold: {
        title: 'コールドファイル',
      }
    }
  },
  cn: {
    widget: {
      head: {
        title: 'Medusa 项目浏览器',
        subtitle: 'Github 项目活动状态',
        content: ''
      },
        about: {
        title: '关于',
      },
      commitList: {
        title: '提交清单',
        showing: '显示',
        addition: '加成',
        removal: '切除',
        change: '更改',
        additions: '附加',
        removals: '清除',
        changes: '变化',
        viewfile: '查看文件',
        viewcommit: '查看提交',
      },
      calendar: {
        title: '日历',
      }
    },
    legend: {
      committed: {
        title: '提交文件',
      },
      updated: {
        title: '更新的文件',
      },
      cold: {
        title: '冷文件',
      }
    }
  },
  kr: {
    widget: {
      head: {
        title: 'Medusa 프로젝트 탐색기',
        subtitle: 'Github 프로젝트 활동 라이브',
        content: ''
      },
        about: {
        title: '개요',
      },
      commitList: {
        title: '커밋 목록',
        showing: '표시',
        addition: '부가',
        removal: '제거',
        change: '변화',
        additions: '추가',
        removals: '삭제',
        changes: '변경 사항',
        viewfile: '파일보기',
        viewcommit: '커밋보기',
      },
      calendar: {
        title: '달력',
      }
    },
    legend: {
      committed: {
        title: '커밋된 파일',
      },
      updated: {
        title: '업데이트된 파일',
      },
      cold: {
        title: '콜드 파일',
      }
    }
  }
  ,
  ko: {
    widget: {
      head: {
        title: 'Medusa 프로젝트 탐색기',
        subtitle: 'Github 프로젝트 활동 라이브',
        content: ''
      },
        about: {
        title: '개요',
      },
      commitList: {
        title: '커밋 목록',
        showing: '표시',
        addition: '부가',
        removal: '제거',
        change: '변화',
        additions: '추가',
        removals: '삭제',
        changes: '변경 사항',
        viewfile: '파일보기',
        viewcommit: '커밋보기',
      },
      calendar: {
        title: '달력',
      }
    },
    legend: {
      committed: {
        title: '커밋된 파일',
      },
      updated: {
        title: '업데이트된 파일',
      },
      cold: {
        title: '콜드 파일',
      }
    }
  }
}

const lang_locales = {
  ja: 'ja',
  cn: 'zh-cn',
  kr: 'ko',
  ko: 'ko',
  en: 'en-gb'
}

function dateSliderTooltipFormatter (v) {
  return `${moment(v).format('DD.MM.YYYY')}`
}

class App extends mixin(EventEmitter, Component) {
  constructor (props) {
    super(props)

    this.config = deepAssign(Config, this.props.config)

    if (typeof URLSearchParams !== 'undefined') {
      let urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('repo')) {
        let value = urlParams.get('repo')
        if (this.config.git.supportedRepos.indexOf(value) !== -1) {
          this.setConfig({
            git: {
              repo: value
            }
          })
        }
      }

      if (urlParams.has('lang')) {
        let value = urlParams.get('lang')

        this.config.lang = value
        this.config.widget.head.title = UIlabels[value].widget.head.title
        this.config.widget.head.subtitle = UIlabels[value].widget.head.subtitle
        this.config.widget.head.content = UIlabels[value].widget.head.content

        this.config.widget.about.title = UIlabels[value].widget.about.title
        this.config.widget.commitList.title = UIlabels[value].widget.commitList.title
        this.config.widget.commitList.showing = UIlabels[value].widget.commitList.showing
        this.config.widget.commitList.addition = UIlabels[value].widget.commitList.addition
        this.config.widget.commitList.change = UIlabels[value].widget.commitList.change
        this.config.widget.commitList.removal = UIlabels[value].widget.commitList.removal
        this.config.widget.commitList.additions = UIlabels[value].widget.commitList.additions
        this.config.widget.commitList.changes = UIlabels[value].widget.commitList.changes
        this.config.widget.commitList.removals = UIlabels[value].widget.commitList.removals
        this.config.widget.commitList.viewfile = UIlabels[value].widget.commitList.viewfile
        this.config.widget.commitList.viewcommit = UIlabels[value].widget.commitList.viewcommit
        this.config.widget.calendar.title = UIlabels[value].widget.calendar.title
        this.config.legend.committed.title = UIlabels[value].legend.committed.title
        this.config.legend.updated.title = UIlabels[value].legend.updated.title
        this.config.legend.cold.title = UIlabels[value].legend.cold.title
      }

      if (urlParams.has('title')) {
        let value = urlParams.get('title')
          this.config.widget.head.title = value
      }
      if (urlParams.has('subtitle')) {
        let value = urlParams.get('subtitle')
          this.config.widget.head.subtitle = value
      }
      if (urlParams.has('intro')) {
        let value = urlParams.get('intro')
          this.config.widget.head.content = value
      }

      if (urlParams.has('about')) {
        let value = urlParams.get('about')
          this.config.widget.about.title = value
      }
      if (urlParams.has('content')) {
        let value = urlParams.get('content')
          this.config.widget.about.content = value
      }
      if (urlParams.has('commits')) {
        let value = urlParams.get('commits')
          this.config.widget.commitList.title = value
      }
      if (urlParams.has('showing')) {
        let value = urlParams.get('showing')
          this.config.widget.commitList.showing = value
      }
      if (urlParams.has('milestones')) {
        let value = urlParams.get('milestones')
          this.config.widget.milestones.title = value
      }
      if (urlParams.has('calendar')) {
        let value = urlParams.get('calendar')
          this.config.widget.calendar.title = value
      }

      if (urlParams.has('committed')) {
        let value = urlParams.get('committed')
          this.config.legend.committed.title = value
      }
      if (urlParams.has('updated')) {
        let value = urlParams.get('updated')
          this.config.legend.updated.title = value
      }
      if (urlParams.has('cold')) {
        let value = urlParams.get('cold')
          this.config.legend.cold.title = value
      }

    }

    this.initFireBase()

    this.running = true // whether the app is running

    this.currentFrame = 0 // current frame of animation
    this.prevAPICallFrame = 0 // last frame which API was called on

    this.FDG = null // Force Directed Graph class

    this.userInteracting = true // whether user is interacting with graph

    this.mousePos = new Vector2() // keep track of mouse position
    this.mouseDelta = new Vector2() // keep track of mouse position

    this.timestampToLoad = this.setTimestampToLoad() // should a specific timestamp be loaded

    this.commitsToProcess = [] // list of commits to process
    this.nodes = {} // node data
    this.edges = [] // edge data
    this.loadPrevCommit = false // load in the previous commit
    this.loadNextCommit = false // load in the next commit

    this.fullScreenConfig = {
      open: {
        display: {
          showUI: true,
          showSidebar: true
        },
        scene: {
          fullScreen: true
        },
        camera: {
          enableZoom: true
        },
        FDG: {
          usePicker: true,
          showFilePaths: true
        }
      },
      close: {
        display: {
          showUI: false,
          showSidebar: false
        },
        scene: {
          fullScreen: false,
          width: this.config.scene.width,
          height: this.config.scene.height
        },
        camera: {
          enableZoom: false,
          initPos: { x: 0, y: 0, z: this.config.scene.zPosMinimized }
        },
        FDG: {
          usePicker: false,
          showFilePaths: false
        }
      }
    }

    this.componentMounted = false

    this.state = {
      play: this.config.FDG.autoPlay,
      currentDate: null,
      currentDateObject: moment(),
      currentCommitHash: '',
      spherize: this.config.FDG.sphereProject,
      currentCommit: null,
      currentAuthor: null,
      currentMsg: null,
      currentAdded: null,
      currentChanged: null,
      currentRemoved: null,
      currentCommitIndex: -1,
      sideBarCommits: [],
      sidebarCommitLimit: 5,
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
      mobileTabSelect: 'viewing-about',
      fileInfoLocation: { x: 0, y: 0 },
      showFileInfo: false,
      loadingFileInfo: true,
      dateRangeLoaded: false,
      showUI: this.config.display.showUI,
      showSidebar: this.config.display.showSidebar
    }

    this.loadCommitHash = this.config.git.commitHash
  }

  async setDateRange () {
    await this.getFirstCommit()
    await this.getLastCommit()
    this.setState({
      dateRangeLoaded: true
    })
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
  async anonymousSignin () {
    return new Promise((resolve, reject) => {
      firebase.auth().signInAnonymously()
        .then(() => {
          resolve()
        })
        .catch(function (error) {
          console.log(error.code)
          console.log(error.message)
        })
    })
  }

  /**
   * Set date to load commits from, if date is later
   * than the latest commit date, the latest commit
   * will be loaded
   *
   * @param {moment} dateObject
   */
  async setDate (dateObject) {
    this.timestampToLoad = dateObject.valueOf()

    this.setState({
      currentDateObject: dateObject
    })

    if (this.state.play) {
      this.setPlay(false)
    }
    this.callAPI()
  }

  /**
   * Set timestamp to load commits from
   *
   * @param {string} timestamp
   */
  async setTimestamp (timestamp) {
    this.timestampToLoad = timestamp

    this.setState({
      currentDateObject: moment(timestamp)
    })
    if (this.state.play) {
      this.setPlay(false)
    }
    this.callAPI()
  }

  /**
   * Toggle sphere projection mode
   *
   * @param {bool} bool
   */
  setSphereView (bool) {
    this.config.FDG.sphereProject = bool
    this.setState({ spherize: this.config.FDG.sphereProject })
  }

  async initFireBase () {
    // set firebase collection names
    this.repo = this.config.git.repo
    this.repoChanges = this.config.git.repo + '_changes'
    this.repoFileInfo = this.config.git.repo + '_fileInfo'

    try {
      firebase.initializeApp(this.config.fireBase)

      firebase.firestore()

      if (this.config.useIndexedDB) {
        this.firebaseDB = await firebase.firestore().enablePersistence()
      } else {
        this.firebaseDB = await firebase.firestore()
      }
    } catch (error) {
      console.log(error)
    }

    this.docRef = this.firebaseDB.collection(this.repo)
    this.docRefChanges = this.firebaseDB.collection(this.repoChanges)

    await this.anonymousSignin()

    this.callAPI()

    // send ready event
    this.emit('ready')
  }

  componentDidMount () {
    this.componentMounted = true
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
    this.getFullScreenConfig()
    this.animate()
  }

  getFullScreenConfig () {
    if (typeof URLSearchParams !== 'undefined') {
      let urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('medusa')) {
        let value = urlParams.get('medusa')
        if (value === 'fullscreen') {
          this.setConfig(this.fullScreenConfig.open)
        }
      }
    }
  }

  initPost () {
    this.composer = new EffectComposer(this.renderer)
    this.renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(this.renderPass)

    this.setPostSettings()
  }

  setPostSettings () {
    if (!this.composer) {
      return
    }

    // if (this.config.post.bloom) {
    //   // res, strength, radius, threshold
    //   this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.7, 0.1)
    //   this.composer.addPass(this.bloomPass)
    // }

    if (this.config.post.vignette) {
      if (this.vignettePass) {
        this.vignettePass.enabled = true
        this.renderPass.renderToScreen = false
      } else {
        this.vignettePass = new ShaderPass(Vignette)
        this.vignettePass.material.uniforms.bgColor.value = new Color(this.config.scene.bgColor)
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
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.setControlsSettings()
  }

  setControlsSettings () {
    if (!this.controls) {
      return
    }
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
        const camPos = this.camera.getWorldPosition(new Vector3())
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

    this.on('ready', () => {
      this.setDateRange()
    })

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

      let commitDate = moment(this.state.currentCommit.committerDate).locale(lang_locales[this.config.lang]).format()

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
            selectedFileDateRelative: moment(fileCommitDetails.author.date).locale(lang_locales[this.config.lang]).fromNow(),
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
    this.scene = new Scene()
    this.scene.background = new Color(this.config.scene.bgColor)
  }

  /**
   * Set up camera with defaults
   */
  initCamera () {
    this.camera = new PerspectiveCamera(this.config.camera.fov, window.innerWidth / window.innerHeight, 0.1, 2000000)
    this.camera.position.x = this.config.camera.initPos.x
    this.camera.position.y = this.config.camera.initPos.y
    this.camera.position.z = this.config.camera.initPos.z

    // speed of lerp
    this.cameraLerpSpeed = 0.03

    // set target positions
    this.cameraPos = this.camera.position.clone() // current camera position
    this.targetCameraPos = this.cameraPos.clone() // target camera position

    this.cameraLookAtPos = new Vector3(0, 0, 0) // current camera lookat
    this.targetCameraLookAt = new Vector3(0, 0, 0) // target camera lookat
    this.camera.lookAt(this.cameraLookAtPos)

    // set initial camera rotations
    this.cameraFromQuaternion = new Quaternion().copy(this.camera.quaternion)
    let cameraToRotation = new Euler().copy(this.camera.rotation)
    this.cameraToQuaternion = new Quaternion().setFromEuler(cameraToRotation)
    this.cameraMoveQuaternion = new Quaternion()

    this.camera.updateMatrixWorld()
    this.setCameraSettings()
  }

  setCameraSettings () {
    if (!this.camera) {
      return
    }
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

    this.renderer = new WebGLRenderer({
      antialias: false,
      canvas: this.canvas
    })
  }

  /**
   * Window resize
   */
  resize () {
    if (!this.camera) {
      return
    }

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
    } else if (this.config.git.loadLatest && !this.timestampToLoad) {
      commits = this.docRef.orderBy('index', 'desc').limit(1)
    } else if (this.timestampToLoad) {
      commits = this.docRef.where('date', '>=', this.timestampToLoad).limit(1)
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

    if (this.timestampToLoad) {
      snapshotOptions.includeMetadataChanges = true
    }

    commits.onSnapshot(snapshotOptions,
      async function (querySnapshot) {
        // if loading from a particular date, disable local storage cache
        if (this.timestampToLoad && querySnapshot.metadata.fromCache) {
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
              this.setState({ currentCommitIndex: commit.index + 1 })
              this.loadPrevCommit = true
            } else {
              this.setState({ currentCommitIndex: commit.index - 1 })
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
        if (this.timestampToLoad && snapshots.length === 0) {
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
    return new Promise((resolve) => {
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

        this.timestampToLoad = 0
        changedState.currentCommit = commit
        changedState.currentDate = moment.unix(commit.date / 1000).locale(lang_locales[this.config.lang]).format('MM/DD/YYYY HH:mm:ss')
        changedState.currentDateObject = moment(moment.unix(commit.date / 1000))
        changedState.committerDate = commit.committerDate ? moment.unix(commit.committerDate / 1000).locale(lang_locales[this.config.lang]).format('MM/DD/YYYY HH:mm:ss') : changedState.currentDate
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
    let toCentre = this.camera.getWorldPosition(new Vector3()).normalize()

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
    if (!this.state.showSidebar) {
      return
    }

    let commitsAbove = this.docRef.orderBy('index', 'asc').where('index', '>', currentCommitIndex).limit(this.config.display.sidebarCommitLimit)
    let commitsBelow = this.docRef.orderBy('index', 'desc').where('index', '<', currentCommitIndex).limit(this.config.display.sidebarCommitLimit)

    let snapshotOptions = {}
    if (this.timestampToLoad) {
      snapshotOptions.includeMetadataChanges = true
    }

    commitsAbove.onSnapshot(snapshotOptions, function (querySnapshot) {
      if (this.timestampToLoad && querySnapshot.metadata.fromCache) {
        return
      }

      this.commitsAboveArr = []

      querySnapshot.forEach(snapshot => {
        let data = snapshot.data()
        data.dateLong = moment(data.date).locale(lang_locales[this.config.lang]).format('dddd, MMMM Do YYYY, h:mm:ss a')
        data.dateShort = moment(data.date).locale(lang_locales[this.config.lang]).format('MMM Do')
        data.sha = snapshot.id
        data.gravatar = this.getGravatar(data.email, 40)
        this.commitsAboveArr.push(data)
      })

      commitsBelow.onSnapshot(function (querySnapshot) {
        if (this.timestampToLoad && querySnapshot.metadata.fromCache) {
          return
        }

        this.commitsBelowArr = []
        querySnapshot.forEach(snapshot => {
          let data = snapshot.data()

          data.dateLong = moment(data.date).locale(lang_locales[this.config.lang]).format('ddd, MMM Do YYYY, h:mm:ss a')
          data.dateShort = moment(data.date).locale(lang_locales[this.config.lang]).format('MMM Do')
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
    if (typeof this.commitsAboveArr === 'undefined' || typeof this.commitsBelowArr === 'undefined') {
      return
    }

    // current commit
    let data = this.state.currentCommit
    data.dateLong = moment(data.date).locale(lang_locales[this.config.lang]).format('ddd, MMM Do YYYY, h:mm:ss a')
    data.dateShort = moment(data.date).locale(lang_locales[this.config.lang]).format('MMM Do')
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
    this.setState({ spherize: this.config.FDG.sphereProject })
  }

  setPlay (bool) {
    let play = bool
    this.setState({ play: play })

    if (!play) {
      this.APIprocessing = false
      this.commitsToProcess = []
    }

    if (play && !this.APIprocessing) {
      // go back to start if play head at end
      if (this.maxIndex === this.state.currentCommitIndex) {
        this.setDate(moment(this.minDate))
        return
      }
      this.callAPI()
    }
  }

  togglePlay () {
    let play = !this.state.play
    this.setState({ play: play })

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
      this.setState({ play: false })
      this.callAPI()
    }
  }

  goToPrev () {
    this.loadPrevCommit = true
    this.commitsToProcess = []
    this.setState({ play: false })
    this.callAPI()
  }

  goToNext () {
    this.loadNextCommit = true
    this.commitsToProcess = []
    this.setState({ play: false })
    this.callAPI()
  }

  setConfig (newConfig) {
    this.config = deepAssign(this.config, newConfig)

    this.setControlsSettings()
    this.setPostSettings()
    this.setCameraSettings()
    this.setDisplayConfig()
    this.resize()

    if (this.FDG && this.FDG.enabled) {
      this.FDG.triggerUpdate()
    }
  }

  setDisplayConfig () {
    if (!this.componentMounted) {
      return
    }
    this.setState({
      showUI: this.config.display.showUI,
      showSidebar: this.config.display.showSidebar
    })
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
    let ref = this.firebaseDB.collection(this.repo)
    let commits = ref.orderBy('date', 'asc').limit(1)
    let snapshot = await commits.get()
    let firstCommit = snapshot.docs[0].data()

    this.minDate = firstCommit.date

    return firstCommit
  }

  async getLastCommit () {
    let ref = this.firebaseDB.collection(this.repo)
    let commits = ref.orderBy('date', 'desc').limit(1)
    let snapshot = await commits.get()

    let lastCommit = snapshot.docs[0].data()

    this.maxDate = lastCommit.date
    this.maxIndex = lastCommit.index

    return lastCommit
  }

  onDateSliderChange (timestamp) {
    this.setState({
      currentDateObject: moment(timestamp)
    })
  }

  playPauseButton () {
    if (this.state.play) {
      return (
        <button onClick={() => { this.setPlay(false) }} className='playpause border-0 bg-transparent text-primary'><SVG src={IconPause}></SVG></button>
      )
    } else {
      return (
        <button onClick={() => { this.setPlay(true) }} className='playpause border-0 bg-transparent text-primary'><SVG src={IconPlay}></SVG></button>
      )
    }
  }

  closeFullscreen () {
    this.setConfig(this.fullScreenConfig.close)
    if (typeof URLSearchParams !== 'undefined') {
      let urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('medusa')) {
        window.history.replaceState({}, '', '/')
      }
    }
  }

  closeFullscreenButton () {
    if (this.config.display.showClose) {
      return (
        <button ref='btn' onClick={this.closeFullscreen.bind(this)} className='close-fullscreen'><img src={FullscreenCloseImg} alt='' /></button>
      )
    }
  }

  resetCommitList (value) {
    this.config.display.sidebarCommitLimit = parseInt(value, 10)
    this.populateSideBar(this.state.sidebarCurrentCommitIndex)
  }

  mobileTabView (param,e) {
    this.setState({
      mobileTabSelect: param
    })
  }

  mobileTabSelectActive (value) {
    return (this.state.mobileTabSelect == value) ? 'active' : ''
  }


  UI () {
    const medusaUI = (this.config.scene.fullScreen) ? 'medusa-UI fullscreen' : 'medusa-UI'

    const mobileTabSelectActive = (value) => {
      return (this.state.mobileTabSelect == value) ? 'active' : ''
    }

    if (this.state.showUI) {
      return (
        <div className={`${medusaUI} ${this.state.mobileTabSelect}`}>



          <Media query="(max-width: 767px)">
            <div className='mobile-controls text-center'>
              <span className='text-body text-center d-block'>{this.state.currentDate}</span>
              <button onClick={this.state.goToPrev} className='prev border-0 bg-transparent text-body m-4 mt-2'><SVG src={IconPrev}></SVG></button>
              {this.playPauseButton()}
              <button onClick={this.state.goToNext} className='next border-0 bg-transparent text-body m-4 mt-2'><SVG src={IconNext}></SVG></button>
            </div>
          </Media>



          <Sidebar
            config={this.config}
            currentDate={this.state.currentDate}
            selected={this.state.currentDateObject}
            onSelect={this.setDate.bind(this)}
            minDate={moment(this.minDate)}
            maxDate={moment(this.maxDate)}
          >

            <Head
              config={this.config}
              icon={<button className='bg-transparent border-0 text-primary pt-2 pb-1'><img src={Smallogo} alt='' /></button>}
            />

            <About
              config={this.config}
              icon={<button className='bg-transparent border-0 text-primary pt-1 pb-1'><SVG src={IconInfo}></SVG></button>}
            />

            <CommitList
              icon={<button className='bg-transparent border-0 text-primary pt-1 pb-1'><SVG src={IconClock}></SVG></button>}
              title={this.config.widget.commitList.title}
              slug={this.config.widget.commitList.slug}
              config={this.config}
              showing={this.config.widget.commitList.showing}
              onChange={this.resetCommitList.bind(this)}
              value={this.state.value}
              sideBarCommits={this.state.sideBarCommits}
              sidebarCurrentCommitIndex={this.state.sidebarCurrentCommitIndex}
              loadCommit={this.loadCommit.bind(this)}
              goToPrev={this.goToPrev.bind(this)}
              goToNext={this.goToNext.bind(this)}
              currentAdded={this.state.currentAdded}
              currentChanged={this.state.currentChanged}
              currentRemoved={this.state.currentRemoved}
              currentAuthor={this.state.currentAuthor}
              currentMsg={this.state.currentMsg}
              currentDate={this.state.currentDate}
              currentCommitHash={this.state.currentCommitHash}
            />

            <Widget
              icon={<button className='bg-transparent border-0 text-primary pt-1 pb-1'><SVG src={IconCalendar}></SVG></button>}
              title={this.config.widget.calendar.title}
              slug={this.config.widget.calendar.slug}
            >
              <DatePicker
                inline
                locale={this.config.lang}
                selected={this.state.currentDateObject}
                onSelect={this.setDate.bind(this)}
                minDate={moment(this.minDate)}
                maxDate={moment(this.maxDate)}
              />
            </Widget>

            <Media query="(max-width: 767px)">
              <div className='mobile-tabs'>
                <button ref='btn' onClick={this.mobileTabView.bind(this,"viewing-about")} className={`${`close-info border-0 text-primary p-3 text-uppercase`} ${mobileTabSelectActive('viewing-about')}`}>About</button>
                <button ref='btn' onClick={this.mobileTabView.bind(this,"viewing-commits")} className={`${`close-info border-0 text-primary p-3 text-uppercase`} ${mobileTabSelectActive('viewing-commits')}`}>Commits</button>
                <button ref='btn' onClick={this.mobileTabView.bind(this,"viewing-calendar")} className={`${`close-info border-0 text-primary p-3 text-uppercase`} ${mobileTabSelectActive('viewing-calendar')}`}>Calendar</button>
              </div>
            </Media>
 

          </Sidebar>
          <Content>
            <div className='controls top'>

              <BrowserRouter>
                {this.closeFullscreenButton()}
              </BrowserRouter>

              <Controls state={this.state} setPlay={this.setPlay.bind(this)} goToPrev={this.goToPrev.bind(this)} >
                {this.slider()}

                <button onClick={this.state.goToNext} className='next border-0 bg-transparent'><SVG src={IconNext}></SVG></button>

                <DatePicker
                  customInput={<Calendar />}
                  locale={this.config.lang}
                  popperPlacement='bottom-end'
                  selected={this.state.currentDateObject}
                  onSelect={this.setDate.bind(this)}
                  minDate={moment(this.minDate)}
                  maxDate={moment(this.maxDate)}
                />
              </Controls>

            </div>

            <Legend config={this.config} />

          </Content>
        </div>
      )
    }
  }

  slider () {
    if (this.state.dateRangeLoaded) {
      return (
        <SliderWithTooltip
          tipFormatter={dateSliderTooltipFormatter}
          min={moment(this.minDate).valueOf()}
          max={moment(this.maxDate).valueOf()}
          onAfterChange={this.setTimestamp.bind(this)}
          onChange={this.onDateSliderChange.bind(this)}
          value={this.state.currentDateObject.valueOf()}
        />
      )
    }
  }

  render () {
    const cls = (this.config.display.showUI) ? 'showing-UI App' : 'App'

    return (
      <div className={`${cls} ${`bsnoclash`}`}>
        <FileInfo
          fileInfoLocation={this.state.fileInfoLocation}
          showFileInfo={this.state.showFileInfo}
          loadingFileInfo={this.state.loadingFileInfo}
          selectedFileAuthorImg={this.state.selectedFileAuthorImg}
          selectedFileAuthorLogin={this.state.selectedFileAuthorLogin}
          selectedFileAuthorName={this.state.selectedFileAuthorName}
          selectedFileDateRelative={this.state.selectedFileDateRelative}
          selectedFilePath={this.state.selectedFilePath}
          selectedFileName={this.state.selectedFileName}
          selectedFileMessage={this.state.selectedFileMessage}
          selectedFileCommitID={this.state.selectedFileCommitID}
          selectedFileCommitURL={this.state.selectedFileCommitURL}
          config={this.config}
        />
        {this.UI()}
        <canvas width={this.config.scene.width} height={this.config.scene.height} id={this.config.scene.canvasID} />
      </div>
    )
  }
}

export default App
