const esbuild = require('esbuild');
const fs = require('fs-extra'); // 1. Импортируем fs-extra
const path = require('path');

// Определяем пути для удобства
const outDir = 'dist';
const modelsSrcDir = 'models';
const modelsDestDir = path.join(outDir, 'models');

async function build() {
    try {
        // 2. Очищаем папку dist перед каждой сборкой
        await fs.emptyDir(outDir);
        console.log('Cleaned the dist directory.');

        // 3. Копируем папку models в dist
        await fs.copy(modelsSrcDir, modelsDestDir);
        console.log('Copied models directory to dist.');

        // 4. Запускаем сборку esbuild как и раньше
        await esbuild.build({
            entryPoints: ['background.js'],
            bundle: true,
            outfile: path.join(outDir, 'background.bundle.js'), // Используем path.join для надежности
            format: 'esm',
            platform: 'browser',
            minify: true,
            sourcemap: true,
            external: ['chrome'],
            define: { 'global': 'globalThis' }
        });

        console.log('Build complete!');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Запускаем асинхронную функцию сборки
build();