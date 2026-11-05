import { lstat, readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export async function assertSafeFile(rootDir, relativePath) {
    const root = resolve(rootDir);
    const target = resolve(root, relativePath);
    const rel = relative(root, target);

    if (
        !rel ||
        rel === '..' ||
        rel.startsWith(`..${sep}`) ||
        isAbsolute(rel)
    ) {
        throw new Error(
            `Unsafe file path: ${relativePath}`
        );
    }

    let current = root;

    for (const part of rel.split(sep)) {
        current = resolve(current, part);

        const info = await lstat(current);

        if (info.isSymbolicLink()) {
            throw new Error(
                `Symbolic link forbidden: ${relativePath}`
            );
        }
    }

    const info = await lstat(target);

    if (!info.isFile()) {
        throw new Error(
            `Not a regular file: ${relativePath}`
        );
    }
}

export async function readSafeJson(rootDir, relativePath) {
    await assertSafeFile(rootDir, relativePath);

    const content = await readFile(
        resolve(rootDir, relativePath),
        'utf8'
    );

    return JSON.parse(content);
}
