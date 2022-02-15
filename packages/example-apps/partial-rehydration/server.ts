import { renderToString } from '@glimmer/ssr';
import StaticComponent from './src/StaticComponent';

interface ExpressResponse {
  end(str: string): void;
}

export default async function handler(
  _: {},
  res: ExpressResponse,
  clientsideBundleLocation: string
): Promise<void> {
  const ssrOutput = await renderToString(StaticComponent, {
    args: { foo: { bar: 'bar' } },
    rehydrate: true,
  });

  res.end(`
      <!doctype html>
      <html>
        <head>
          <title>Glimmer Demo</title>
        </head>
        <body>
          <div id="app">${ssrOutput}</div>
          <script async src="${clientsideBundleLocation}"></script>
        </body>
      </html>
    `);
}
