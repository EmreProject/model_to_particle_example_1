  precision highp float;


  layout(location = 0) out vec4 color;
  uniform sampler2D uParticleTexture;
  
  void main() {

      vec2 uv = gl_PointCoord;
    
      color = texture(uParticleTexture, uv);
    }