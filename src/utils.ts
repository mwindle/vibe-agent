import path from 'path';

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let pathRestriction: string;
export function setPathRestriction(
    parentPath: string = process.env.AGENT_PATH_RESTRICTION || process.cwd()
): void {
    pathRestriction = parentPath;
}

export function getPathRestriction(): string {
    const currentPath = path.parse(pathRestriction || process.cwd());
    return path.resolve(currentPath.root, currentPath.dir);
}

export function checkPath(target: string): boolean {
    const targetPath = path.parse(target);
    const targetAbsPath = path.resolve(targetPath.root, targetPath.dir);
    return targetAbsPath.startsWith(getPathRestriction());
}
