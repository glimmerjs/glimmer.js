import { renderToString } from '@glimmer/ssr';
import MyComponent from './src/MyComponent';

interface ExpressResponse {
  end(str: string): void;
}

export default async function handler(
  _: {},
  res: ExpressResponse,
  clientsideBundleLocation: string
): Promise<void> {
  const ssrOutput = await renderToString(MyComponent, {
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
          <script src="${clientsideBundleLocation}"></script>
        </body>
      </html>
    `);
}
