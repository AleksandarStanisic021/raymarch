uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

float sceneSDF(vec3 point) {
  return length(point) - 0.5;
}

void main() {
  vec2 uv = (vUv * uResolution - 0.5 * uResolution) / uResolution.y;
  vec3 rayOrigin = vec3(0.0, 0.0, 2.0);
  vec3 rayDirection = normalize(vec3(uv, -1.0));

  float distanceAlongRay = 0.0;
  float distanceToScene = 0.0;
  bool hit = false;

  for (int step = 0; step < 100; step++) {
    vec3 point = rayOrigin + rayDirection * distanceAlongRay;
    distanceToScene = sceneSDF(point);

    if (distanceToScene < 0.001) {
      hit = true;
      break;
    }

    distanceAlongRay += distanceToScene;

    if (distanceAlongRay > 20.0) {
      break;
    }
  }

  vec3 color = hit ? vec3(0.8, 0.9, 1.0) : vec3(0.0);
  gl_FragColor = vec4(color, 1.0);
}
