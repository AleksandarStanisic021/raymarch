import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import vertexShader from '../shaders/raymarch.vert?raw';
import fragmentShader from '../shaders/raymarch.frag?raw';
import './style.css';

const scene = new THREE.Scene();

const displayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
displayCamera.position.z = 1;

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uResolution: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uCameraPosition: { value: new THREE.Vector3() },
    uCameraRight: { value: new THREE.Vector3() },
    uCameraUp: { value: new THREE.Vector3() },
    uCameraForward: { value: new THREE.Vector3() },
    uCameraFov: { value: Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) },
  },
});
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(plane);

const clock = new THREE.Clock();
const right = new THREE.Vector3(1, 0, 0);
const up = new THREE.Vector3(0, 1, 0);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.getDrawingBufferSize(material.uniforms.uResolution.value);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

function animate() {
  controls.update();
  camera.updateMatrixWorld();
  material.uniforms.uCameraPosition.value.copy(camera.position);
  material.uniforms.uCameraRight.value.copy(right).applyQuaternion(camera.quaternion);
  material.uniforms.uCameraUp.value.copy(up).applyQuaternion(camera.quaternion);
  camera.getWorldDirection(material.uniforms.uCameraForward.value);
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, displayCamera);
}

renderer.setAnimationLoop(animate);
