uniform sampler2D map;
uniform sampler2D uMap;
uniform float decayTime;
uniform float cycleColors;

varying float vDecay;
varying vec4 vColor;
varying float vActive;
varying float vDist;

void main() {

  if (vActive == 0.) {
    gl_FragColor = vec4(0.);
  } else {
    vec4 sprite = vec4(1.);
    if (vDecay > 0.) {
      sprite = texture2D(uMap, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
    } else {
      sprite = texture2D(map, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
    }

    if (cycleColors == 1.0) {
      if (vColor.a > 1.) {
        float amount = min(1., vColor.a - 1.);
        sprite.rgb = mix(vec3(.09, .274, .627), vec3(.7, .7, .7), amount);
      } else {
        sprite.rgb = mix(vColor.rgb, vec3(.09, .274, .627), vColor.a);
      }
    } else {
      sprite.rgb = vColor.rgb;
    }

    sprite.rgb += vDecay * 0.6;

    sprite.a = min(sprite.a, (vDist * 0.5));

    gl_FragColor = vec4(sprite.rgb, sprite.a);
  }
}