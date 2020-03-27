export function find(selector: string): Element {
  const element = document.getElementById('qunit-fixture')!;
  return element.querySelector(selector)!;
}

export function click(selector: string): void {
  const element = document.getElementById('qunit-fixture')!;
  const clickable = element.querySelector(selector)! as HTMLButtonElement;

  clickable.click();
}
