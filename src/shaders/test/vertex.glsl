uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform float uTime;
uniform vec2 uMouse;
uniform float uAngle;

varying vec2 vUv;
varying float vRandom;
varying float vTime;
varying vec3 vPosition;

attribute vec3 position;
attribute float aRandom;
attribute vec2 uv;

void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += sin(modelPosition.y * 20.) * abs(uAngle / 10.);
    // modelPosition.z += aRandom * 0.1;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    vUv = uv;
    vRandom = aRandom;
    vTime = uTime;
    vPosition = position;

    gl_Position = projectedPosition;

    // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}