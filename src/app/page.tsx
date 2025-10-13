import { Timetable } from "@/components/timetable/Timetable";
import { loadChannels, loadStreams, loadConfig } from "@/lib/data-loader";

export default async function Home() {
  const [channelsData, streamsData, config] = await Promise.all([
    loadChannels(),
    loadStreams(),
    loadConfig(),
  ]);

  return (
    <Timetable
      channels={channelsData.channels}
      streams={streamsData.streams}
      config={config}
    />
  );
}
