import * as THREE from 'three'

// shaders
import FragmentShader from './shaders/edge.frag'
import VertexShader from './shaders/edge.vert'

export default class EdgeGeometry {
  constructor (config) {
    this.config = config
    this.material = null
    this.geometry = null
  }

  setUpdated (nodeData, nodeCount, uArray, edgeData) {
    if (!this.config.FDG.cycleColors) {
      return
    }

    for (let i = 0; i < (nodeCount * 2); i += 2) {
      let node1 = nodeData[edgeData[i]]
      let node2 = nodeData[edgeData[i + 1]]

      if (!node1) {
        uArray[i * 2 + 0] = 0.0
      }
      if (!node2) {
        uArray[i * 2 + 1] = 0.0
      }

      if (node1 && node1.u) {
        uArray[i * 2 + 0] = 0.0
      } else {
        if (uArray[i * 2 + 0] < 2.0) {
          uArray[i * 2 + 0] += this.config.FDG.colorCooldownSpeed
        }
      }

      if (node2 && node2.u) {
        uArray[i * 2 + 1] = 0.0
      } else {
        if (uArray[i * 2 + 1] < 2.0) {
          uArray[i * 2 + 1] += this.config.FDG.colorCooldownSpeed
        }
      }
    }
  }

  create (edgeCount, forceArray, nodeData, nodeCount, edgeData) {
    if (this.geometry) {
      this.geometry.dispose()
    }

    this.geometry = new THREE.BufferGeometry()

    let updatedArray = new Float32Array(edgeCount * 2)
    this.setUpdated(nodeData, nodeCount, updatedArray, edgeData)
    let updated = new THREE.BufferAttribute(updatedArray, 1)
    this.geometry.addAttribute('updated', updated)

    let texLocation = new THREE.BufferAttribute(forceArray, 2)
    this.geometry.addAttribute('texLocation', texLocation)

    let position = new THREE.BufferAttribute(new Float32Array((edgeCount * 2) * 3), 3)
    this.geometry.addAttribute('position', position)

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
          positionTexture: {
            type: 't',
            value: null
          }
        },
        transparent: true,
        depthWrite: true,
        depthTest: true,
        vertexShader: VertexShader,
        fragmentShader: FragmentShader
      })
    }

    this.edges = new THREE.LineSegments(this.geometry, this.material)

    return this.edges
  }

  update (camera) {
    let camPos = camera.getWorldPosition()
    const center = new THREE.Vector3(0.0, 0.0, 0.0)
    this.material.uniforms.camDistToCenter.value = camPos.distanceTo(center)
  }
}
