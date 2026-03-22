import * as THREE from "three"




class SkinnedMesh extends THREE.Mesh {
    constructor(geometry, material) {
        super(geometry, material);

        this.isSkinnedMesh = true;
        this.type = 'SkinnedMesh';

        this.bindMatrix = new THREE.Matrix4();
        this.bindMatrixInverse = new THREE.Matrix4();
        this.skeleton = null;
    }
}


class RayCaster{

canvas;
camera;

constructor(canvas,camera){
    this.camera=camera;
    this.canvas=canvas;
}


#getMouseNDC(event) {

    
    const mouseNdc = new THREE.Vector2();

    const rect = this.canvas.getBoundingClientRect();

    mouseNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    return mouseNdc;
}

getRayFromMouse(event) {
    const ndc = this.#getMouseNDC(event);

    const nearPoint = new THREE.Vector3(ndc.x, ndc.y, -1).unproject(this.camera);
    const farPoint  = new THREE.Vector3(ndc.x, ndc.y,  1).unproject(this.camera);

    const origin = nearPoint.clone(); //camera->near->far same line
    const direction = new THREE.Vector3().subVectors(farPoint,nearPoint).normalize();

    return { nearPoint,farPoint, direction };
}


getRayFromCoordinate(x,y){ //x: -1 to 1  y: -1 to 1


    const nearPoint = new THREE.Vector3(x,y, -1).unproject(this.camera);
    const farPoint  = new THREE.Vector3(x,y,  1).unproject(this.camera);

    const origin = nearPoint.clone(); //camera->near->far same line
    const direction = new THREE.Vector3().subVectors(farPoint,nearPoint).normalize();

    return { nearPoint,farPoint, direction };
} 




}




export {RayCaster}