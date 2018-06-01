import * as THREE from 'three'

import TextureHelper from '../../TextureHelper'

// shaders
import FragmentShader from './shaders/node.frag'
import VertexShader from './shaders/node.vert'

export default class NodeGeometry {
  constructor (config) {
    this.config = config
    this.textureHelper = new TextureHelper()
    this.sprite = new THREE.TextureLoader().load(this.config.FDG.nodeSpritePath)
    this.spriteBlur = new THREE.TextureLoader().load(this.config.FDG.nodeSpritePathBlur)
    this.uSprite = new THREE.TextureLoader().load(this.config.FDG.nodeUpdatedSpritePath)
    this.decayTime = 0.0
    this.material = null
    this.geometry = null
    this.baseScale = 50000

    for (let index = 0; index < this.config.FDG.colorPalette.length; index++) {
      this.config.FDG.colorPalette[index] = new THREE.Color(this.config.FDG.colorPalette[index])
    }
    this.baseColor = this.config.FDG.colorPalette[0]
  }

  setTextureLocations (nodeData, nodeCount, positionArray, colorArray) {
    for (let i = 0; i < nodeCount; i++) {
      const node = nodeData[i]

      if (!node) {
        positionArray[i * 3] = 99999
        positionArray[i * 3 + 1] = 99999
        colorArray[i * 4] = 0
        colorArray[i * 4 + 1] = 0
        colorArray[i * 4 + 2] = 0
        colorArray[i * 4 + 3] = 0
        continue
      }

      // texture locations
      let textureLocation = this.textureHelper.getNodeTextureLocation(i)
      positionArray[i * 3] = textureLocation.x
      positionArray[i * 3 + 1] = textureLocation.y

      if (this.config.FDG.cycleColors) {
        colorArray[i * 4] = this.baseColor.r
        colorArray[i * 4 + 1] = this.baseColor.g
        colorArray[i * 4 + 2] = this.baseColor.b
      } else {
        // get color for parent directory
        if (node.p === '/') {
          colorArray[i * 4] = this.baseColor.r
          colorArray[i * 4 + 1] = this.baseColor.g
          colorArray[i * 4 + 2] = this.baseColor.b
          colorArray[i * 4 + 3] = 1
          continue
        }

        let dirArray = node.p.split('/')

        if (node.t === 'f' && dirArray.length === 1) {
          colorArray[i * 4] = this.baseColor.r
          colorArray[i * 4 + 1] = this.baseColor.g
          colorArray[i * 4 + 2] = this.baseColor.b
          colorArray[i * 4 + 3] = 1
          continue
        }

        let dir
        if (node.t === 'd') {
          dir = dirArray[dirArray.length - 1]
        } else {
          dir = dirArray[dirArray.length - 2]
        }

        if (typeof dir === 'undefined') {
          dir = dirArray[0]
        }

        let dirNumber = 0
        for (let charIndex = 0; charIndex < dir.length; charIndex++) {
          dirNumber += dir[charIndex].charCodeAt(0)
        }

        let dirIdentifier = dirNumber % (this.config.FDG.colorPalette.length - 1)

        let nodeColor = this.config.FDG.colorPalette[dirIdentifier]

        colorArray[i * 4 + 0] = nodeColor.r
        colorArray[i * 4 + 1] = nodeColor.g
        colorArray[i * 4 + 2] = nodeColor.b
      }

      // store time since last update in alpha channel
      if (node.u) {
        colorArray[i * 4 + 3] = 0.0
      } else {
        colorArray[i * 4 + 3] += this.config.FDG.colorCooldownSpeed
      }
    }
  }

  create (nodeData, nodeCount) {
    this.textureHelper.setTextureSize(nodeCount)

    if (this.geometry) {
      this.geometry.dispose()
    }

    this.geometry = new THREE.BufferGeometry()

    let positionArray = new Float32Array(nodeCount * 3)
    let colorArray = new Float32Array(nodeCount * 4)

    this.setTextureLocations(nodeData, nodeCount, positionArray, colorArray)

    let position = new THREE.BufferAttribute(positionArray, 3)
    let color = new THREE.BufferAttribute(colorArray, 4)

    this.geometry.addAttribute('position', position)
    this.geometry.addAttribute('color', color)

    let idArray = new Float32Array(nodeCount)
    for (let index = 0; index < idArray.length; index++) {
      idArray[index] = index
    }
    let id = new THREE.BufferAttribute(idArray, 1)
    this.geometry.addAttribute('id', id)

    if (!this.material) {
      this.material = new THREE.ShaderMaterial({
        uniforms: {
          camDistToCenter: {
            type: 'f',
            value: null
          },
          cycleColors: {
            type: 'f',
            value: this.config.cycleColors ? 1.0 : 0.0
          },
          map: {
            type: 't',
            value: this.sprite
          },
          mapBlur: {
            type: 't',
            value: this.spriteBlur
          },
          uMap: {
            type: 't',
            value: this.uSprite
          },
          decayTime: {
            type: 'f',
            value: null
          },
          uTime: {
            type: 'f',
            value: null
          },
          positionTexture: {
            type: 't',
            value: null
          },
          scale: {
            type: 'f',
            value: this.baseScale
          }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        vertexShader: VertexShader,
        fragmentShader: FragmentShader
      })
    }

    this.resize()

    this.nodes = new THREE.Points(this.geometry, this.material)
    return this.nodes
  }

  setDecayTime (time) {
    this.decayTime = time
  }

  resize () {
    if (this.material) {
      this.material.uniforms.scale.value = this.baseScale * (Math.min(this.config.scene.width, this.config.scene.height) * 0.001)
    }
  }

  update (camera, frame) {
    this.decayTime++
    this.material.uniforms.decayTime.value = this.decayTime
    this.material.uniforms.uTime.value = frame

    let camPos = camera.getWorldPosition(new THREE.Vector3())
    const center = new THREE.Vector3(0.0, 0.0, 0.0)
    this.material.uniforms.camDistToCenter.value = camPos.distanceTo(center)
  }
}
