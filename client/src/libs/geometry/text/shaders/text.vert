uniform sampler2D positionTexture;

attribute vec2 labelPositions;
attribute vec4 textCoord;
attribute vec2 textureLocation;

varying vec2 vUv;
varying vec4 vTextCoord;

void main(){
    vUv = uv;
    vTextCoord = textCoord;
    vec3 currentPosition = texture2D(positionTexture, textureLocation).xyz;
    vec4 meshPosition = modelViewMatrix * vec4(currentPosition, 1.);
    vec4 offsetPosition = vec4(labelPositions.xy, 0., 0.) + meshPosition;
    offsetPosition.y -= .5;
    offsetPosition.x += 1.;
    gl_Position = projectionMatrix * offsetPosition;
}