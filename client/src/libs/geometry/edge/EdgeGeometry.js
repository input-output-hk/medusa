import * as THREE from 'three'

// shaders
import FragmentShader from './shaders/edge.frag'
import VertexShader from './shaders/edge.vert'

export default class EdgeGeometry {
  constructor () {
    this.material = null
    this.geometry = null
  }

  create (edgeCount, forceArray) {
    if (this.geometry) {
      this.geometry.dispose()
    }

    this.geometry = new THREE.BufferGeometry()

    let position = new THREE.BufferAttribute(new Float32Array((edgeCount * 2) * 3), 3)
    let color = new THREE.BufferAttribute(forceArray, 2)

    this.geometry.addAttribute('position', position)
    this.geometry.addAttribute('color', color)

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
