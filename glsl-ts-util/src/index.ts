import * as glslParser from '@shaderfrog/glsl-parser';
import * as glslAst from '@shaderfrog/glsl-parser/ast';
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

export function createDtsFromSource(source: string) {
	const uniforms: Uniform[] = [];
	const attributes: Attribute[] = [];
	const visitor = createVisitor(uniforms, attributes);
	const ast = parser.parse(source);
	visit(ast, visitor);

	const uniformsTypesStr = uniforms.map((u) => `${u.name}: string`).join(',');
	const attrsTypesStr = attributes.map((a) => `${a.name}: string`).join(',');

	return [
		'declare const shader: {',
		'  source: string;',
		`  uniforms: {${uniformsTypesStr}};`,
		`  attributes: {${attrsTypesStr}};`,
		'};',
		'export default shader;',
	].join('\n');
}

export function createDtsFromFile(filename: string) {
	const source = readFileSync(filename, { encoding: 'utf8' });
	return createDtsFromSource(source);
}
