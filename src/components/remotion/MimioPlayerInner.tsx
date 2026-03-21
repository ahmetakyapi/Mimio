"use client";

import { Player } from "@remotion/player";
import { MimioIntro } from "./MimioIntro";

type Props = { readonly theme?: "dark" | "light" };

export default function MimioPlayerInner({ theme = "dark" }: Props) {
  return (
    <Player
      component={MimioIntro}
      inputProps={{ theme }}
      durationInFrames={840}
      compositionWidth={640}
      compositionHeight={480}
      fps={30}
      loop
      autoPlay
      controls={false}
      style={{ width: "100%", display: "block" }}
    />
  );
}
