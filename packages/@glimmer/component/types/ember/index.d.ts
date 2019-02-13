declare module 'ember' {
  function meta(obj: object): Meta;
  function destroy(obj: object);
}

declare class Meta {
  setSourceDestroying();
  setSourceDestroyed();
}
