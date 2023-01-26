import tsModule from 'typescript/lib/tsserverlibrary';
import { createDtsFromSource } from 'glsl-ts-util';

export function isGlsl(filename: string) {
	return filename.endsWith('.vert') || filename.endsWith('.frag');
}

export function getDtsSnapshot(
	ts: typeof tsModule,
	scriptSnapshot: ts.IScriptSnapshot
) {
	const source = scriptSnapshot.getText(0, scriptSnapshot.getLength());
	const dts = createDtsFromSource(source);
	return ts.ScriptSnapshot.fromString(dts);
}
