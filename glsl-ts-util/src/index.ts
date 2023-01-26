import glslParser from '@shaderfrog/glsl-parser';
import glslAst from '@shaderfrog/glsl-parser/ast/index.js';
import type { DeclaratorListNode, Path } from '@shaderfrog/glsl-parser/ast';
import { readFileSync } from 'fs';

const { parser } = glslParser;
const { visit } = glslAst;

type Uniform = {
	type: string;
	name: string;
};

type Attribute = {
	type: string;
	name: string;
};

export type GlslDtsFile = {
	source: string;
	uniforms: Uniform[];
	attributes: Attribute[];
};

const defaultTypeMap = new Map();
defaultTypeMap.set('vec3', 'number[]');
defaultTypeMap.set('vec4', 'number[]');
defaultTypeMap.set('float', 'number');

function parseNode(node: DeclaratorListNode) {
	const spec_type = node.specified_type;
	const qualifiers = spec_type.qualifiers
		.map((q: { token: string }) => q.token)
		.join(' ');
	const type = spec_type.specifier.specifier.token;
	const identifier = node.declarations[0].identifier.identifier;
	return { qualifiers, type, identifier };
}

function createVisitor(uniforms: Uniform[], attributes: Attribute[]) {
	return {
		declarator_list: {
			enter: (path: Path<DeclaratorListNode>) => {
				const node = parseNode(path.node);
				if (node.qualifiers.includes('uniform')) {
					uniforms.push({ type: node.type, name: node.identifier });
				} else if (node.qualifiers.includes('attribute')) {
					attributes.push({ type: node.type, name: node.identifier });
				}
			},
			exit: () => undefined,
		},
	};
}

/**
 * Create a .d.ts resource from a GLSL source string
 *
 * @param source a GLSL source string
 * @param typeMap an optional mapping of GLSL types to some other type
 */
export function createDtsFromSource(
	source: string,
	typeMap?: Map<string, string>
): GlslDtsFile {
	const uniforms: Uniform[] = [];
	const attributes: Attribute[] = [];
	const visitor = createVisitor(uniforms, attributes);
	const ast = parser.parse(source);
	visit(ast, visitor);

	const uniformsTypesStr = uniforms
		.map(
			(u) =>
				`${u.name}: ${
					typeMap?.get(u.type) ?? defaultTypeMap.get(u.type) ?? u.type
				}`
		)
		.join(',');
	const attrsTypesStr = attributes
		.map(
			(a) =>
				`${a.name}: ${
					typeMap?.get(a.type) ?? defaultTypeMap.get(a.type) ?? a.type
				}`
		)
		.join(',');

	const dts = [
		'declare const shader: {',
		'  source: string;',
		`  uniforms: {${uniformsTypesStr}};`,
		`  attributes: {${attrsTypesStr}};`,
		'};',
		'export default shader;',
	].join('\n');

	return {
		uniforms,
		attributes,
		source: dts,
	};
}

/**
 * Create a .d.ts resource from a GLSL file
 *
 * @param filename a path to a GLSL file
 * @param typeMap an optional mapping of GLSL types to some other type
 */
export function createDtsFromFile(
	filename: string,
	typeMap?: Map<string, string>
): GlslDtsFile {
	const source = readFileSync(filename, { encoding: 'utf8' });
	return createDtsFromSource(source, typeMap);
}
