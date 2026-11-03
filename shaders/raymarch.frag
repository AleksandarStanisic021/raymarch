
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
  float boxDistance = sdTorus(pos - vec3(0.0, 0.0, 5.0), vec2(0.5, 0.2));
  float groundDistance = pos.y + 0.2;
  return min(boxDistance, groundDistance);
}

const int NUM_STEPS = 256;
const float MAX_DIST = 1000.0;

float RayMarch(vec3 rayOrigin, vec3 rayDirection) {
  float dist = 0.0;

  for (int i = 0; i < NUM_STEPS; ++i) {
    float distToScene = map(rayOrigin + dist * rayDirection);
    if (distToScene < 0.001) {
      return dist;
    }
    dist += distToScene;
    if (dist > MAX_DIST) {
      break;
    }
  }

  return -1.0;
}

vec3 calculateNormal(vec3 pos) {
  const float epsilon = 0.001;
  return normalize(vec3(
    map(pos + vec3(epsilon, 0.0, 0.0)) - map(pos - vec3(epsilon, 0.0, 0.0)),
    map(pos + vec3(0.0, epsilon, 0.0)) - map(pos - vec3(0.0, epsilon, 0.0)),
    map(pos + vec3(0.0, 0.0, epsilon)) - map(pos - vec3(0.0, 0.0, epsilon))
  ));
}

float softShadow(vec3 rayOrigin, vec3 rayDirection) {
  float result = 1.0;
  float dist = 0.02;
  const float softness = 8.0;

  for (int i = 0; i < 64; ++i) {
    float sceneDist = map(rayOrigin + rayDirection * dist);
    if (sceneDist < 0.001) {
      return 0.0;
    }

    result = min(result, softness * sceneDist / dist);
    dist += clamp(sceneDist, 0.02, 0.5);
    if (dist > 20.0) {
      break;
    }
  }

  return clamp(result, 0.0, 1.0);
}

void main() {
  vec2 screenCoords = (vUvs * 2.0) - 1.0;
  vec3 rayDir = normalize(
    cameraForward
    + cameraRight * screenCoords.x * aspect * tanHalfFov
    + cameraUp * screenCoords.y * tanHalfFov
  );

  float hitDistance = RayMarch(rayOrigin, rayDir);
  vec3 colour = vec3(0.0);

  if (hitDistance >= 0.0) {
    vec3 hitPosition = rayOrigin + rayDir * hitDistance;
    vec3 normal = calculateNormal(hitPosition);
    vec3 lightDirection = normalize(vec3(-0.5, 0.8, -0.6));
    float shadow = softShadow(hitPosition + normal * 0.002, lightDirection);
    float diffuse = max(dot(normal, lightDirection), 0.0) * shadow;

    vec3 baseColour = hitPosition.y < -0.199
      ? vec3(0.32, 0.38, 0.46)
      : vec3(0.85, 0.55, 0.28);
    vec3 viewDirection = normalize(rayOrigin - hitPosition);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 48.0) * shadow;

    colour = baseColour * (0.12 + 0.88 * diffuse) + vec3(0.25) * specular;
  }

  gl_FragColor = vec4(pow(colour, vec3(1.0 / 2.2)), 1.0);
}
