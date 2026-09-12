export type GeneratorFn<T> = (index: number, ...args: any[]) => T;

export class Factory<T> {
  private generator: GeneratorFn<T>;

  constructor(generator: GeneratorFn<T>) {
    this.generator = generator;
  }

  /**
   * Builds a single instance using the factory generator.
   */
  buildOne(overrides?: Partial<T>, ...args: any[]): T {
    return this.build(1, overrides, ...args)[0];
  }

  /**
   * Builds an array of instances using the factory generator.
   */
  build(count: number = 1, overrides?: Partial<T>, ...args: any[]): T[] {
    return Array.from({ length: count }, (_, index) => {
      const generated = this.generator(index, ...args);
      return { ...generated, ...overrides };
    });
  }
}

export class FactoryRegistry {
  private factories: Map<string, Factory<any>> = new Map();

  register<T>(name: string, factory: Factory<T>) {
    this.factories.set(name, factory);
  }

  get<T>(name: string): Factory<T> {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Factory ${name} not found`);
    }
    return factory;
  }
}

export const globalRegistry = new FactoryRegistry();

/**
 * Generates a standard MongoDB ObjectId equivalent on the client side
 */
export const generateObjectId = () => {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const randomChars = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return timestamp + randomChars;
};
