import * as THREE from 'three'

import TextureHelper from './TextureHelper'
import NodeGeometry from './geometry/node/NodeGeometry'
import EdgeGeometry from './geometry/edge/EdgeGeometry'
import TextGeometry from './geometry/text/TextGeometry'

import PullVert from '../shaders/pull.vert'
import PushVert from '../shaders/push.vert'
import ForceFrag from '../shaders/force.frag'
import PositionFrag from '../shaders/position.frag'
import PassThroughVert from '../shaders/passThrough.vert'
import PassThroughFrag from '../shaders/passThrough.frag'

/**
 * GPGPU Force Directed Graph Simulation
 */
export default class FDG {
  constructor (renderer, scene, config) {
    this.renderer = renderer
    this.scene = scene
    this.config = config
    this.frame = 0
    this.textureHelper = new TextureHelper()
    this.nodeGeometry = new NodeGeometry(this.config)
    this.edgeGeometry = new EdgeGeometry(this.config)
    this.textGeometry = new TextGeometry(this.config)
    this.firstRun = true
    this.textureWidth = 0
    this.textureHeight = 0
    this.enabled = false
    this.storedPositions = new Float32Array()
    this.positionMaterial = null
    this.nodes = null
    this.edges = null
    this.forceMaterial = null
    this.pullGeometry = null
    this.pushGeometry = null
    this.text = null
    this.newNodes = []
    this.active = false

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
    this.nodeCount = nodeCount

    this.active = true

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
        type: this.config.floatType,
        depthWrite: false,
        depthBuffer: false,
        stencilBuffer: false
      })

      this.positionRenderTarget2 = this.positionRenderTarget1.clone()
      this.pullRenderTarget = this.positionRenderTarget1.clone()
      this.pushRenderTarget = this.positionRenderTarget1.clone()

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

  /**
   * Force reload of the scene if config settings have changed
   */
  triggerUpdate () {
    this.refresh()
    this.init({
      nodeData: this.nodeData,
      edgeData: this.edgeData,
      nodeCount: this.nodeCount
    })
  }

  setTextureDimensions () {
    this.textureHelper.setTextureSize(this.nodeCount)
    this.textureWidth = this.textureHelper.textureWidth
    this.textureHeight = this.textureHelper.textureHeight
  }

  setFirstRun (firstRun) {
    this.firstRun = firstRun
  }

  calculatePositions () {
    this.frame++

    this.positionMaterial.uniforms.sphereProject.value = this.config.FDG.sphereProject
    this.positionMaterial.uniforms.sphereRadius.value = this.config.FDG.sphereRadius

    // update forces
    let inputForceRenderTarget = this.positionRenderTarget1
    if (this.frame % 2 === 0) {
      inputForceRenderTarget = this.positionRenderTarget2
    }

    this.pullMaterial.uniforms.positionTexture.value = inputForceRenderTarget.texture
    this.pushMaterial.uniforms.positionTexture.value = inputForceRenderTarget.texture

    // update positions
    let inputPositionRenderTarget = this.positionRenderTarget1
    this.outputPositionRenderTarget = this.positionRenderTarget2
    if (this.frame % 2 === 0) {
      inputPositionRenderTarget = this.positionRenderTarget2
      this.outputPositionRenderTarget = this.positionRenderTarget1
    }
    this.positionMaterial.uniforms.positionTexture.value = inputPositionRenderTarget.texture

    // pull
    this.renderer.render(this.pullScene, this.quadCamera, this.pullRenderTarget, false)
    this.positionMaterial.uniforms.pullTexture.value = this.pullRenderTarget.texture

    // push
    this.renderer.render(this.pushScene, this.quadCamera, this.pushRenderTarget, false)
    this.positionMaterial.uniforms.pushTexture.value = this.pushRenderTarget.texture

    // position
    this.renderer.render(this.positionScene, this.quadCamera, this.outputPositionRenderTarget)

    this.nodes.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture
    this.edges.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture

    if (this.config.FDG.showFilePaths) {
      this.text.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture
    }
  }

  update () {
    if (this.enabled) {
      this.calculatePositions()

      // update nodes
      this.nodeGeometry.update()
    }
  }

  resize () {
    this.nodeGeometry.resize()
  }

  initEdges () {
    this.setForceTextureLocations()
    if (this.firstRun) {
      this.edges = this.edgeGeometry.create(this.nodeCount * 2, this.pullGeometry.attributes.texLocation.array, this.nodeData, this.nodeCount, this.edgeData)
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
    if (!this.config.FDG.showFilePaths) {
      if (this.text) {
        this.scene.remove(this.text)
      }
      return
    }

    if (!this.text) {
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

  setPositionTextureLocations () {
    this.texLocationWidth = Object.keys(this.nodeData).length
    this.texLocationHeight = 1.0

    let dataArr = new Float32Array(this.texLocationWidth * this.texLocationHeight * 2)

    for (let i = 0; i < Object.keys(this.nodeData).length; i++) {
      let nodeTextureLocation = this.textureHelper.getNodeTextureLocation(i)
      dataArr[i * 2 + 0] = nodeTextureLocation.x
      dataArr[i * 2 + 1] = nodeTextureLocation.y
    }

    let texLocation = new THREE.DataTexture(dataArr, this.texLocationWidth, this.texLocationHeight, THREE.LuminanceAlphaFormat, THREE.FloatType)

    texLocation.needsUpdate = true
    texLocation.minFilter = THREE.NearestFilter
    texLocation.magFilter = THREE.NearestFilter
    texLocation.generateMipmaps = false
    texLocation.flipY = false

    return texLocation
  }

  initPositions () {
    let texLocation = this.setPositionTextureLocations()

    if (!this.positionMaterial) {
      this.positionMaterial = new THREE.ShaderMaterial({
        uniforms: {
          texLocation: {
            type: 't',
            value: texLocation
          },
          positionTexture: {
            type: 't',
            value: null
          },
          pullTexture: {
            type: 't',
            value: null
          },
          pushTexture: {
            type: 't',
            value: null
          },
          sphereProject: {
            type: 'f',
            value: 0.0
          },
          sphereRadius: {
            type: 'f',
            value: 0.0
          }
        },
        defines: {
          texLocationWidth: 1.0 / this.texLocationWidth.toFixed(2),
          width: 1.0 / this.textureWidth.toFixed(2),
          height: 1.0 / this.textureHeight.toFixed(2)
        },
        vertexShader: PassThroughVert,
        fragmentShader: PositionFrag
      })

      this.positionScene = new THREE.Scene()

      this.positionMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.positionMaterial)
      this.positionScene.add(this.positionMesh)
    } else {
      this.positionMesh.material.uniforms.texLocation.value = texLocation
      this.positionMesh.material.defines = {
        width: 1.0 / this.textureWidth.toFixed(2),
        height: 1.0 / this.textureHeight.toFixed(2),
        texLocationWidth: 1.0 / this.texLocationWidth.toFixed(2)
      }
      this.positionMesh.material.needsUpdate = true
    }
  }

  initForces () {
    if (this.firstRun) {
      // pull
      this.pullGeometry = new THREE.BufferGeometry()
      let pullPosition = new THREE.BufferAttribute(new Float32Array((this.nodeCount * 2) * 3), 3)
      let texLocation = new THREE.BufferAttribute(new Float32Array((this.nodeCount * 2) * 4), 4)

      this.pullGeometry.addAttribute('position', pullPosition)
      this.pullGeometry.addAttribute('texLocation', texLocation)

      this.pullMaterial = new THREE.ShaderMaterial({
        uniforms: {
          positionTexture: {
            type: 't',
            value: null
          }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        vertexShader: PullVert,
        fragmentShader: ForceFrag
      })
      this.pullScene = new THREE.Scene()
      this.pullMesh = new THREE.Points(this.pullGeometry, this.pullMaterial)
      this.pullScene.add(this.pullMesh)

      // push
      this.pushGeometry = new THREE.BufferGeometry()
      let pushPosition = new THREE.BufferAttribute(new Float32Array((this.nodeCount * 2) * 3), 3)

      this.pushGeometry.addAttribute('position', pushPosition)
      this.pushGeometry.addAttribute('texLocation', texLocation)

      this.pushMaterial = new THREE.ShaderMaterial({
        uniforms: {
          positionTexture: {
            type: 't',
            value: null
          }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        vertexShader: PushVert,
        fragmentShader: ForceFrag
      })
      this.pushScene = new THREE.Scene()
      this.pushMesh = new THREE.Points(this.pushGeometry, this.pushMaterial)
      this.pushScene.add(this.pushMesh)
    }

    this.pullGeometry.attributes.position.needsUpdate = true
    this.pullGeometry.attributes.texLocation.needsUpdate = true
    this.pushGeometry.attributes.position.needsUpdate = true
    this.pushGeometry.attributes.texLocation.needsUpdate = true
  }

  /**
   * Get coords of nodes in position texture and set in attribute of
   * push and pull geometry so we can look these up in the shader
   */
  setForceTextureLocations () {
    let texLocationAttribute = this.pullGeometry.attributes.texLocation.array
    for (let i = 0; i < this.nodeCount * 2 * 4; i += 2) {
      let startVertexTextureLocation = {
        x: 0,
        y: 0
      }
      let endVertexTextureLocation = {
        x: 0,
        y: 0
      }

      if (typeof this.edgeData[i] !== 'undefined') {
        startVertexTextureLocation = this.textureHelper.getNodeTextureLocation(this.edgeData[i])
      }
      if (typeof this.edgeData[i + 1] !== 'undefined') {
        endVertexTextureLocation = this.textureHelper.getNodeTextureLocation(this.edgeData[i + 1])
      }

      texLocationAttribute[i * 4 + 0] = startVertexTextureLocation.x
      texLocationAttribute[i * 4 + 1] = startVertexTextureLocation.y

      texLocationAttribute[i * 4 + 2] = endVertexTextureLocation.x
      texLocationAttribute[i * 4 + 3] = endVertexTextureLocation.y
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
