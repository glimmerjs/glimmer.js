import { renderComponent } from '@glimmer/core';
import RehydratableCounter from './src/RehydratableCounter';

rehydrate({
  get RehydratableCounter() {
    // Can load components async
    return Promise.resolve(RehydratableCounter);
  },
});

function rehydrate(componentMapping) {
  const hasHydrated = new WeakSet();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting && !hasHydrated.has(entry.target)) {
          await renderComponent(await componentMapping[entry.target.dataset.hydrate], {
            element: entry.target.parentElement,
            args: JSON.parse(entry.target.querySelector('script').textContent),
            rehydrate: true,
          });
          hasHydrated.add(entry.target);
        }
      });
    },
    {
      root: null,
    }
  );

  const rehydratables = Array.from(document.querySelectorAll('[data-hydrate]'));

  for (const el of rehydratables) {
    observer.observe(el);
  }
}
