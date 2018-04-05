uniform sampler2D fontTexture;

varying vec4 vTextCoord;
varying vec2 vUv;
varying vec4 vColor;

void main(){

  if (vColor.a < 0.1) {
    discard;
  }

  float x = vTextCoord.x + vUv.x * vTextCoord.z;
  float y = vTextCoord.y + (1. - vUv.y) * vTextCoord.w;
  vec4 color = texture2D(fontTexture, vec2(x,y));

  color *= vColor;

  gl_FragColor = color;
}