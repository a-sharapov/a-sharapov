import { writable } from "svelte/store";

export let loading = writable<boolean>(true);

export type ImageInPreview = {
  src: string;
  gallery: string[];
  title?: string;
  description?: string;
} | null;
export let imageInPreview = writable<ImageInPreview>(null);
