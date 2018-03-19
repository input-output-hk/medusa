import * as THREE from 'three'

export default class TextureHelper {
  setNodeCount (nodeCount) {
    this.nodeCount = nodeCount
  }

  setTextureSize (nodeCount) {
    this.setNodeCount(nodeCount)

    let width = 1
    let height = 1

    while (height * width < this.nodeCount) {
      width *= 2
      if (height * width >= this.nodeCount) {
        break
      }
      height *= 2
    }

    this.textureWidth = width
    this.textureHeight = height
  }

  getNodeTextureLocation (nodeID) {
    return {
      x: (nodeID % this.textureWidth) * (1 / this.textureWidth) + (1 / (this.textureWidth * 2)),
      y: Math.floor(nodeID / this.textureWidth) * (1 / this.textureHeight) + (1 / (this.textureHeight * 2))
    }
  }

  createPositionTexture ({
    storedPositions = new Float32Array()
  } = {}) {
    let textureArray = new Float32Array(this.textureWidth * this.textureHeight * 4)
    for (let i = 0; i < this.nodeCount; i++) {
      textureArray[i * 4 + 0] = Math.random() * 100 - 50
      textureArray[i * 4 + 1] = Math.random() * 100 - 50
      textureArray[i * 4 + 2] = Math.random() * 100 - 50
      textureArray[i * 4 + 3] = 1
    }

    if (storedPositions.length) {
      for (let index = 0; index < storedPositions.length; index++) {
        textureArray[index] = storedPositions[index]
      }
    }

    let texture = new THREE.DataTexture(
      textureArray,
      this.textureWidth,
      this.textureHeight,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    texture.needsUpdate = true

    return texture
  }
}
