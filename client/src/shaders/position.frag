varying vec2 vUv;

uniform float sphereProject;
uniform float sphereRadius;

uniform sampler2D positionTexture;
uniform sampler2D forcesTexture;

const float width = 1. / textureWidth;
const float height = 1. / textureHeight;

void main() {
  vec4 currentPosition = texture2D(positionTexture, vUv);

  vec3 newPos = vec3(0.);

  if (currentPosition.w != 0.0) { // 0 = root node

    // repel this particle away from other particles
    vec3 repelForce = vec3(0.);
    for (float y = height * 0.5; y < 1.0; y += height) {
        for (float x = width * 0.5; x < 1.0; x += width) {
          vec4 otherPosition = texture2D(positionTexture, vec2(x, y));
          if (otherPosition.w == 2.) { // 2 = active node
            vec3 diff = currentPosition.xyz - otherPosition.xyz;
            float magnitude = length(diff);
            if (magnitude < 500.0)  {
              repelForce += diff / (magnitude * magnitude * magnitude + 1.);
            }
          }
        }
    }
    vec3 edgeForce = texture2D(forcesTexture, vUv).xyz;

    vec3 force = edgeForce + repelForce * 100.;

    newPos = currentPosition.xyz + force;

    vec3 finalPos = mix(currentPosition.xyz, newPos, 0.5);
    if (sphereProject == 1.0) {
      finalPos = normalize(finalPos) * sphereRadius;
    }

    gl_FragColor = vec4(finalPos, 2.);

  } else {
    gl_FragColor = vec4(newPos.xyz, 0.);
  }

}