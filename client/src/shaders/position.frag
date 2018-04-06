varying vec2 vUv;

uniform float sphereProject;
uniform float sphereRadius;

uniform sampler2D positionTexture;
uniform sampler2D pullTexture;
uniform sampler2D pushTexture;

const float width = 1. / textureWidth;
const float height = 1. / textureHeight;

void main() {
  vec4 currentPosition = texture2D(positionTexture, vUv);

  vec3 newPos = vec3(0.);

  if (currentPosition.w == 2.0) {

    gl_FragColor = vec4(vec3(0.), 2.);

  } else {

    // repel this particle away from other particles
    vec3 repelForce = vec3(0.);
    for (float y = height * 0.9; y < 1.0; y += height) {
        for (float x = width * 0.9; x < 1.0; x += width) {
          vec4 otherPosition = texture2D(positionTexture, vec2(x, y));
          vec3 diff = currentPosition.xyz - otherPosition.xyz;
          float magnitude = length(diff);
          repelForce += (diff / (magnitude * magnitude * magnitude + 1.)) * otherPosition.w;
        }
    }
    vec3 pullForce = texture2D(pullTexture, vUv).xyz;
    vec3 pushForce = texture2D(pushTexture, vUv).xyz;

    vec3 edgeForce = (pullForce + pushForce);

    vec3 force = edgeForce + repelForce * 100.;

    newPos = currentPosition.xyz + force;

    vec3 finalPos = mix(currentPosition.xyz, newPos, 0.5);
    if (sphereProject == 1.0) {
      finalPos = normalize(finalPos) * sphereRadius;
    }

    gl_FragColor = vec4(finalPos, 1.);

  }

}