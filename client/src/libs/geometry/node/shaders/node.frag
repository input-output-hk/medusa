uniform sampler2D map;
uniform sampler2D mapBlur;
uniform sampler2D uMap;
uniform float cycleColors;

varying float vDecay;
varying vec4 vColor;
varying float vActive;
varying float vDist;
varying float vSpriteMix;
varying float vIsHovered;

void main() {

   if (vActive == 0.) {
     gl_FragColor = vec4(0.);
   } else {

    vec4 sprite = vec4(1.);
    vec4 spriteBlur = vec4(1.);
    if (vDecay > 0.) {
      sprite = texture2D(uMap, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
      spriteBlur = texture2D(uMap, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
    } else {
      sprite = texture2D(map, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
      spriteBlur = texture2D(mapBlur, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
    }

    vec4 diffuse = mix(sprite, spriteBlur, vSpriteMix);

    // if (cycleColors == 1.0) {
    //   if (vColor.a > 1.) {
    //     float amount = min(1., vColor.a - 1.);
    //     sprite.rgb = mix(vec3(.09, .274, .627), vec3(.7, .7, .7), amount);
    //   } else {
    //     sprite.rgb = mix(vColor.rgb, vec3(.09, .274, .627), vColor.a);
    //   }
    // } else {
      diffuse.rgb = vColor.rgb;
    //}

    diffuse.rgb += vDecay;

    diffuse.a = mix(diffuse.a, diffuse.a * (vDist * 0.01), vSpriteMix * 1.0);
    diffuse.a = clamp(diffuse.a, 0.0, 1.0);

    diffuse.rgb += (vIsHovered * 0.4);

    gl_FragColor = vec4(diffuse.rgb, diffuse.a);
  

  }
}
