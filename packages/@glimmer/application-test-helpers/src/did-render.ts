async function didRender(app: any): Promise<void> {
  return new Promise<void>(resolve => {
    let watcher = setInterval(function() {
      if (app['_rendering']) return;
      clearInterval(watcher);
      resolve();
    }, 10);
  });
};

export default didRender;
