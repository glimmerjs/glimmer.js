async function didRender(app: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // If the app is scheduled to re-render, or has not yet been rendered for
    // the first time, register to be notified when the next render completes.
    if (app['_scheduled'] || !app['_rendered']) {
      app['_notifiers'].push([resolve, reject]);
    } else {
      resolve();
    }
  });
}

export default didRender;
