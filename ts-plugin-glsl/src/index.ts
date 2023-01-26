import * as path from 'path';
import tsModule from 'typescript/lib/tsserverlibrary';
import { getDtsSnapshot, isGlsl } from './util';

function init(modules: {
	typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
	const ts = modules.typescript;

	function create(info: ts.server.PluginCreateInfo) {
		info.project.projectService.logger.info('>>> Initializing ts-plugin-glsl');

		// Get the file snapshot. If it's a GLSL file, the snapshot will be for
		// a virtual .d.ts file. Otherwise, just pass through the original
		// snapshot.
		const getSnapshot = (
			filename: string,
			scriptSnapshot: ts.IScriptSnapshot
		) => {
			if (isGlsl(filename)) {
				// replace the default GLSL snapshot with one that has a
				// generated .d.ts file as its content
				return getDtsSnapshot(ts, scriptSnapshot);
			}

			return scriptSnapshot;
		};

		// Ensure the sourceFile object for a GLSL file is flagged as a
		// declaration file.
		const checkSourceFile = (filename: string, sourceFile: ts.SourceFile) => {
			if (isGlsl(filename)) {
				// GLSL files will always end up as declaration files
				sourceFile.isDeclarationFile = true;
			}
			return sourceFile;
		};

		// Create source file entries
		const tsCreateLanguageServiceSourceFile =
			ts.createLanguageServiceSourceFile;
		ts.createLanguageServiceSourceFile = (
			filename,
			scriptSnapshot,
			...rest
		) => {
			if (!filename.includes('node_modules')) {
				info.project.projectService.logger.info(
					`>>> Creating source file entry for ${filename}`
				);
			}
			return checkSourceFile(
				filename,
				tsCreateLanguageServiceSourceFile(
					filename,
					getSnapshot(filename, scriptSnapshot),
					...rest
				)
			);
		};

		// Update source file entries when file content changes
		const tsUpdateLanguageServiceSourceFile =
			ts.updateLanguageServiceSourceFile;
		ts.updateLanguageServiceSourceFile = (
			sourceFile,
			scriptSnapshot,
			...rest
		) => {
			if (!sourceFile.fileName.includes('node_modules')) {
				info.project.projectService.logger.info(
					`>>> Updating source file entry for ${sourceFile.fileName}`
				);
			}
			return checkSourceFile(
				sourceFile.fileName,
				tsUpdateLanguageServiceSourceFile(sourceFile, scriptSnapshot, ...rest)
			);
		};

		// Update the module resolution logic to handle GLSL files
		if (info.languageServiceHost.resolveModuleNames) {
			const tsResolveModuleNames =
				info.languageServiceHost.resolveModuleNames.bind(
					info.languageServiceHost
				);
			info.languageServiceHost.resolveModuleNames = (
				moduleNames,
				containingFile,
				...rest
			) => {
				const resolvedModules = tsResolveModuleNames(
					moduleNames,
					containingFile,
					...rest
				);

				return moduleNames.map((moduleName, index) => {
					if (isGlsl(moduleName)) {
						// resolve GLSL files to virtual .d.ts files
						return {
							extension: tsModule.Extension.Dts,
							isExternalLibraryImport: false,
							resolvedFileName: path.resolve(
								path.dirname(containingFile),
								moduleName
							),
						};
					}

					return resolvedModules[index];
				});
			};
		}
	}

	return { create };
}

export = init;
