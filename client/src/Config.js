import * as THREE from 'three'

import Detector from './libs/Detector'

const detector = new Detector()

const Config = {
  git: {
    owner: 'input-output-hk',
    repo: 'cardano-sl',
    commitHash: '', // hash of commit to load
    commitDate: '', // date to load
    loadLatest: true // load latest commit in db
  },
  display: {
    showUI: false
  },
  fireBase: {
    apiKey: 'AIzaSyA9_GvRguuv5zZLdV0-bVnVfA0FEGWy4gA',
    authDomain: 'gource-774ad.firebaseapp.com',
    databaseURL: 'https://gource-774ad.firebaseio.com',
    projectId: 'gource-774ad',
    storageBucket: 'gource-774ad.appspot.com',
    messagingSenderId: '290917146601'
  },
  FDG: {
    nodeSpritePath: 'textures/dot.png', // path to node texture
    nodeSpritePathBlur: 'textures/dot-blur.png', // path to blur node texture
    nodeUpdatedSpritePath: 'textures/dot-concentric.png', // path to node updated state texture
    fontTexturePath: 'textures/UbuntuMono.png', // path to font texture
    nodeCount: 4096, // max number of nodes the scene can contain
    autoPlay: true,
    delayAmount: 500, // time in between new commits being added to the graph
    sphereProject: 0, // project graph onto sphere? 1 == true, 0 == false
    sphereRadius: 700, // radius of sphere if in sphere projection mode
    showFilePaths: true, // display filepath overlay on nodes
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
    vignette: true
  },
  camera: {
    fov: 60,
    initPos: {x: 0, y: 0, z: 800}
  },
  floatType: detector.isIOS ? THREE.HalfFloatType : THREE.FloatType
}

export default Config
