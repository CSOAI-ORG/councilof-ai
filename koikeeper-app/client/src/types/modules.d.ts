// Type declarations for external modules without bundled types

declare module 'tailwind-merge' {
  export function twMerge(...classLists: (string | undefined)[]): string;
  export function twJoin(...classLists: (string | undefined)[]): string;
}

declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean);
    start(
      cameraIdOrConfig: string | { facingMode: string },
      configuration: { fps: number; qrbox?: { width: number; height: number } | number },
      successCallback: (decodedText: string, result: any) => void,
      errorCallback?: (error: string) => void
    ): Promise<void>;
    stop(): Promise<void>;
    clear(): void;
    scanFile(file: File, showImage?: boolean): Promise<string>;
    static getCameras(): Promise<Array<{ id: string; label: string }>>;
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: { fps: number; qrbox?: number | { width: number; height: number }; aspectRatio?: number },
      verbose?: boolean
    );
    render(
      successCallback: (decodedText: string, result: any) => void,
      errorCallback?: (error: string) => void
    ): void;
    clear(): Promise<void>;
  }
}

declare module 'superjson' {
  const superjson: {
    serialize: (value: any) => { json: any; meta?: any };
    deserialize: <T>(value: { json: any; meta?: any }) => T;
    stringify: (value: any) => string;
    parse: <T>(value: string) => T;
  };
  export default superjson;
}

declare module '@trpc/server/adapters/express' {
  import { AnyRouter } from '@trpc/server';
  import { RequestHandler, Request, Response } from 'express';

  export interface CreateExpressContextOptions {
    req: Request;
    res: Response;
  }

  export function createExpressMiddleware<TRouter extends AnyRouter>(options: {
    router: TRouter;
    createContext?: (opts: CreateExpressContextOptions) => any;
    onError?: (opts: any) => void;
  }): RequestHandler;
}

declare module 'drizzle-orm/mysql2' {
  export function drizzle(client: any, config?: any): any;
}

declare module 'drizzle-orm' {
  export * from 'drizzle-orm/mysql-core';
}

declare module 'drizzle-orm/mysql-core' {
  interface ColumnBuilder<T = any> {
    $type<TType>(): ColumnBuilder<TType>;
    notNull(): this;
    default(value: any): this;
    defaultNow(): this;
    onUpdateNow(): this;
    references(callback: () => any): this;
    primaryKey(): this;
    autoincrement(): this;
    unique(): this;
  }

  export function mysqlTable(name: string, columns: any, extra?: any): any;
  export function varchar(name: string, config?: { length?: number }): ColumnBuilder;
  export function int(name: string): ColumnBuilder;
  export function text(name: string): ColumnBuilder;
  export function timestamp(name: string, config?: any): ColumnBuilder;
  export function boolean(name: string): ColumnBuilder;
  export function json(name: string): ColumnBuilder;
  export function serial(name: string): ColumnBuilder;
  export function decimal(name: string, config?: { precision?: number; scale?: number }): ColumnBuilder;
  export function mysqlEnum<T extends string>(name: string, values: readonly T[]): ColumnBuilder;
  export function index(name: string): { on: (...columns: any[]) => any };
  export function uniqueIndex(name: string): { on: (...columns: any[]) => any };
  export function primaryKey(...columns: any[]): any;
  export function relations(table: any, callback: (helpers: any) => any): any;
}
