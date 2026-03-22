import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import {AnimatedModelToParticle} from "./ModelToParticle.js"
import {Particles} from "./particles.js"
import { RayCaster } from './mousePicking.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'



let renderScene;
let orthoCamera,perspectiveCamera;


//Texture Loadr
const textureLoader=new THREE.TextureLoader();
const flameTexture=textureLoader.load("./textures/flame_02.png");
const muzzleTexture=textureLoader.load("./textures/muzzle_03.png");
const smokeTexture=textureLoader.load("./textures/smoke_06.png");



/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
 renderScene=new THREE.Scene();

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(2,2)

//Oamera
orthoCamera = new THREE.OrthographicCamera( - 100, 100, 100, - 100, 0, 100 );
orthoCamera.position.z=-1;
orthoCamera.lookAt(new THREE.Vector3(0,0,0));

perspectiveCamera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 50 );
perspectiveCamera.position.z = -3;
perspectiveCamera.lookAt(new THREE.Vector3(0,0,0));



window.addEventListener('resize', () =>
{

    // Update camera
    perspectiveCamera.aspect = window.innerWidth/ window.innerHeight
    perspectiveCamera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})



// Controls
const controls = new OrbitControls(perspectiveCamera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
 renderer.setSize(window.innerWidth,window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


let model=null;
let modelAnimations=null;
let mixer = null
let action=null;

const modelLocation="./models/blue_whale/scene.gltf";
const modelLocation2="./models/chess_knight/scene.gltf";

let modelToParticle, modelToParticle2, particles;



const blueWhaleParticleParameters={
     subdivision:4,
     startScale:0.002,
    textureSize:0,
    particleSize:2,
    cloneParticle:1,
    particleTexture:smokeTexture,   
    startFloorScale:2,
    startFloorPosition:new THREE.Vector3(0,-1,0),
    startFloorRotation:new THREE.Vector3(-Math.PI / 2,0,0),
    uMinStartVelocity:Particles.PixelToNdc(5),
    uMaxStartVelocity:Particles.PixelToNdc(10),
    uStartVelocityDirection:new THREE.Vector3(1,1,0).normalize(),
    uMaxForce:Particles.PixelToNdc(4),
    uMaxVelocity:Particles.PixelToNdc(50),
    uLimitDistance:Particles.PixelToNdc(100),


    uFlowFieldDimension:4,
    uEachFlowFieldSquareDimension: 0.2,
    uRandomForceRatio:0.7, 
    uRandomForceParticleRatio:0.7,
    uMagicOrbitForceRatio:6,

    uMouseRayRadius:0.6,
    uMouseRayForce:0.1

}

const knightParticleParameters={
     subdivision:4,
     startScale:0.2,
     position:new THREE.Vector3(0,-1,0),
    textureSize:0,
    particleSize:2,
    cloneParticle:1,
    particleTexture:smokeTexture,   
    startFloorScale:2,
    startFloorPosition:new THREE.Vector3(0,-1,0),
    startFloorRotation:new THREE.Vector3(-Math.PI / 2,0,0),
    uMinStartVelocity:Particles.PixelToNdc(5),
    uMaxStartVelocity:Particles.PixelToNdc(10),
    uStartVelocityDirection:new THREE.Vector3(1,1,0).normalize(),
    uMaxForce:Particles.PixelToNdc(3),
    uMaxVelocity:Particles.PixelToNdc(30),
    uLimitDistance:Particles.PixelToNdc(200),


    uFlowFieldDimension:4,
    uEachFlowFieldSquareDimension: 0.2,
    uRandomForceRatio:0.7, 
    uRandomForceParticleRatio:0.7,
    uMagicOrbitForceRatio:6,

    uMouseRayRadius:0.6,
    uMouseRayForce:0.1

}

const guiParameters={
            models:"Blue whale"
        };

const initParticle=async function() {


         modelToParticle=new  AnimatedModelToParticle(renderer,orthoCamera);
          modelToParticle2=new  AnimatedModelToParticle(renderer,orthoCamera);
    
        await modelToParticle.LoadModel(modelLocation);
        await modelToParticle2.LoadModel(modelLocation2);
        modelToParticle.root.scale.set(blueWhaleParticleParameters.startScale,blueWhaleParticleParameters.startScale,blueWhaleParticleParameters.startScale);
        modelToParticle.root.rotation.y=Math.PI /2;
        modelToParticle.root.updateMatrixWorld(true);

        modelToParticle2.root.scale.set(knightParticleParameters.startScale,knightParticleParameters.startScale,knightParticleParameters.startScale);
        modelToParticle2.root.position.copy(knightParticleParameters.position)
        //modelToParticle.root.rotation.y=Math.PI /2;
        modelToParticle2.root.updateMatrixWorld(true);

        const particleInfo=modelToParticle.ConvertModelToParticles(blueWhaleParticleParameters.subdivision);
        const particleInfo2=modelToParticle2.ConvertModelToParticles(knightParticleParameters.subdivision);
        blueWhaleParticleParameters.textureSize=Math.max(particleInfo.textureDimension,particleInfo2.textureDimension);
        
        particles=new Particles(renderer,orthoCamera);
        particles.UpdateTargetTexture(particleInfo.positionTexture)
        particles.Init(blueWhaleParticleParameters);
              
        await particles.SetNoiseTexture({jsonUrl:"./noise/noise_50x50x50.json", binUrl:"./noise/noise_50x50x50.f32"}, blueWhaleParticleParameters)


        renderScene.add(particles.renderMesh);



        const options=[];
        options.push("Blue whale");
        options.push("Chess knight");
       
        gui.add(guiParameters,"models").options(options).onChange(()=>{

            if(guiParameters.models=="Blue whale"){
                 particles.ChangeModel(blueWhaleParticleParameters);

            }else if(guiParameters.models=="Chess knight"){

                particles.ChangeModel(knightParticleParameters);
            }

        })
      

}
initParticle();


//RayCaster Force
let mouseForceDirection=new THREE.Vector3(0,1,0);
const rayCaster=new RayCaster(canvas,perspectiveCamera);
canvas.addEventListener("mousemove",(event)=>{

  const ray=  rayCaster.getRayFromMouse(event);
  mouseForceDirection.copy(ray.direction);

});


//Post Processing

const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
        samples: 2
    }
)


// Effect composer
const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(window.innerWidth,window.innerHeight)

// Render pass
const renderPass = new RenderPass(renderScene, perspectiveCamera)
effectComposer.addPass(renderPass)


const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.enabled = true
effectComposer.addPass(unrealBloomPass)

unrealBloomPass.strength = 3.3
unrealBloomPass.radius = 0.1
unrealBloomPass.threshold = 0.05

window.addEventListener("resize",()=>{

      // Update effect composer
    effectComposer.setSize(window.innerWidth,window.innerHeight)
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


/**
 * Animate
 */

const clock = new THREE.Clock()
let previousTime = 0


const tick = () =>
{
    // Update controls
    controls.update()

    
      const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Model animation
   
    

    if(particles &&  modelToParticle){
        
        let particleInfo;

        if(guiParameters.models=="Blue whale"){

            particleInfo=  modelToParticle.UpdateAnimation(deltaTime);
            
        }else if(guiParameters.models=="Chess knight"){

            particleInfo=  modelToParticle2.UpdateAnimation(deltaTime);

        }

             particles.SetMouseForce(perspectiveCamera.position,mouseForceDirection);
            particles.UpdateTargetTexture(particleInfo.positionTexture)
            particles.Update(elapsedTime);
      //particles.renderMesh.material.uniforms.uPositionTexture.value=particleInfo.positionTexture

    }


    // Render
     effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()