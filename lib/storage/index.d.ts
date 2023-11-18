export class Storage {
  constructor(config: { type: 'localStorage' | 'sessionStorage'; prefix?: string; expire?: number });
  setItem(key: string, val: any, opts?: { expire?: number; renewal?: boolean }): void;
  getItem<T>(key: string, defaultVal?: T): T;
  removeItem(key: string): void;
  setItem_simple(key: string, val: any): void;
  getItem_simple<T>(key: string, defaultVal?: T): T;
  removeItem_simple(key: string): void;
  autoAddPrefix(key: string): string;
  autoRemovePrefix(key: string): string;
}

export const local: InstanceType<typeof Storage>;
export const session: InstanceType<typeof Storage>;
