"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Loader2 } from "lucide-react";
import { User } from "@/generated/prisma";


interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
  user: User;
}

const tracksSource = [
  { source: Track.Source.Camera, withPlaceholder: false },
  { source: Track.Source.ScreenShare, withPlaceholder: false },
];

export const MediaRoom = ({ chatId, video, audio, user }: MediaRoomProps) => {
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!user?.name) return;

    const name = `${user.name}`;

    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${chatId}&username=${name}&userId=${user.id}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.log(e);
      }
    })();
  }, [user?.name, user?.id, chatId]);

  if (token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={video}
      audio={audio}
      onError={(e) => console.log(e)}
    >
      <MyVideoConference />
      <RoomAudioRenderer />
      <ControlBar />
    </LiveKitRoom>
  );
};

function MyVideoConference() {
  const tracks = useTracks(
    tracksSource,
    { onlySubscribed: true }
  );

  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "calc(100% - var(--lk-control-bar-height))" }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}
