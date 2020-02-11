declare module '@ember/component' {
  export function setComponentManager<T>(managerId: string, baseClass: T): T;
  export function setComponentManager<T>(managerFactory: (owner: unknown) => {}, baseClass: T): T;
  export function capabilities(
    version: string,
    opts?: {
      destructor?: boolean;
      asyncLifecycleCallbacks?: boolean;
    }
  ): unknown;
}
