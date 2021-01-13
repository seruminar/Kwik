import type { Sapper } from "@sapper/common";
import type { Writable, Readable } from "svelte/store";

declare module "@sapper/app" {
  export type Preload<TProps, TSession = {}> = {
    (
      this: Sapper.PreloadContext,
      page: Sapper.Page,
      session: TSession | undefined
    ): TProps | Promise<TProps>;
  };

  export type SapperStores<T> = {
    page: Writable<Sapper.Page>;
    session: Readable<T>;
  };

  export function goto(
    href: string,
    opts: { noscroll?: boolean; replaceState?: boolean }
  ): Promise<void>;

  export function prefetch(
    href: string
  ): Promise<{
    redirect?: Redirect;
    data?: { error: Error; status: number; segments: string[] };
  }>;

  export function prefetchRoutes(pathnames: string[]): Promise<void>;

  export function start(opts: { target: Node }): Promise<void>;

  export function stores<T>(): SapperStores<T>;

  export = {
    goto,
    prefetch,
    prefetchRoutes,
    start,
    stores,
  };
}
