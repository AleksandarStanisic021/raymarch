import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class SimonDevGLSLCourse {
  constructor() {}

  async initialize() {
    this.threejs_ = new THREE.WebGLRenderer();
    document.body.appendChild(this.threejs_.domElement);

    window.addEventListener(
      "resize",
      () => {
        this.onWindowResize_();
      },
      false,
    );

    this.scene_ = new THREE.Scene();

    this.camera_ = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1000);
    this.camera_.position.set(0, 0, 1);

    this.orbitCamera_ = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.orbitCamera_.position.set(0, 0, 0);
    this.controls_ = new OrbitControls(
      this.orbitCamera_,
      this.threejs_.domElement,
    );
    this.controls_.target.set(0, 0, 5);
    this.controls_.enableDamping = true;
    this.controls_.update();

    await this.setupProject_();

    this.previousRAF_ = null;
    this.onWindowResize_();
    this.raf_();
  }

  async setupProject_() {
    const vsh = await fetch("./shaders/raymarch.vert");
    const fsh = await fetch("./shaders/raymarch.frag");

    const material = new THREE.ShaderMaterial({
      uniforms: {
        resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        time: { value: 0.0 },
        rayOrigin: { value: new THREE.Vector3() },
        cameraForward: { value: new THREE.Vector3() },
        cameraRight: { value: new THREE.Vector3() },
        cameraUp: { value: new THREE.Vector3() },
        aspect: { value: window.innerWidth / window.innerHeight },
        tanHalfFov: {
          value: Math.tan(THREE.MathUtils.degToRad(this.orbitCamera_.fov * 0.5)),
        },
      },
      vertexShader: await vsh.text(),
      fragmentShader: await fsh.text(),
    });

    this.material_ = material;
    this.updateCameraUniforms_();

    const geometry = new THREE.PlaneGeometry(1, 1);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0.5, 0.5, 0);
    this.scene_.add(plane);

    this.totalTime_ = 0;
    this.onWindowResize_();
  }

  onWindowResize_() {
    const dpr = window.devicePixelRatio;
    const canvas = this.threejs_.domElement;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    this.threejs_.setSize(w * dpr, h * dpr, false);
    if (this.orbitCamera_) {
      this.orbitCamera_.aspect = w / h;
      this.orbitCamera_.updateProjectionMatrix();
    }
    if (this.material_) {
      this.material_.uniforms.aspect.value = w / h;
      this.material_.uniforms.resolution.value.set(
        window.innerWidth * dpr,
        window.innerHeight * dpr,
      );
    }
  }

  updateCameraUniforms_() {
    this.orbitCamera_.updateMatrixWorld();
    const uniforms = this.material_.uniforms;
    uniforms.rayOrigin.value.copy(this.orbitCamera_.position);
    uniforms.cameraForward.value
      .setFromMatrixColumn(this.orbitCamera_.matrixWorld, 2)
      .negate();
    uniforms.cameraRight.value.setFromMatrixColumn(
      this.orbitCamera_.matrixWorld,
      0,
    );
    uniforms.cameraUp.value.setFromMatrixColumn(
      this.orbitCamera_.matrixWorld,
      1,
    );
  }

  raf_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.step_(t - this.previousRAF_);
      this.threejs_.render(this.scene_, this.camera_);
      this.raf_();
      this.previousRAF_ = t;
    });
  }

  step_(timeElapsed) {
    this.controls_.update();
    this.updateCameraUniforms_();

    const timeElapsedS = timeElapsed * 0.001;
    this.totalTime_ += timeElapsedS;

    this.material_.uniforms.time.value = this.totalTime_;
  }
}

let APP_ = null;

window.addEventListener("DOMContentLoaded", async () => {
  APP_ = new SimonDevGLSLCourse();
  await APP_.initialize();
});
