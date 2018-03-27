import * as THREE from 'three'

import TextureHelper from './TextureHelper'
import NodeGeometry from './geometry/node/NodeGeometry'
import EdgeGeometry from './geometry/edge/EdgeGeometry'
import TextGeometry from './geometry/text/TextGeometry'

import FDGVert from '../shaders/fdg.vert'
import FDGFrag from '../shaders/fdg.frag'
import PositionFrag from '../shaders/position.frag'
import PassThroughVert from '../shaders/passThrough.vert'
import PassThroughFrag from '../shaders/passThrough.frag'

import Config from '../Config'

/**
 * GPGPU Force Directed Graph Simulation
 */
export default class FDG {
  constructor (renderer, scene) {
    this.renderer = renderer
    this.scene = scene
    this.frame = 0
    this.textureHelper = new TextureHelper()
    this.nodeGeometry = new NodeGeometry()
    this.edgeGeometry = new EdgeGeometry()
    this.textGeometry = new TextGeometry()
    this.firstRun = true
    this.textureWidth = 0
    this.textureHeight = 0
    this.enabled = false
    this.storedPositions = new Float32Array()
    this.positionMaterial = null
    this.nodes = null
    this.edges = null
    this.forceMaterial = null
    this.forceGeometry = null

    this.initCamera()
  }

  initCamera () {
    this.quadCamera = new THREE.OrthographicCamera()
    this.quadCamera.position.z = 1
  }

  /**
   * Grab data from position texture
   */
  storePositions () {
    this.storedPositions = new Float32Array(this.textureWidth * this.textureHeight * 4)

    this.renderer.readRenderTargetPixels(
      this.outputPositionRenderTarget,
      0,
      0,
      this.textureWidth,
      this.textureHeight,
      this.storedPositions
    )

    this.storedPositions = this.storedPositions.slice(0, this.nodeCount * 4)
  }

  refresh () {
    this.nodeGeometry.setDecayTime(0.0)
  }

  init ({
    nodeData,
    edgeData,
    nodeCount
  } = {}) {
    this.nodeData = nodeData
    this.edgeData = edgeData
    this.nodeCount = 4096

    if (this.firstRun) {
      this.initPassThrough()
    }

    this.setTextureDimensions()

    if (this.firstRun) {
      this.positionRenderTarget1 = new THREE.WebGLRenderTarget(this.textureWidth, this.textureHeight, {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: Config.floatType,
        depthWrite: false,
        depthBuffer: false,
        stencilBuffer: false
      })

      this.positionRenderTarget2 = this.positionRenderTarget1.clone()
      this.forceRenderTarget = this.positionRenderTarget1.clone()

      this.outputPositionRenderTarget = this.positionRenderTarget1
    }

    if (this.firstRun) {
      this.passThroughTexture(
        this.textureHelper.createPositionTexture({storedPositions: this.storedPositions}),
        this.positionRenderTarget1
      )
      this.passThroughTexture(this.positionRenderTarget1.texture, this.positionRenderTarget2)
    }

    this.initForces()
    this.initPositions()
    this.initEdges()
    this.initNodes()
    this.initText()

    this.setEnabled(true)
  }

  setEnabled () {
    this.enabled = true
  }

  setTextureDimensions () {
    this.textureHelper.setTextureSize(this.nodeCount)
    this.textureWidth = this.textureHelper.textureWidth
    this.textureHeight = this.textureHelper.textureHeight
  }

  setFirstRun (firstRun) {
    this.firstRun = firstRun
  }

  update () {
    if (this.enabled) {
      this.frame++

      // update forces
      let inputForceRenderTarget = this.positionRenderTarget1
      if (this.frame % 2 === 0) {
        inputForceRenderTarget = this.positionRenderTarget2
      }
      this.forceMaterial.uniforms.positionTexture.value = inputForceRenderTarget.texture
      this.forceMaterial.uniforms.pull.value = 1
      this.renderer.render(this.forceScene, this.quadCamera, this.forceRenderTarget, false)
      this.renderer.autoClear = false
      this.forceMaterial.uniforms.pull.value = 0
      this.renderer.render(this.forceScene, this.quadCamera, this.forceRenderTarget, false)
      this.renderer.autoClear = true

      // update positions
      let inputPositionRenderTarget = this.positionRenderTarget1
      this.outputPositionRenderTarget = this.positionRenderTarget2
      if (this.frame % 2 === 0) {
        inputPositionRenderTarget = this.positionRenderTarget2
        this.outputPositionRenderTarget = this.positionRenderTarget1
      }
      this.positionMaterial.uniforms.positionTexture.value = inputPositionRenderTarget.texture
      this.positionMaterial.uniforms.forcesTexture.value = this.forceRenderTarget.texture
      this.renderer.render(this.positionScene, this.quadCamera, this.outputPositionRenderTarget)

      this.nodes.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture
      this.edges.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture

      this.text.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture

      // update nodes
      this.nodeGeometry.update()
    }
  }

  initEdges () {
    this.setEdgeTextureLocations()
    if (this.firstRun) {
      this.edges = this.edgeGeometry.create(this.nodeCount * 2, this.forceGeometry.attributes.location.array, this.nodeData, this.nodeCount, this.edgeData)
      this.scene.add(this.edges)
    } else {
      this.edgeGeometry.setUpdated(this.nodeData, this.nodeCount, this.edges.geometry.attributes.updated.array, this.edgeData)
      this.edges.geometry.attributes.position.needsUpdate = true
      this.edges.geometry.attributes.texLocation.needsUpdate = true
      this.edges.geometry.attributes.updated.needsUpdate = true
    }
  }

  initNodes () {
    if (this.firstRun) {
      this.nodes = this.nodeGeometry.create(this.nodeData, this.nodeCount)
      this.scene.add(this.nodes)
    } else {
      this.nodeGeometry.setTextureLocations(
        this.nodeData,
        this.nodeCount,
        this.nodes.geometry.attributes.position.array,
        this.nodes.geometry.attributes.color.array
      )
      this.nodes.geometry.attributes.position.needsUpdate = true
      this.nodes.geometry.attributes.color.needsUpdate = true
    }
  }

  initText () {
    if (this.firstRun) {
      this.text = this.textGeometry.create(this.nodeData, this.nodeCount)
      this.scene.add(this.text)
    } else {
      this.textGeometry.setAttributes(
        this.nodeData,
        this.text.geometry.attributes.labelPositions.array,
        this.text.geometry.attributes.textCoord.array,
        this.text.geometry.attributes.textureLocation.array,
        this.text.geometry.attributes.scale.array
      )
      this.text.geometry.attributes.labelPositions.needsUpdate = true
      this.text.geometry.attributes.textCoord.needsUpdate = true
      this.text.geometry.attributes.textureLocation.needsUpdate = true
      this.text.geometry.attributes.scale.needsUpdate = true
    }
  }

  passThroughTexture (input, output) {
    this.passThroughMaterial.uniforms.texture.value = input
    this.renderer.render(this.passThroughScene, this.quadCamera, output)
  }

  initPositions () {
    if (!this.positionMaterial) {
      this.positionMaterial = new THREE.ShaderMaterial({
        uniforms: {
          positionTexture: {
            type: 't',
            value: null
          },
          forcesTexture: {
            type: 't',
            value: null
          }
        },
        defines: {
          textureWidth: this.textureWidth.toFixed(2),
          textureHeight: this.textureHeight.toFixed(2)
        },
        vertexShader: PassThroughVert,
        fragmentShader: PositionFrag
      })

      this.positionScene = new THREE.Scene()

      this.positionMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.positionMaterial)
      this.positionScene.add(this.positionMesh)
    }
  }

  initForces () {
    if (this.firstRun) {
      this.forceGeometry = new THREE.BufferGeometry()
      let position = new THREE.BufferAttribute(new Float32Array((this.nodeCount * 2) * 3), 3)
      let location = new THREE.BufferAttribute(new Float32Array((this.nodeCount * 2) * 4), 4)

      this.forceGeometry.addAttribute('position', position)
      this.forceGeometry.addAttribute('location', location)

      this.forceMaterial = new THREE.ShaderMaterial({
        uniforms: {
          pull: {
            type: 'i',
            value: 1
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
        vertexShader: FDGVert,
        fragmentShader: FDGFrag
      })
      this.forceScene = new THREE.Scene()
      this.forceMesh = new THREE.Points(this.forceGeometry, this.forceMaterial)
      this.forceScene.add(this.forceMesh)
    } else {
      this.forceGeometry.attributes.position.needsUpdate = true
      this.forceGeometry.attributes.location.needsUpdate = true
    }
  }

  /**
   * Get coords of nodes in position texture and set in attribute of
   * forceGeometry so we can look these up in the shader
   */
  setEdgeTextureLocations () {
    let locationAttribute = this.forceGeometry.attributes.location.array

    for (let i = 0; i < (this.nodeCount * 2); i += 2) {
      let startVertexTextureLocation = this.textureHelper.getNodeTextureLocation(this.edgeData[i])
      locationAttribute[i * 4 + 0] = startVertexTextureLocation.x
      locationAttribute[i * 4 + 1] = startVertexTextureLocation.y

      let endVertexTextureLocation = this.textureHelper.getNodeTextureLocation(this.edgeData[i + 1])
      locationAttribute[i * 4 + 2] = endVertexTextureLocation.x
      locationAttribute[i * 4 + 3] = endVertexTextureLocation.y
    }
  }

  initPassThrough () {
    this.passThroughScene = new THREE.Scene()
    this.passThroughMaterial = new THREE.ShaderMaterial({
      uniforms: {
        texture: {
          type: 't',
          value: null
        }
      },
      vertexShader: PassThroughVert,
      fragmentShader: PassThroughFrag
    })
    let mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.passThroughMaterial)
    this.passThroughScene.add(mesh)
  }
}
