import * as THREE from 'three';

const threejs = new THREE.WebGLRenderer();
document.body.appendChild(threejs.domElement);

threejs.setSize(800, 600);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);
camera.position.set(0, 0, 5);

async function load() {
    const vsh = await (await fetch("./shaders/shader.vert")).text();
    const fsh = await (await fetch("./shaders/shader.frag")).text();

    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Vector4(0, 1, 0, 1) }
        },
        vertexShader: vsh,
        fragmentShader: fsh
    });
    
    const box = new THREE.BoxGeometry(1, 1, 1);

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