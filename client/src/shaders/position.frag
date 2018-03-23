varying vec2 vUv;
uniform sampler2D positionTexture;
uniform sampler2D forcesTexture;

const float width = 1. / textureWidth;
const float height = 1. / textureHeight;

void main() {
  vec4 currentPosition = texture2D(positionTexture, vUv);

  vec3 newPos = vec3(0.);

  if (currentPosition.w != 0.0) {

    // repel this particle away from other particles
    vec3 repelForce = vec3(0.);
    for (float y = height * 0.5; y < 1.0; y += height) {
        for (float x = width * 0.5; x < 1.0; x += width) {
          vec4 otherPosition = texture2D(positionTexture, vec2(x, y));
          vec3 diff = currentPosition.xyz - otherPosition.xyz;
          float lengthSq = dot(diff, diff);
          repelForce += diff / (lengthSq * lengthSq + 1.);
        }
    }
    vec3 edgeForce = texture2D(forcesTexture, vUv).xyz;
    newPos = currentPosition.xyz + edgeForce + repelForce * 100.;
  }

  gl_FragColor = vec4(newPos.xyz, currentPosition.w);
}