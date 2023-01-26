import * as path from 'path';
import tsModule from 'typescript/lib/tsserverlibrary';
import { getDtsSnapshot, isGlsl } from './util';

function init(modules: {
	typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
	const ts = modules.typescript;

	function create(info: ts.server.PluginCreateInfo) {
		info.project.projectService.logger.info('>>> Initializing ts-plugin-glsl');

		const getSnapshot = (
			filename: string,
			scriptSnapshot: ts.IScriptSnapshot
		) => {
			if (!filename.includes('node_modules')) {
				info.project.projectService.logger.info(
					`>>> Updating sourceFile for ${filename}`
				);
			}

			if (isGlsl(filename)) {
				// replace the default GLSL snapshot with one that has a
				// generated .d.ts file as its content
				return getDtsSnapshot(ts, scriptSnapshot);
			}

			return scriptSnapshot;
		};

		const updateSourceFile = (filename: string, sourceFile: ts.SourceFile) => {
			if (isGlsl(filename)) {
				// GLSL files will always end up as declaration files
				sourceFile.isDeclarationFile = true;
			}
			return sourceFile;
		};

		// Create source file entries
		const tsCreateLanguageServiceSourceFile =
			ts.createLanguageServiceSourceFile;
		ts.createLanguageServiceSourceFile = (filename, scriptSnapshot, ...rest) =>
			updateSourceFile(
				filename,
				tsCreateLanguageServiceSourceFile(
					filename,
					getSnapshot(filename, scriptSnapshot),
					...rest
				)
			);

		// Update source file entries when file content changes
		const tsUpdateLanguageServiceSourceFile =
			ts.updateLanguageServiceSourceFile;
		ts.updateLanguageServiceSourceFile = (
			sourceFile,
			scriptSnapshot,
			...rest
		) =>
			updateSourceFile(
				sourceFile.fileName,
				tsUpdateLanguageServiceSourceFile(sourceFile, scriptSnapshot, ...rest)
			);

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

		info.project.projectService.logger.info('>>> Initialized ts-plugin-glsl');
	}

	function getExternalFiles(project: tsModule.server.ConfiguredProject) {
		return project.getFileNames().filter(isGlsl);
	}

	return { create, getExternalFiles };
}

export = init;
