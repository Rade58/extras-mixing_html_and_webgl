declare module "*.glsl" {
  const value: string;
  export default value;
}

// Also cover other extensions that glslify commonly uses
declare module "*.frag" {
  const value: string;
  export default value;
}

declare module "*.vert" {
  const value: string;
  export default value;
}
