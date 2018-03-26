uniform sampler2D positionTexture;

attribute vec2 labelPositions;
attribute vec4 textCoord;
attribute vec2 textureLocation;
attribute vec2 scale;

varying vec2 vUv;
varying vec4 vTextCoord;
varying vec4 vColor;

void main(){
    vUv = uv;
    vTextCoord = textCoord;
    vec3 currentPosition = texture2D(positionTexture, textureLocation).xyz;
    vec4 meshPosition = modelViewMatrix * vec4(currentPosition, 1.) + vec4(position.xy, 0., 0.) * vec4(scale.xy, 0., 0.);
    meshPosition.x += labelPositions.x;
    meshPosition.y += labelPositions.y * 0.5;
    meshPosition.x += 1.1;
    meshPosition.y -= .21;

    vColor = vec4(1.);
    vColor.a = 1500. / dot(meshPosition.xyz, meshPosition.xyz);

    gl_Position = projectionMatrix * meshPosition;
}