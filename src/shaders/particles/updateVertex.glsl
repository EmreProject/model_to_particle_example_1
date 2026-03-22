 in vec3 position;
			in vec2 uv;

      out vec2 vUv;

      	uniform mat4 modelMatrix;
      	uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;

      uniform float uTextureSize;

  void main() {
    gl_Position =   vec4(position, 1.0);
  
    vUv = uv;
  }