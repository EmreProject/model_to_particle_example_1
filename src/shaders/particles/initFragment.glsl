    precision highp float;
		precision highp int;



    in vec2 vUv;
    in vec3 vPosition;
    uniform float uMinStartVelocity;
    uniform float uMaxStartVelocity;
    uniform vec3 uStartVelocityDirection;

    float random (vec2 st) {

         return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
    }


    layout(location = 0) out vec4 initialPosition; // Output for COLOR_ATTACHMENT0
    layout(location = 1) out vec4 initialVelocity; // Output for COLOR_ATTACHMENT1


    void main() {
     
      float rand1 = random(vec2(vUv.x*3.1,vUv.y*1.24));
     
      float velocityMagnitude= uMinStartVelocity + (uMaxStartVelocity-uMinStartVelocity)*rand1;

      vec3 velocity= uStartVelocityDirection * velocityMagnitude;
  
    

      initialPosition = vec4(vPosition, 1.0); // Write position to first output
      initialVelocity = vec4(velocity, 1.0); // Write velocity to second output

    }