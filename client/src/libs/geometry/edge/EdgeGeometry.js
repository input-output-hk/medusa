import * as THREE from 'three'

// shaders
import FragmentShader from './shaders/edge.frag'
import VertexShader from './shaders/edge.vert'

export default class EdgeGeometry {
  constructor () {
    this.material = null
    this.geometry = null
    this.baseColor = new THREE.Color('#eb2256')
  }

  setUpdated (nodeData, nodeCount, uArray, edgeData) {
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
          uArray[i * 2 + 0] += 0.01
        }
      }

      if (node2 && node2.u) {
        uArray[i * 2 + 1] = 0.0
      } else {
        if (uArray[i * 2 + 1] < 2.0) {
          uArray[i * 2 + 1] += 0.01
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

    let position = new THREE.BufferAttribute(new Float32Array((edgeCount * 2) * 3), 3)
    let texLocation = new THREE.BufferAttribute(forceArray, 2)
    let updated = new THREE.BufferAttribute(updatedArray, 1)

    this.geometry.addAttribute('position', position)
    this.geometry.addAttribute('texLocation', texLocation)
    this.geometry.addAttribute('updated', updated)

    if (!this.material) {
      this.material = new THREE.ShaderMaterial({
        uniforms: {
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
}
