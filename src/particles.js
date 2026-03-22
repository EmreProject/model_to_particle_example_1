import * as THREE from "three"



import initVertex from "./shaders/particles/initVertex.glsl"
import initFragment from "./shaders/particles/initFragment.glsl"
import updateVertex from "./shaders/particles/updateVertex.glsl"
import updateFragment from "./shaders/particles/updateFragment.glsl"
import renderVertex from "./shaders/particles/renderVertex.glsl"
import renderFragment from "./shaders/particles/renderFragment.glsl"


const textureLoader=new THREE.TextureLoader();

class Particles{

renderer;
orthoCamera;


textureSize; 
particleCount; //pow 2 of texture dimension
particleSize; //gl point size paramater lile 1.0 or 5.
particleTexture; //snow or fire particle texure
cloneParticle;
startFloorScale;
startFloorPosition;
startFloorRotation;
uMinStartVelocity;  //float 
uMaxStartVelocity; // float
uStartVelocityDirection; //vector3
uMaxVelocity;
uMaxForce;
uLimitDistance;

uNoise3d;

initScene;
updateScene;

initRenderTarget;
updateRenderTargetA;
updateRenderTargetB;
currentlyFilledRenderTarget="A"


initMesh;
updateMesh;
renderMesh;


static PixelToNdc(pixel){
 
    return (pixel*2)/Math.max(window.innerWidth,window.innerHeight);

}

static async LoadNoiseTexture(jsonUrl,binUrl){

      const [metaResp, binResp] = await Promise.all([fetch(jsonUrl), fetch(binUrl)]);
      const meta = await metaResp.json();
      const bin = await binResp.arrayBuffer();
    console.log(bin)
      // reconstruct Float32Array
      const vol = new Float32Array(bin);
      const { width, height, depth } = meta;
    
      // build Data3DTexture
      const tex3D = new THREE.Data3DTexture(vol, width, height, depth);
      tex3D.format = THREE.RedFormat;
      tex3D.type = THREE.FloatType;
      tex3D.minFilter = THREE.LinearFilter;
      tex3D.magFilter = THREE.LinearFilter;
      tex3D.wrapS = tex3D.wrapT = tex3D.wrapR = THREE.RepeatWrapping;
      tex3D.needsUpdate = true;
    

      return tex3D;
}


#SetRenderTargets(){

   

     this.initRenderTarget = new THREE.WebGLRenderTarget(
                        this.textureSize*this.cloneParticle,
                        this.textureSize*this.cloneParticle,
                        {
                            count: 2,
                type: THREE.FloatType,
                format: THREE.RGBAFormat,
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                depthBuffer: false,
                stencilBuffer: false
    
                        }
                    );
    
     this.updateRenderTargetA = new THREE.WebGLRenderTarget(
                        this.textureSize*this.cloneParticle,
                        this.textureSize*this.cloneParticle,
                        {
                            count: 2,
                type: THREE.FloatType,
                format: THREE.RGBAFormat,
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                depthBuffer: false,
                stencilBuffer: false
    
                        }
                    );
    
     this.updateRenderTargetB = new THREE.WebGLRenderTarget(
                        this.textureSize*this.cloneParticle*this.cloneParticle,
                        this.textureSize*this.cloneParticle,
                        {
                            count: 2,
                            type: THREE.FloatType,
                            format: THREE.RGBAFormat,
                            minFilter: THREE.NearestFilter,
                            magFilter: THREE.NearestFilter,
                            depthBuffer: false,
                            stencilBuffer: false
    
                        }
                    );
}

#SetSceneAndMesh(){

    this.initScene=new THREE.Scene();
    this.updateScene=new THREE.Scene();

  const planeGeometry=new THREE.PlaneGeometry(2,2);
  const planeGeometrySubdivided=new THREE.PlaneGeometry(2,2,this.textureSize*this.cloneParticle-1,this.textureSize*this.cloneParticle-1);

  const initMaterial = new THREE.RawShaderMaterial({
        vertexShader: initVertex,
        fragmentShader: initFragment,
        side: THREE.DoubleSide,
        glslVersion:THREE.GLSL3,
        uniforms:{
            uTextureSize:{value:this.textureSize},
            uMinStartVelocity:{value:this.uMinStartVelocity},
            uMaxStartVelocity:{value:this.uMaxStartVelocity},
            uStartVelocityDirection:{value:this.uStartVelocityDirection}

        }
    })

    if(!this.uNoise3d){
        this.uNoise3d = Particles.LoadNoiseTexture("./noise/noise_50x50x50.json","./noise/noise_50x50x50.f32");
    }

     const updateMaterial = new THREE.RawShaderMaterial({
        vertexShader: updateVertex,
        fragmentShader: updateFragment,
        side: THREE.DoubleSide,
        glslVersion:THREE.GLSL3,
        uniforms:{
           uNoise3d:{value:this.uNoise3d},
           uFlowFieldDimension:{value:0},
           uEachFlowFieldSquareDimension:{value:0},
           uRatioToMaxForce:{value:0},
           uIsFlowFieldEnabled:{value:0},
           uTextureSize:{value: this.textureSize},
           uPositionTexture:{value:undefined},
           uVelocityTexture:{value:undefined},
           uTargetTexture:{value:  this.firstTargetTexture_},
           uMaxVelocity:{value:this.uMaxVelocity},
           uMaxForce:{value:this.uMaxForce},
           uLimitDistance:{value:this.uLimitDistance}, 
           uRandomForceRatio:{value:0},
           uMagicOrbitForceRatio:{value:0},
           uRandomForceParticleRatio:{value:0},
           uMagicOrbitParticleRatio:{value:0},
           uTime:{value:0},
           uCameraPosition:{value:new THREE.Vector3(0,0,0)},
           uMouseForceDirection:{value:new THREE.Vector3(0,1,0)},
           uMouseRayRadius:{value:0},
           uMouseRayForce:{value:0},
           uIsMouseForce:{value:0}
        }
    })


    const renderMaterial=new THREE.RawShaderMaterial({

      vertexShader: renderVertex,
      fragmentShader: renderFragment,
      side: THREE.DoubleSide,
      glslVersion:THREE.GLSL3,
       transparent: true,
         depthWrite: false,
      uniforms:{
           uTextureSize:{value: this.textureSize},
           uPositionTexture:{value:undefined},
           uPointSize:{value:this.particleSize},
           uParticleTexture:{value:this.particleTexture}
        }

    });

    this.initMesh=new THREE.Mesh(planeGeometry,initMaterial);
   this.initMesh.scale.set( this.startFloorScale, this.startFloorScale, this.startFloorScale);
    this.initMesh.position.copy(this.startFloorPosition)
    this.initMesh.rotation.set(this.startFloorRotation.x,this.startFloorRotation.y, this.startFloorRotation.z);

    this.updateMesh=new THREE.Mesh(planeGeometry,updateMaterial);

    this.renderMesh=new THREE.Points(planeGeometrySubdivided,renderMaterial);

    this.initScene.add(this.initMesh);
    this.updateScene.add(this.updateMesh);

    this.renderer.setRenderTarget(this.initRenderTarget);
    this.renderer.render(this.initScene,this.orthoCamera);


    this.renderer.setRenderTarget(this.updateRenderTargetA);
    this.updateMesh.material.uniforms.uPositionTexture.value=this.initRenderTarget.textures[0];
    this.updateMesh.material.uniforms.uVelocityTexture.value=this.initRenderTarget.textures[1];
    this.renderer.render(this.updateScene,this.orthoCamera);

    this.renderer.setRenderTarget(null);

}

constructor(renderer,orthoCamera){

    this.renderer=renderer;
    this.orthoCamera=orthoCamera;
  

}

//particlesize = gl_pointsize, 
// particle texture = final color texture like snow
//startFloorScale means at start particles start as floor then create the model. size of the floor
Init({textureSize,particleSize,particleTexture,startFloorScale,startFloorPosition,
startFloorRotation,uMinStartVelocity,uMaxStartVelocity,uStartVelocityDirection,uMaxVelocity,uMaxForce,
uLimitDistance,cloneParticle}){

    this.textureSize=textureSize;
    this.particleCount=Math.pow(textureSize,2);
    this.particleSize=particleSize;
    this.cloneParticle=cloneParticle;
    this.particleTexture=particleTexture;
    this.startFloorScale=startFloorScale;
    this.startFloorPosition=startFloorPosition;
    this.startFloorRotation=startFloorRotation;
    this.uMinStartVelocity=uMinStartVelocity;
    this.uMaxStartVelocity=uMaxStartVelocity;
    this.uStartVelocityDirection=uStartVelocityDirection;
    this.uMaxVelocity=uMaxVelocity;
    this.uMaxForce=uMaxForce;
    this.uLimitDistance=uLimitDistance;

    this.#SetRenderTargets();
    this.#SetSceneAndMesh();
}

ChangeModel({uMaxVelocity,uMaxForce,
uLimitDistance, uRatioToMaxForce, uRandomForceRatio,uRandomForceParticleRatio,uMagicOrbitParticleRatio,uMagicOrbitForceRatio}){

 if(this.updateMesh){
        this.updateMesh.material.uniforms.uMaxVelocity.value=uMaxVelocity
        this.updateMesh.material.uniforms.uMaxForce.value=uMaxForce
        this.updateMesh.material.uniforms.uRatioToMaxForce.value=uRatioToMaxForce
        this.updateMesh.material.uniforms.uLimitDistance.value=uLimitDistance;
        this.updateMesh.material.uniforms.uRandomForceRatio.value=uRandomForceRatio;
        this.updateMesh.material.uniforms.uRandomForceParticleRatio.value=uRandomForceParticleRatio;
        this.updateMesh.material.uniforms.uMagicOrbitParticleRatio.value=uMagicOrbitParticleRatio;
        this.updateMesh.material.uniforms.uMagicOrbitForceRatio.value=uMagicOrbitForceRatio;
       
    }
    
}
UpdateTargetTexture(texture){
if(this.updateMesh){
    this.updateMesh.material.uniforms.uTargetTexture.value=texture;
}else{
    this.firstTargetTexture_ =texture;
}
}

async SetNoiseTexture({jsonUrl,binUrl},{uFlowFieldDimension,  uEachFlowFieldSquareDimension, uRatioToMaxForce, uRandomForceRatio,uRandomForceParticleRatio,uMagicOrbitParticleRatio,uMagicOrbitForceRatio, uMouseRayRadius,uMouseRayForce}){

    this.uNoise3d=await Particles.LoadNoiseTexture(jsonUrl,binUrl);
    if(this.updateMesh){
        this.updateMesh.material.uniforms.uFlowFieldDimension.value=uFlowFieldDimension
        this.updateMesh.material.uniforms.uEachFlowFieldSquareDimension.value=uEachFlowFieldSquareDimension
        this.updateMesh.material.uniforms.uRatioToMaxForce.value=uRatioToMaxForce
        this.updateMesh.material.uniforms.uIsFlowFieldEnabled.value=1.;
        this.updateMesh.material.uniforms.uNoise3d.value=this.uNoise3d;
        this.updateMesh.material.uniforms.uRandomForceRatio.value=uRandomForceRatio;
        this.updateMesh.material.uniforms.uRandomForceParticleRatio.value=uRandomForceParticleRatio;
        this.updateMesh.material.uniforms.uMagicOrbitParticleRatio.value=uMagicOrbitParticleRatio;
        this.updateMesh.material.uniforms.uMagicOrbitForceRatio.value=uMagicOrbitForceRatio;
         this.updateMesh.material.uniforms.uMouseRayRadius.value=uMouseRayRadius;
        this.updateMesh.material.uniforms.uMouseRayForce.value=uMouseRayForce;

    }

    console.log(this.updateMesh.material.uniforms)
}
SetMouseForce(cameraPosition,direction){

    if(this.updateMesh){

        this.updateMesh.material.uniforms.uCameraPosition.value=cameraPosition
        this.updateMesh.material.uniforms.uMouseForceDirection.value=direction
        this.updateMesh.material.uniforms.uIsMouseForce.value=1.;
    }

}
Update(elapsedTime){

    if(this.currentlyFilledRenderTarget=="A"){
    
        this.renderer.setRenderTarget(this.updateRenderTargetB);
        this.updateMesh.material.uniforms.uPositionTexture.value=this.     updateRenderTargetA.textures[0];
        this.updateMesh.material.uniforms.uVelocityTexture.value=this.     updateRenderTargetA.textures[1];
        this.renderer.render(this.updateScene,this.orthoCamera);
        
        this.renderMesh.material.uniforms.uPositionTexture.value= this.updateRenderTargetB.textures[0];
        this.currentlyFilledRenderTarget="B"
    }else{
    
         this.renderer.setRenderTarget(this.updateRenderTargetA);
        this.updateMesh.material.uniforms.uPositionTexture.value=this.     updateRenderTargetB.textures[0];
        this.updateMesh.material.uniforms.uVelocityTexture.value=this.     updateRenderTargetB.textures[1];
        this.renderer.render(this.updateScene,this.orthoCamera);

        this.renderMesh.material.uniforms.uPositionTexture.value= this.updateRenderTargetA.textures[0];
        this.currentlyFilledRenderTarget="A"
    }

    this.updateMesh.material.uniforms.uTime.value=elapsedTime
    this.renderer.setRenderTarget(null);

}


}

export {Particles}