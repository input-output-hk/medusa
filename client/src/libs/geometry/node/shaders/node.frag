uniform sampler2D map;
uniform float decayTime;

varying float vDecay;
varying vec4 vColor;

void main() {
  vec4 sprite = texture2D(map, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
  sprite.rgb *= vColor.rgb;
  sprite.rgb += (vDecay *  0.5);
  gl_FragColor = vec4(sprite.rgb, sprite.a);
}