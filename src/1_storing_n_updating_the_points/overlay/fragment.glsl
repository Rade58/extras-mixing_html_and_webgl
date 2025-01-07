// already defined with ShaderMaterial
// precision mediump float;

// we did receive this from vertex shader, because we did send it (not done by ShaderMaterial)
varying vec2 vUv;

uniform float uAlpha;


void main() {

  
  
  gl_FragColor = vec4(vec3(0.0, 0.0, 0.0 ), uAlpha);

}