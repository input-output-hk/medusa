varying float vDist;
varying float vUpdated;

void main(){

  vec3 color = vec3(1.);

  if (vUpdated > 1.) {
    color = mix(vec3(.09, .274, .627), vec3(.8, .8, .8), vUpdated - 1.);
  } else {
    color = mix(vec3(0.921, 0.133, 0.337), vec3(.09, .274, .627), vUpdated);
  }

  float a = vDist;

  gl_FragColor = vec4(color, a);
}