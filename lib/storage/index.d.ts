export class Storage {
  constructor(config: { type: 'localStorage' | 'sessionStorage'; prefix?: string; expire?: number })
  setItem(key: string, val: any, opts?: { expire?: number; renewal?: boolean }): void
  getItem(key: string, defaultVal: any): any
  removeItem(key: string): string
  autoAddPrefix(key: string): string
  autoRemovePrefix(key: string): string
}

export const local: InstanceType<typeof Storage>
export const session: InstanceType<typeof Storage>
