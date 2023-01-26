import { createFilter } from '@rollup/pluginutils';
import { createDtsFromFile } from 'glsl-ts-util';
import { promises } from 'fs';

const { writeFile } = promises;

// TODO: make this a plugin option
const generateDtsFiles = false;

const typeMap = new Map();
typeMap.set('vec4', 'THREE.Vector4');
typeMap.set('float', 'number');

export default function transformGlslPlugin() {
	const filter = createFilter(['**/*.vert', '**/*.frag']);

	return {
		name: 'vite-plugin-glsl-ts',

		async transform(source: string, id: string) {
			if (!filter(id)) {
				return;
			}

			const dts = createDtsFromFile(id, typeMap);

			if (generateDtsFiles) {
				writeFile(`${id}.d.ts`, dts.source, { encoding: 'utf8' });
			}

			const uniformsNamesStr = dts.uniforms
				.map((u) => `${u.name}: '${u.name}'`)
				.join(',');
			const attrsNamesStr = dts.attributes
				.map((a) => `${a.name}: '${a.name}'`)
				.join(',');

			return {
				code: `export default {
                    source: [${JSON.stringify(source)}][0],
                    uniforms: {${uniformsNamesStr}},
                    attributes: {${attrsNamesStr}},
                };`,
			};
		},
	};
}
