import * as THREE from 'three';
import vsh from '../public/shaders/shader.vert';

const threejs = new THREE.WebGLRenderer();
document.body.appendChild(threejs.domElement);

threejs.setSize(800, 600);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);
camera.position.set(0, 0, 5);

async function load() {
    // const vsh = await (await fetch("./shaders/shader.vert")).text();
    const fsh = await (await fetch("./shaders/shader.frag")).text();
    
    const light1 = {
        dir: new THREE.Vector3(1, 1, -1),
        color: new THREE.Vector3(1, 1, 1),
        intensity:  0.5 
    }

    const light2 = {
        dir: new THREE.Vector3(0, -1, 0),
        color: new THREE.Vector3(0, 0, 1),
        intensity:  0.5
    }

    const light3 = {
        dir: new THREE.Vector3(0, 0, 0),
        color: new THREE.Vector3(0, 0, 0),
        intensity:  0
    }

    const material = new THREE.ShaderMaterial({
        uniforms: {
            u_lights: { value: [light1, light2, light3] },
            u_numLights: { value: 2 },
        },
        vertexShader: vsh,
        fragmentShader: fsh
    });
    
    const colors = new Float32Array(24 * 3);
    for(let i = 0; i < 24 * 3; i++) {
        colors[i] = Math.random() / 2 + 0.5;
    }
    
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.setAttribute('a_color', new THREE.BufferAttribute(colors, 3));

    const mesh = new THREE.Mesh(box, material);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    
    function rotate() {
        mesh.rotation.y += 0.01;
        mesh.rotation.x += 0.01;
        mesh.rotation.z += 0.005;
        requestAnimationFrame(rotate);
    }
    rotate();
}

load();

function raf() {
    threejs.render(scene, camera);
    requestAnimationFrame(raf);
}
raf();