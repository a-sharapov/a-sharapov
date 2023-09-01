import { writable } from "svelte/store";

type StateMachine<S, E> = (state: S, event: E) => S;

/**
 * λ -> Implementation of a state machine using Svelte stores.
 *
 * @template S
 * @template E
 * @template M
 * @param {M} machine
 * @param {S} initialState
 * @returns {{ state: any; send: (event: E) => void; }}
 *
 * @example
 * const anyMachine = (state: "idle" | "running", event: "start" | "stop") => {
 *    switch (state) {
 *       case "idle":
 *         switch (event) {
 *           case "start":
 *             return "running";
 *           default:
 *             return state;
 *         }
 *       case "running":
 *         switch (event) {
 *           case "stop":
 *             return "idle";
 *           default:
 *             return state;
 *         }
 *       default:
 *         return state;
 *     }
 *   };
 *
 *  const {state, sendEvent} = stateMachine(anyMachine, "idle");
 */
export const stateMachine = <S extends object, E, M extends StateMachine<S, E>>(
  machine: M,
  initialState: S
) => {
  const state = writable(initialState);

  return {
    state,
    sendEvent: (event: E) => {
      state.update((state) => machine(state, event));
    },
  };
};
