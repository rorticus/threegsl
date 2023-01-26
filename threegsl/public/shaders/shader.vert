precision mediump float;

attribute vec3 a_color;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_color = a_color;
    v_normal = normalMatrix * normal;
    v_position = (modelMatrix * vec4(position, 1.0)).xyz;
}