import { getContext, setContext } from 'svelte';
import type { Translate } from '$lib/common/types';
import { localize, lookup } from '$lib/common/utils';

const _KEY = 'getTranslation';

export type Dictionary = Record<string, unknown>;

export var provideTranslation = (dictionary: () => Dictionary): void =>
  void setContext(_KEY, () => localize(dictionary()));

export var useTranslation = (): (() => Translate) =>
  getContext<() => Translate>(_KEY);

export var listOf = (dictionary: Dictionary, key: string): string[] =>
  ((value) => (Array.isArray(value) ? value.map(String) : []))(
    lookup<unknown>(dictionary, key, [])
  );
