import * as THREE from 'three'

import TextureHelper from '../../TextureHelper'

// shaders
import FragmentShader from './shaders/node.frag'
import VertexShader from './shaders/node.vert'

export default class NodeGeometry {
  constructor () {
    this.textureHelper = new TextureHelper()
    this.sprite = new THREE.TextureLoader().load('textures/matcap.png')
    this.nodeColorPalette = [
      '#168ec0',
      '#54bfed',
      '#8dd9f9',
      '#1746a0',
      '#4372c4',
      '#6f9cef',
      '#623bd6',
      '#8d6dec',
      '#b9a4f3'
    ]
    this.rootColor = new THREE.Color('#eb2256')
    this.dirColor = new THREE.Color('#e37b96')
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
        positionArray[i * 3] = 0
        positionArray[i * 3 + 1] = 0
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

      // colors
      let color
      if (node.t === 'r') {
        color = this.rootColor
      } else if (node.t === 'd') {
        color = this.dirColor
      } else {
        // get file extension
        let extension = node.p.split('.').pop()
        color = this.generateColor(extension)
      }

      colorArray[i * 4] = color.r
      colorArray[i * 4 + 1] = color.g
      colorArray[i * 4 + 2] = color.b
      colorArray[i * 4 + 3] = node.updated ? 1.0 : 0.0
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

    if (!this.material) {
      this.material = new THREE.ShaderMaterial({
        uniforms: {
          map: {
            type: 't',
            value: this.sprite
          },
          decayTime: {
            type: 'f',
            value: null
          },
          positionTexture: {
            type: 't',
            value: null
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
