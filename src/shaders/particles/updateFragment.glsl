    precision highp float;
		precision highp int;
    precision highp sampler3D;


    uniform sampler3D uNoise3d;
    uniform float uFlowFieldDimension;
    uniform float uEachFlowFieldSquareDimension;
    uniform float uRatioToMaxForce;
    uniform float uIsFlowFieldEnabled;
    
    uniform float uTime;
    uniform float uRandomForceRatio;
    uniform float uRandomForceParticleRatio;
    uniform float uMagicOrbitParticleRatio;
    uniform float uMagicOrbitForceRatio;

    uniform sampler2D uPositionTexture;
    uniform sampler2D uVelocityTexture;

     uniform sampler2D uTargetTexture;

    uniform float uMaxVelocity;
    uniform float uMaxForce;
    uniform float uLimitDistance; //if distance to target smaller than that than desired map to 0 to u

    uniform vec3 uCameraPosition;
    uniform vec3 uMouseForceDirection;
    uniform float uMouseRayRadius;
    uniform float uMouseRayForce;
    uniform float uIsMouseForce;

     in vec2 vUv;

    layout(location = 0) out vec4 updatedPosition; // Output for COLOR_ATTACHMENT0
    layout(location = 1) out vec4 updatedVelocity; // Output for COLOR_ATTACHMENT1


  float rand(float co) { return fract(sin(co*(91.3458)) * 47453.5453); }

   float rand2 (vec2 st) {

         return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
    }

    void applyForce(inout vec3 acc_, vec3 force){
        acc_ += force;
    }

    void main() {
     
      vec3 acc=vec3(0.,0.,0.);

      float flowFieldMaxForceRatio=uRatioToMaxForce;

      vec3 position = texture(uPositionTexture, vUv).xyz;
      vec3 currentVelocity = texture(uVelocityTexture, vUv).xyz;
      vec3 targetPos= texture(uTargetTexture, vUv).xyz;
    
      vec3 desired = targetPos - position;
      float d=length(desired);


    vec3 dirToTarget = vec3(0.0);
      
  

      if (d > 0.00001) {
    desired /= d;
      dirToTarget = desired;
      } else {
    desired = vec3(0.0);
    }

      if(d < uLimitDistance){

        float newMaxVelocity= (uMaxVelocity / uLimitDistance) * d;
        desired*=newMaxVelocity;
     //  flowFieldMaxForceRatio*= (uLimitDistance/max(d,0.));
        
      }else{
        
        desired*=uMaxVelocity;
      }

      vec3 steer= desired - currentVelocity;
       float steerLen = length(steer);
    if (steerLen > uMaxForce) {
        steer = steer / steerLen * uMaxForce;
    }

      float nearBlend = 1.0 - smoothstep(0.0, uLimitDistance, d);
    float farBlend  = 1.0 - nearBlend;

    applyForce(acc, steer * (0.9 * farBlend + 0.2 * nearBlend));

    // -----------------------------
    // 2. Smooth 3D flow noise
    // -----------------------------


     vec3 noiseUv = (position + vec3(uFlowFieldDimension * 0.5)) / uFlowFieldDimension;
    vec3 baseUv = noiseUv * 0.65;

if(rand2(vUv)<uRandomForceParticleRatio){
    vec3 flowForce;
    flowForce.x = texture(uNoise3d, fract(baseUv + vec3(uTime * 0.018, 1.3, 2.7))).r * 2.0 - 1.0;
    flowForce.y = texture(uNoise3d, fract(baseUv + vec3(3.9, uTime * 0.015, 5.1))).r * 2.0 - 1.0;
    flowForce.z = texture(uNoise3d, fract(baseUv + vec3(7.2, 4.4, uTime * 0.020))).r * 2.0 - 1.0;

    float flowLen = length(flowForce);
    if (flowLen > 0.00001) {
        flowForce = flowForce / flowLen;
    } else {
        flowForce = vec3(0.0);
    }

    applyForce(acc, flowForce * uMaxForce * uRandomForceRatio);
}
 // -----------------------------
    // 3. Magical orbit near whale
    // -----------------------------
    if(rand2(vUv)<uRandomForceParticleRatio){
    vec3 refAxis = abs(dirToTarget.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 tangent = cross(dirToTarget, refAxis);
    float tangentLen = length(tangent);

    if (tangentLen > 0.00001) {
        tangent /= tangentLen;
    } else {
        tangent = vec3(0.0);
    }

    // Rotate orbit direction a bit using noise so it doesn't look uniform
    vec3 orbitNoise;
    orbitNoise.x = texture(uNoise3d, fract(baseUv + vec3(9.1, 2.3, uTime * 0.01))).r * 2.0 - 1.0;
    orbitNoise.y = texture(uNoise3d, fract(baseUv + vec3(uTime * 0.012, 8.2, 1.6))).r * 2.0 - 1.0;
    orbitNoise.z = texture(uNoise3d, fract(baseUv + vec3(3.7, 6.4, uTime * 0.014))).r * 2.0 - 1.0;

  vec3 tangentMixed = mix(tangent, orbitNoise, 0.35);
float tangentMixedLen = length(tangentMixed);
if (tangentMixedLen > 0.00001) {
    tangent = tangentMixed / tangentMixedLen;
} else {
    tangent = vec3(0.0);
}

    applyForce(acc, tangent * uMaxForce * uMagicOrbitForceRatio * nearBlend);
    }

// -----------------------------
    // 4. Tiny shimmer/flutter
    // -----------------------------
    vec3 flutter;
    flutter.x = sin(uTime * 1.4 + vUv.x * 43.0);
    flutter.y = cos(uTime * 1.2 + vUv.y * 37.0);
    flutter.z = sin(uTime * 1.6 + (vUv.x + vUv.y) * 29.0);

    float flutterLen = length(flutter);
    if (flutterLen > 0.00001) {
        flutter /= flutterLen;
    } else {
        flutter = vec3(0.0);
    }

    applyForce(acc, flutter * uMaxForce * 0.06 * nearBlend);


// -----------------------------
    // 5. TMouse Repulsion
    // -----------------------------
if(uIsMouseForce>0.5){


      vec3 v = position - uCameraPosition;
      float t = dot(v, uMouseForceDirection);
      t = max(t, 0.0);

      vec3 closestPoint = uCameraPosition + uMouseForceDirection * t;

      vec3 away = position - closestPoint;
      float dist = length(away);

      if (dist < uMouseRayRadius && dist > 0.00001) {
          vec3 repulseDir = away / dist;

          float strength = 1.0 - dist / uMouseRayRadius;
          strength *= strength; // smoother falloff

          vec3 repulseForce = repulseDir * uMouseRayForce * strength;
          applyForce(acc, repulseForce);
      }
}
      currentVelocity += acc;
      currentVelocity *= 0.97;
      position += currentVelocity;

      updatedPosition = vec4(position, 1.0); // Write position to first output
      updatedVelocity = vec4(currentVelocity, 1.0); // Write velocity to second output
    }