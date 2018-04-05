const Vignette = {

  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 2.0 },
    bgColor: { value: null }
  },

  vertexShader: `

    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }

  `,

  fragmentShader: `

    uniform vec3 bgColor;
    uniform float offset;
    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    void main() {

      vec4 texel = texture2D( tDiffuse, vUv );
      vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );

      vec3 result = mix( 
        texel.rgb, 
        bgColor, 
        dot( uv, uv ) 
      );

      gl_FragColor = vec4( 
        clamp(
          result, 
          bgColor,
          vec3( 1. )
        ),
        texel.a 
      );

    }

  `

}

export default Vignette
