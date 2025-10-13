import { promises as fs } from "fs";
import path from "path";
import type { ChannelsData, StreamsData, Config } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

export async function loadChannels(): Promise<ChannelsData> {
  const filePath = path.join(DATA_DIR, "channels.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
}

export async function loadStreams(): Promise<StreamsData> {
  const filePath = path.join(DATA_DIR, "streams.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
}

export async function loadConfig(): Promise<Config> {
  const filePath = path.join(DATA_DIR, "config.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
}
