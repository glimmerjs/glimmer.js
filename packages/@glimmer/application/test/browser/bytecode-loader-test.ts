// This is the API for constructing a Glimmer.js application with
// precompiled binary bytecode templates and using an async renderer
// (via requestAnimationFrame, requestIdleCallback, etc).
// import Application, { DOMBuilder, AsyncRenderer, BytecodeLoader } from '@glimmer/application';

// import data from './__compiled__/data';

// let bytecode = fetch('./__compiled__/templates.gbx')
//   .then(req => req.arrayBuffer());

// let element = document.getElementById('app');

// let app = new Application({
//   builder: new DOMBuilder({ element }),
//   renderer: new AsyncRenderer(),
//   loader: new BytecodeLoader({ data, bytecode })
// });

// app.boot().then(() => {/* ... */});
