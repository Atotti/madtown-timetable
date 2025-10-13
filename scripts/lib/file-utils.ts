import { promises as fs } from "fs";
import path from "path";

export async function writeJSON(
  filePath: string,
  data: unknown,
): Promise<void> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  await fs.writeFile(absolutePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readJSON<T = unknown>(filePath: string): Promise<T> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const content = await fs.readFile(absolutePath, "utf-8");
  return JSON.parse(content) as T;
}
