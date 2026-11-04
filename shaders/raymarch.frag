
varying vec2 vUvs;
uniform vec2 resolution;
uniform float time;
uniform vec3 rayOrigin;
uniform vec3 cameraForward;
uniform vec3 cameraRight;
uniform vec3 cameraUp;
uniform float aspect;
uniform float tanHalfFov;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

float sdfSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdfBox( vec3 p, vec3 b ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

vec2 map(vec3 pos) {
  vec2 scene = vec2(sdfSphere(pos - vec3(0.0, 0.0, 5.0), 0.5), 1.0);
  vec2 box = vec2(sdfBox(pos - vec3(1.4, 0.0, 5.0), vec3(0.5)), 2.0);
  vec2 torus = vec2(sdTorus(pos - vec3(-1.4, 0.0, 5.0), vec2(0.5, 0.2)), 3.0);

  if (box.x < scene.x) {
    scene = box;
  }
  if (torus.x < scene.x) {
    scene = torus;
  }
  return scene;
}

vec3 calculateNormal(vec3 pos) {
  const float epsilon = 0.001;
  return normalize(vec3(
    map(pos + vec3(epsilon, 0.0, 0.0)).x - map(pos - vec3(epsilon, 0.0, 0.0)).x,
    map(pos + vec3(0.0, epsilon, 0.0)).x - map(pos - vec3(0.0, epsilon, 0.0)).x,
    map(pos + vec3(0.0, 0.0, epsilon)).x - map(pos - vec3(0.0, 0.0, epsilon)).x
  ));
}

vec3 shadeSurface(vec3 pos, vec3 rayDir, float materialId) {
  vec3 baseColor;
  float roughness;
  float metallic;

  if (materialId < 1.5) {
    baseColor = vec3(0.85, 0.12, 0.08);
    roughness = 0.18;
    metallic = 0.75;
  } else if (materialId < 2.5) {
    baseColor = vec3(0.08, 0.32, 0.9);
    roughness = 0.82;
    metallic = 0.0;
  } else {
    baseColor = vec3(1.0, 0.58, 0.08);
    roughness = 0.32;
    metallic = 0.9;
  }

  vec3 normal = calculateNormal(pos);
  vec3 lightDir = normalize(vec3(-0.5, 0.8, -0.6));
  vec3 viewDir = normalize(-rayDir);
  vec3 halfDir = normalize(lightDir + viewDir);
  float diffuse = max(dot(normal, lightDir), 0.0);
  float specularPower = mix(128.0, 8.0, roughness);
  float specular = pow(max(dot(normal, halfDir), 0.0), specularPower);
  vec3 specularColor = mix(vec3(0.96), baseColor, metallic);

  return baseColor * (0.16 + diffuse * 0.84) + specularColor * specular * (1.0 - roughness * 0.55);
}

const int NUM_STEPS = 256;
const float MAX_DIST = 1000.0;

vec3 RayMarch(vec3 cameraOrigin, vec3 cameraDir) {
  float dist = 0.0;

  for (int i = 0; i < NUM_STEPS; ++i) {
    vec3 pos = cameraOrigin + dist * cameraDir;

    vec2 scene = map(pos);

    if (scene.x < 0.001) {
      return shadeSurface(pos, cameraDir, scene.y);
    }
    dist += scene.x;

    if (dist > MAX_DIST) {
      return vec3(0.025, 0.035, 0.06);
    }
  }

  return vec3(0.025, 0.035, 0.06);
}

void main() {
  vec2 screenCoords = (vUvs * 2.0) - 1.0;
  vec3 rayDir = normalize(
    cameraForward
    + cameraRight * screenCoords.x * aspect * tanHalfFov
    + cameraUp * screenCoords.y * tanHalfFov
  );

  vec3 colour = RayMarch(rayOrigin, rayDir);

  gl_FragColor = vec4(pow(colour, vec3(1.0 / 2.2)), 1.0);
}
