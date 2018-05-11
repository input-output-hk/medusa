uniform sampler2D positionTexture;
uniform float uTime;

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
    meshPosition.x += 3.5;
    meshPosition.y -= 0.9;

    vColor = vec4(1.);
    vColor.a = 40000. / dot(meshPosition.xyz, meshPosition.xyz);

    float scaledTime = uTime * 0.0025;
    if (scaledTime < 1.) {
        vColor.a -= (1.0 - scaledTime);
    }

    vColor.a = clamp(vColor.a, 0.0, 1.0);

    gl_Position = projectionMatrix * meshPosition;
}