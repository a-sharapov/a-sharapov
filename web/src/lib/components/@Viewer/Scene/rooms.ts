import { isClient } from '#lib/common/utils.ts';
import { adoptRoom, type Room } from './staging';
import type { Actor } from './state.svelte';

var _AVAILABLE = isClient && typeof Worker !== 'undefined';

export var warmRoomsAside = (actors: Actor[]): void =>
  void (
    _AVAILABLE &&
    ((left: Set<Actor>, worker: Worker) => {
      worker.onmessage = ({
        data: { actor, room },
      }: MessageEvent<{ actor: Actor; room: Room }>) =>
        void (adoptRoom(actor, room),
        left.delete(actor),
        left.size || worker.terminate());
      worker.onerror = () => worker.terminate();
      worker.postMessage(actors);
    })(
      new Set(actors),
      new Worker(new URL('./rooms.worker.ts', import.meta.url), {
        type: 'module',
      })
    )
  );
