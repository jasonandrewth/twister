precision mediump float;

uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uTint;
uniform sampler2D uDiffuse;

varying vec2 vUv;
varying float vRandom;
varying float vTime;
varying vec3 vPosition;

// uniform float uTime;

void main() {

    vec3 colour = vec3(0.0);
    colour.rg = vUv;

    gl_FragColor = vec4(colour, 1.);
}