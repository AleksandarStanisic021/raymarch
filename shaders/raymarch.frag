
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

// The map function calculates the overall SDF.
// Maybe a better name would be calculateSceneSDF().
float map(vec3 pos) {
  float dist = sdfBox(pos - vec3(0.0, 0.0, 5.0), vec3(0.5, 0.2, 0.2));

  return dist;
}

const int NUM_STEPS = 256;
const float MAX_DIST = 1000.0;

// Performs sphere tracing for the scene.
vec3 RayMarch(vec3 cameraOrigin, vec3 cameraDir) {
  float dist = 0.0;

  for (int i = 0; i < NUM_STEPS; ++i) {
    vec3 pos = cameraOrigin + dist * cameraDir;

    float distToScene = map(pos);

    if (distToScene < 0.001) {
      return vec3(1.0);
    }
    dist += distToScene;

    if (dist > MAX_DIST) {
      return vec3(1.0, 0.0, 1.0);
    }
  }

  return vec3(1.0, 0.0, 0.0);
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
