import * as THREE from 'three'

import TextureHelper from '../../TextureHelper'

// shaders
import FragmentShader from './shaders/node.frag'
import VertexShader from './shaders/node.vert'

export default class NodeGeometry {
  constructor () {
    this.textureHelper = new TextureHelper()
    this.sprite = new THREE.TextureLoader().load('textures/dot.png')
    this.uSprite = new THREE.TextureLoader().load('textures/dot-concentric.png')
    this.baseColor = new THREE.Color('#eb2256')
    this.decayTime = 0.0
    this.material = null
    this.geometry = null
  }

  generateColor (extension) {
    let total = 0
    for (let index = 0; index < extension.length; index++) {
      total += extension[index].charCodeAt(0)
    }
    let colorIndex = total % this.nodeColorPalette.length
    let color = this.nodeColorPalette[colorIndex]
    return new THREE.Color(color)
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

      colorArray[i * 4] = this.baseColor.r
      colorArray[i * 4 + 1] = this.baseColor.g
      colorArray[i * 4 + 2] = this.baseColor.b

      // store time since last update in alpha channel
      if (node.u) {
        colorArray[i * 4 + 3] = 0.0
      } else {
        colorArray[i * 4 + 3] += 0.01
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
          map: {
            type: 't',
            value: this.sprite
          },
          uMap: {
            type: 't',
            value: this.uSprite
          },
          decayTime: {
            type: 'f',
            value: null
          },
          positionTexture: {
            type: 't',
            value: null
          },
          scale: {
            type: 'f',
            value: 2000
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

    this.nodes = new THREE.Points(this.geometry, this.material)
    return this.nodes
  }

  setDecayTime (time) {
    this.decayTime = time
  }

  update () {
    this.decayTime++
    this.material.uniforms.decayTime.value = this.decayTime
  }
}
