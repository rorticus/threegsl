import * as path from 'path';
import tsModule from 'typescript/lib/tsserverlibrary';
import { getDtsSnapshot, isGlsl } from './util';

function init(modules: {
	typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
	const ts = modules.typescript;

	function create(info: ts.server.PluginCreateInfo) {
		// Diagnostic logging
		info.project.projectService.logger.info('>>> Initializing ts-plugin-glsl');

		const tsCreateLanguageServiceSourceFile =
			ts.createLanguageServiceSourceFile;
		ts.createLanguageServiceSourceFile = (
			filename,
			scriptSnapshot,
			...rest
		) => {
			if (!filename.includes('node_modules')) {
				info.project.projectService.logger.info(
					`>>> Creating sourceFile for ${filename}`
				);
			}

			if (isGlsl(filename)) {
				scriptSnapshot = getDtsSnapshot(ts, scriptSnapshot);
			}

			const sourcefile = tsCreateLanguageServiceSourceFile(
				filename,
				scriptSnapshot,
				...rest
			);

			if (isGlsl(filename)) {
				sourcefile.isDeclarationFile = true;
			}

			return sourcefile;
		};

		const tsUpdateLanguageServiceSourceFile =
			ts.updateLanguageServiceSourceFile;
		ts.updateLanguageServiceSourceFile = (
			sourceFile,
			scriptSnapshot,
			...rest
		) => {
			info.project.projectService.logger.info(
				`>>> Updating sourceFile for ${sourceFile.fileName}`
			);

			if (isGlsl(sourceFile.fileName)) {
				scriptSnapshot = getDtsSnapshot(ts, scriptSnapshot);
			}

			sourceFile = tsUpdateLanguageServiceSourceFile(
				sourceFile,
				scriptSnapshot,
				...rest
			);

			if (isGlsl(sourceFile.fileName)) {
				sourceFile.isDeclarationFile = true;
			}

			return sourceFile;
		};

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
					try {
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
					} catch (error) {
					}
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
