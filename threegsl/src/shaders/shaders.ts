import * as THREE from 'three';

type ThreeJSType<K> = K extends keyof ShaderPrimitives ? 
    ShaderPrimitives[K] :
    K extends Array<infer U> ?
        ThreeJSType<U>[] :
        K extends StructType ?
            { [Y in keyof K]: ThreeJSType<K[Y]> } :
    never;

type ShaderMaterialParameters<
    V extends ShaderType, 
    F extends ShaderType, 
    U = V & F> = Omit<
    THREE.ShaderMaterialParameters,
    'uniforms' | 'vertexShader' | 'fragmentShader'
> & {
    vertexShader: VertexShader<V>;
    fragmentShader: FragmentShader<F>;
    uniforms: {
        [K in keyof U]: THREE.IUniform<ThreeJSType<U[K]>>
    };
};

interface ShaderMaterial<F, V, U = F & V>
    extends Omit<THREE.ShaderMaterial, 'uniforms'> {
    uniforms: {
        [K in keyof U]: THREE.IUniform<U[K]>;
    };
}

export interface ShaderPrimitives {
    vec3: THREE.Vector3;
    float: number;
    int: number;
}

export interface StructType {
    [key: string]: keyof ShaderPrimitives | Array<keyof ShaderPrimitives | StructType> | StructType
}

export type ShaderType = StructType;

type Uniforms = ShaderType;

export interface Shader<U extends Uniforms> {
    source: string;
    uniforms: {
        [key in keyof U]: { name: string, type: U[key] };
    }
}

export interface FragmentShader<U extends Uniforms> extends Shader<U> {
}

export interface VertexShader<U extends Uniforms> extends Shader<U> {
    
}

export function createShaderMaterial<
    VU extends StructType, 
    V extends VertexShader<VU>,
    FU extends StructType,
    F extends FragmentShader<FU>,
>(
    parameters?: ShaderMaterialParameters<VU, FU>
) {
    let sm: THREE.ShaderMaterial;

    if (parameters) {
        const { vertexShader, fragmentShader, uniforms, ...rest } = parameters;
        sm = new THREE.ShaderMaterial({
            ...rest,
            vertexShader: vertexShader.source,
            fragmentShader: fragmentShader.source,
        });
    } else {
        sm = new THREE.ShaderMaterial();
    }

    return sm as ShaderMaterial<F, V>;
}