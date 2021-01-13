import { writable } from 'svelte/store';

export const localStore = <T>(key: string, defaultValue?: T) => {
  if (typeof window !== "undefined") {
    defaultValue = JSON.parse(localStorage.getItem(key));

    window.addEventListener(
      "storage",
      (event) => event.key === key && set(JSON.parse(event.newValue))
    );
  }

  const { subscribe, set } = writable(defaultValue);

  return {
    subscribe,
    set: (value: T) =>
      typeof window !== "undefined" &&
      localStorage.setItem(key, JSON.stringify(value)),
    update: (updater: (value: T) => T) => {
      if (typeof window !== "undefined") {
        const value = JSON.parse(localStorage.getItem(key));

        set(updater(value));
      }
    },
  };
};
