// This function has been moved to the @glimmer/tracking package. Catch uses of
// the old API and ensure users get a nice error message.
export function setPropertyDidChange() {
  throw new Error(
    `The setPropertyDidChange function has moved to the @glimmer/tracking package. Please update your import to:\n\timport { setPropertyDidChange } from '@glimmer/tracking'`
  );
}
