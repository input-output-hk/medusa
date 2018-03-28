import * as THREE from 'three'

import Detector from './libs/Detector'

const detector = new Detector()

const Config = {
  git: {
    owner: 'input-output-hk',
    repo: 'cardano-sl'
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
    delayAmount: 500 // time in between new commits being added to the graph
  },
  scene: {
    bgColor: 0x121327,
    fogDensity: 0.00030,
    antialias: true
  },
  camera: {
    fov: 60
  },
  floatType: detector.isIOS ? THREE.HalfFloatType : THREE.FloatType
}

export default Config
