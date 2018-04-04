import * as THREE from 'three'

import Detector from './libs/Detector'

const detector = new Detector()

const Config = {
  git: {
    owner: 'input-output-hk',
    repo: 'symphony',
    commitHash: null, // hash of commit to load
    commitDate: null, // date to load
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
    autoPlay: true,
    movementQuality: 1, // 1 == high, 0 == low
    delayAmount: 500, // time in between new commits being added to the graph
    sphereProject: 0, // project graph onto sphere? 1 == true, 0 == false
    sphereRadius: 700, // radius of sphere if in sphere projection mode
    showFilePaths: true, // display filepath overlay on nodes
    colorCooldownSpeed: 0.05 // speed at which node colors cycle
  },
  scene: {
    bgColor: 0x121327,
    antialias: true,
    canvasID: 'stage', // ID of wegbl canvas element
    autoRotate: true, // auto rotate camera around target
    autoRotateSpeed: 0.3 // speed of auto rotation
  },
  camera: {
    fov: 60,
    initPos: {x: 0, y: 0, z: 800}
  },
  floatType: detector.isIOS ? THREE.HalfFloatType : THREE.FloatType
}

export default Config
