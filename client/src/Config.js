import {
  HalfFloatType,
  FloatType
} from './vendor/three/Three'

import Detector from './libs/Detector'

const detector = new Detector()

const Config = {
  git: {
    owner: 'input-output-hk',
    repo: 'cardano-sl',
    branch: 'develop',
    commitHash: '', // hash of commit to load
    commitDate: '', // date to load
    loadLatest: true, // load latest commit in db
    supportedRepos: ['cardano-sl', 'plutus', 'ouroboros-network']
  },
  display: {
    showUI: true,
    showSidebar: true,
    sidebarCommitLimit: 5,
    showClose: true
  },
  client: {
    url: ''
  },
  widget: {
    head: {
      title: 'MEDUSA',
      subtitle: 'Github project activity',
      slug: 'head',
      content: 'Introduction'
    },
    about: {
      title: 'About',
      slug: 'about',
      content: 'Custom about content'
    },
    commitList: {
      title: 'Commit List',
      slug: 'commit-list'
    },
    milestones: {
      title: 'Milestones',
      slug: 'milestones',
      content: ''
    },
    calendar: {
      title: 'Calendar',
      slug: 'calendar'
    }
  },
  legend: {
    committed: {
      title: 'Committed file',
      icon: ''
    },
    updated: {
      title: 'Updated file',
      icon: ''
    },
    cold: {
      title: 'Cold file',
      icon: ''
    }
  },
  fireBase: {
    apiKey: 'AIzaSyCwfdzrjQ5GRqyz-napBM29T7Zel_6KIUY',
    authDomain: 'webgl-gource-1da99.firebaseapp.com',
    databaseURL: 'https://webgl-gource-1da99.firebaseio.com',
    projectId: 'webgl-gource-1da99',
    storageBucket: 'webgl-gource-1da99.appspot.com',
    messagingSenderId: '532264380396',
    useChangesDB: true, // in play mode only load in data which has changed
    useIndexedDB: false // enable firebase indexedDB (currently this seems buggy)
  },
  FDG: {
    nodeCount: 3000, // max number of nodes the scene can contain
    autoPlay: true,
    delayAmount: 1000, // time in between new commits being added to the graph
    sphereProject: 0, // project graph onto sphere? 1 == true, 0 == false
    sphereRadius: 700, // radius of sphere if in sphere projection mode
    showFilePaths: true, // display filepath overlay on nodes
    usePicker: false, // show file commit details on click
    colorCooldownSpeed: 0.05, // speed at which node colors cycle
    filePathCharLimit: 20, // speed at which node colors cycle
    cycleColors: false, // cycle colors based on file edit time from red to blue to white
    colorPalette: [ // colors to use if cycleColors is switched off
      /* '#eb2256',
      '#f69ab3',
      '#1746a0',
      '#6f9cef',
      '#652b91',
      '#0e5c8d',
      '#1fc1c3' */
    ]
  },
  scene: {
    fullScreen: false,
    width: 800,
    height: 600,
    bgColor: 0x121327,
    antialias: false,
    canvasID: 'stage', // ID of wegbl canvas element
    autoRotate: true, // auto rotate camera around target
    autoRotateSpeed: 0.3 // speed of auto rotation
  },
  post: {
    vignette: true,
    bloom: true // post-processing bloom effect
  },
  camera: {
    fov: 60,
    initPos: { x: 0, y: 0, z: 800 },
    zPosMinimized: 1600,
    enableZoom: true // enable camera zoom on mousewheel/pinch gesture
  },
  dev: {
    debugPicker: false
  },
  floatType: detector.isIOS ? HalfFloatType : FloatType
}

export default Config
