import {FragmentShader} from "./shaders";

export default {
    source: `precision mediump float;

const int MAX_LIGHTS = 3;

struct Light {
    vec3 dir;
    vec3 color;
    float intensity;
};

uniform Light u_lights[MAX_LIGHTS];
uniform int u_numLights;

uniform float u_time;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(cameraPosition - v_position);
    vec3 ambient = vec3(0.1);

    vec3 diffuse = vec3(0);

    for(int i = 0; i < MAX_LIGHTS; i++) {
        if(i >= u_numLights) {
            break;
        }

        Light light = u_lights[i];

        // phong shading
        vec3 r = normalize(reflect(normalize(light.dir), normal));
        float phong = max(dot(viewDir, r), 0.0);
        phong = pow(phong, 32.0);

        vec3 specular = vec3(phong);

        diffuse += light.color * light.intensity * max(dot(normal, -light.dir), 0.0) + specular;
    }

    gl_FragColor =  vec4(v_color, 1.0) * vec4(ambient + diffuse, 1.0);
}`,
    uniforms: {
        u_time: { name: 'u_time', type: 'float' },
        u_numLights: { name: 'u_numLights', type: 'int' },
    }
} as FragmentShader<{
    u_time: 'float',
    u_numLights: 'int',
    u_floatArray: 'float'[],
    u_lights: {
        dir: 'vec3',
        color: 'vec3',
        intensity: 'float',
    }[]
}>;