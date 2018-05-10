varying vec2 vUv;

uniform float sphereProject;
uniform float sphereRadius;

uniform sampler2D texLocation;
uniform sampler2D positionTexture;
uniform sampler2D pullTexture;
uniform sampler2D pushTexture;

vec3 getRepelForce (vec4 currentPosition) {
    vec3 repelForce = vec3(0.);
 
    for (float x = 0.0; x < 1.0; x += texLocationWidth) {

      vec4 texPos = texture2D(texLocation, vec2(x, 0));

      /*vec4 otherPosition = texture2D(positionTexture, vec2(texPos.x, texPos.y));
      vec3 diff = currentPosition.xyz - otherPosition.xyz;
      float magnitude = length(diff);
      repelForce += (diff / (magnitude * magnitude * magnitude + 1.));*/

      vec4 otherPosition2 = texture2D(positionTexture, vec2(texPos.z, texPos.w));
      vec3 diff2 = currentPosition.xyz - otherPosition2.xyz;
      float magnitude2 = length(diff2);
      repelForce += (diff2 / (magnitude2 * magnitude2 * magnitude2 + 1.));

    }

    return repelForce;
}

void main() {
  vec4 currentPosition = texture2D(positionTexture, vUv);

  vec3 newPos = vec3(0.);

  if (currentPosition.w == 2.0) {

    gl_FragColor = vec4(vec3(0.), 2.);

  } else {
   
      // repel this particle away from other particles
      vec3 repelForce = getRepelForce(currentPosition);

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