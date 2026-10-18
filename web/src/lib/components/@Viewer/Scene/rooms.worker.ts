import { roomOf } from './staging';
import type { Actor } from './state.svelte';

addEventListener(
  'message',
  ({ data: actors }: MessageEvent<Actor[]>) =>
    void actors.forEach(
      (actor) => void postMessage({ actor, room: roomOf(actor) })
    )
);
