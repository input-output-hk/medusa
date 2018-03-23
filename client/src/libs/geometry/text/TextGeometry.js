import * as THREE from 'three'

import TextureHelper from '../../TextureHelper'

// shaders
import FragmentShader from './shaders/text.frag'
import VertexShader from './shaders/text.vert'

// font
import UbuntuMono from './fonts/UbuntuMono'

export default class TextGeometry {
  constructor () {
    this.textureHelper = new TextureHelper()
    this.font = UbuntuMono('textures/UbuntuMono.png')
    this.fontSize = 10
    this.kerning = 1
    this.textureSize = 1024 // size of the font texture (aspect 1:1)
    this.material = null
    this.geometry = null
  }

  setAttributes (
    nodeData,
    positionArray,
    labelPositionsArray,
    uvArray,
    textCoordsArray,
    textureLocationArray
  ) {
    let iter = 0

    for (const nodeId in nodeData) {
      if (nodeData.hasOwnProperty(nodeId)) {
        const node = nodeData[nodeId]

        let fileNameArray = node.p.split('/')
        let fileName = fileNameArray[fileNameArray.length - 1]

        for (let charIndex = 0; charIndex < fileName.length; charIndex++) {
          const char = fileName[charIndex]

          let index = iter * 6

          let coords = this.getCharCoordinates(char)

          if (!coords) {
            continue
          }

          let left = coords.xOffset
          let right = coords.xOffset + coords.width
          let bottom = coords.yOffset - coords.height
          let top = coords.yOffset

          let charPosition = charIndex * this.kerning

          labelPositionsArray[index * 2 + 0] = charPosition + left * this.fontSize
          labelPositionsArray[index * 2 + 1] = top * this.fontSize
          labelPositionsArray[index * 2 + 2] = charPosition + left * this.fontSize
          labelPositionsArray[index * 2 + 3] = bottom * this.fontSize
          labelPositionsArray[index * 2 + 4] = charPosition + right * this.fontSize
          labelPositionsArray[index * 2 + 5] = top * this.fontSize
          labelPositionsArray[index * 2 + 6] = charPosition + right * this.fontSize
          labelPositionsArray[index * 2 + 7] = bottom * this.fontSize
          labelPositionsArray[index * 2 + 8] = charPosition + right * this.fontSize
          labelPositionsArray[index * 2 + 9] = top * this.fontSize
          labelPositionsArray[index * 2 + 10] = charPosition + left * this.fontSize
          labelPositionsArray[index * 2 + 11] = bottom * this.fontSize

          uvArray[index * 2 + 0] = 0
          uvArray[index * 2 + 1] = 1
          uvArray[index * 2 + 2] = 0
          uvArray[index * 2 + 3] = 0
          uvArray[index * 2 + 4] = 1
          uvArray[index * 2 + 5] = 1
          uvArray[index * 2 + 6] = 1
          uvArray[index * 2 + 7] = 0
          uvArray[index * 2 + 8] = 1
          uvArray[index * 2 + 9] = 1
          uvArray[index * 2 + 10] = 0
          uvArray[index * 2 + 11] = 0

          let texLocation = this.textureHelper.getNodeTextureLocation(nodeId)

          textureLocationArray[index * 2 + 0] = texLocation.x
          textureLocationArray[index * 2 + 1] = texLocation.y
          textureLocationArray[index * 2 + 2] = texLocation.x
          textureLocationArray[index * 2 + 3] = texLocation.y
          textureLocationArray[index * 2 + 4] = texLocation.x
          textureLocationArray[index * 2 + 5] = texLocation.y
          textureLocationArray[index * 2 + 6] = texLocation.x
          textureLocationArray[index * 2 + 7] = texLocation.y
          textureLocationArray[index * 2 + 8] = texLocation.x
          textureLocationArray[index * 2 + 9] = texLocation.y
          textureLocationArray[index * 2 + 10] = texLocation.x
          textureLocationArray[index * 2 + 11] = texLocation.y

          textCoordsArray[index * 4 + 0] = coords.left
          textCoordsArray[index * 4 + 1] = coords.top
          textCoordsArray[index * 4 + 2] = coords.width
          textCoordsArray[index * 4 + 3] = coords.height
          textCoordsArray[index * 4 + 4] = coords.left
          textCoordsArray[index * 4 + 5] = coords.top
          textCoordsArray[index * 4 + 6] = coords.width
          textCoordsArray[index * 4 + 7] = coords.height
          textCoordsArray[index * 4 + 8] = coords.left
          textCoordsArray[index * 4 + 9] = coords.top
          textCoordsArray[index * 4 + 10] = coords.width
          textCoordsArray[index * 4 + 11] = coords.height
          textCoordsArray[index * 4 + 12] = coords.left
          textCoordsArray[index * 4 + 13] = coords.top
          textCoordsArray[index * 4 + 14] = coords.width
          textCoordsArray[index * 4 + 15] = coords.height
          textCoordsArray[index * 4 + 16] = coords.left
          textCoordsArray[index * 4 + 17] = coords.top
          textCoordsArray[index * 4 + 18] = coords.width
          textCoordsArray[index * 4 + 19] = coords.height
          textCoordsArray[index * 4 + 20] = coords.left
          textCoordsArray[index * 4 + 21] = coords.top
          textCoordsArray[index * 4 + 22] = coords.width
          textCoordsArray[index * 4 + 23] = coords.height

          iter++
        }
      }
    }
  }

  create (nodeData, nodeCount) {
    this.textureHelper.setTextureSize(nodeCount)

    if (this.geometry) {
      this.geometry.dispose()
    }

    this.geometry = new THREE.BufferGeometry()

    let positionArray = new Float32Array(nodeCount * 6 * 3)
    let labelPositionsArray = new Float32Array(nodeCount * 6 * 2)
    let uvArray = new Float32Array(nodeCount * 6 * 2)
    let textCoordsArray = new Float32Array(nodeCount * 6 * 4)
    let textureLocationArray = new Float32Array(nodeCount * 6 * 2)

    this.setAttributes(
      nodeData,
      positionArray,
      labelPositionsArray,
      uvArray,
      textCoordsArray,
      textureLocationArray
    )

    let position = new THREE.BufferAttribute(positionArray, 3)
    let uv = new THREE.BufferAttribute(uvArray, 2)
    let textCoords = new THREE.BufferAttribute(textCoordsArray, 4)
    let labelPositions = new THREE.BufferAttribute(labelPositionsArray, 2)
    let textureLocation = new THREE.BufferAttribute(textureLocationArray, 2)

    this.geometry.addAttribute('position', position)
    this.geometry.addAttribute('labelPositions', labelPositions)
    this.geometry.addAttribute('uv', uv)
    this.geometry.addAttribute('textCoord', textCoords)
    this.geometry.addAttribute('textureLocation', textureLocation)

    if (!this.material) {
      this.material = new THREE.ShaderMaterial({
        uniforms: {
          fontTexture: {
            type: 't', value: this.font.texture
          },
          positionTexture: {
            type: 't',
            value: null
          }
        },
        vertexShader: VertexShader,
        fragmentShader: FragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      })
    }

    this.text = new THREE.Mesh(this.geometry, this.material)
    return this.text
  }

  getCharCoordinates (char) {
    let charCode = char.charCodeAt(0)

    if (typeof this.font[charCode] === 'undefined') {
      return null
    }

    let charData = this.font[charCode]

    return {
      left: charData[0] / this.textureSize,
      top: charData[1] / this.textureSize,
      width: charData[2] / this.textureSize,
      height: charData[3] / this.textureSize,
      xOffset: charData[4] / this.textureSize,
      yOffset: charData[5] / this.textureSize
    }
  }
}
