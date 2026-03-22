	    in vec2 uv;
      in vec3 position;



			uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;

      uniform sampler2D uPositionTexture;
      uniform float uTextureSize;
      uniform float uPointSize;
      

       float random (vec2 st) {

         return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
    }


        void main() {

          vec2 realUv=  uv;
          vec3 position_ = texture(uPositionTexture, realUv).xyz;
      
          
          gl_Position = projectionMatrix *viewMatrix* modelMatrix * vec4(position_, 1.0);
          gl_PointSize = uPointSize;

     
        }