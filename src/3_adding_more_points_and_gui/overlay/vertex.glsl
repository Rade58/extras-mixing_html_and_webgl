// already declared with ShaderMaterial
// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;

 
// already declared with ShaderMaterial
// attribute vec2 uv;

// we still need to pass this by ourself
varying vec2 vUv;
//

// already declared with ShaderMaterial
// attribute vec3 position;



void main(){

  // vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  // vec4 viewPosition = viewMatrix * modelPosition;
  // vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = vec4(position, 1.0);




  
  // gl_Position = projectedPosition;

  vUv = uv;
}