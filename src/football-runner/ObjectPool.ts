export class ObjectPool<T> {
  private readonly available: T[] = [];
  private readonly created = new Set<T>();

  constructor(private readonly factory: () => T) {}

  acquire(): T {
    const item = this.available.pop() ?? this.factory();
    this.created.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.created.has(item) || this.available.includes(item)) return;
    this.available.push(item);
  }

  getAll(): ReadonlySet<T> {
    return this.created;
  }

  clear(dispose?: (item: T) => void): void {
    if (dispose) this.created.forEach(dispose);
    this.available.length = 0;
    this.created.clear();
  }
}
