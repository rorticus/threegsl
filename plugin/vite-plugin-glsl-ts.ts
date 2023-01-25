import { createFilter } from '@rollup/pluginutils';
import glslParser from '@shaderfrog/glsl-parser';
import glslAst from '@shaderfrog/glsl-parser/ast';
import type { DeclaratorListNode, Path } from '@shaderfrog/glsl-parser/ast';
import { promises } from 'fs';

const { parser } = glslParser;
const { visit } = glslAst;
const { writeFile } = promises;

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
    const qualifiers = (spec_type.qualifiers || [])
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

export default function transformGlslPlugin() {
    const filter = createFilter(['**/*.vert', '**/*.frag']);

    return {
        name: 'vite-plugin-glsl-ts',

        async transform(source: string, id: string) {
            if (!filter(id)) {
                return;
            }

            const uniforms: Uniform[] = [];
            const attributes: Attribute[] = [];
            const visitor = createVisitor(uniforms, attributes);
            const ast = parser.parse(source);
            visit(ast, visitor);

            const typeName = `${id}.d.ts`;
            const uniformsTypesStr = uniforms
                .map((u) => `${u.name}: string`)
                .join(',');
            const attrsTypesStr = attributes
                .map((a) => `${a.name}: string`)
                .join(',');

            writeFile(
                typeName,
                `declare const shader: {
                    source: string;
                    uniforms: {${uniformsTypesStr}};
                    attributes: {${attrsTypesStr}};
                }; export default shader;`,
                { encoding: 'utf8' }
            );

            const uniformsNamesStr = uniforms
                .map((u) => `${u.name}: '${u.name}'`)
                .join(',');
            const attrsNamesStr = attributes
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