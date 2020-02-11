export default class LocaleService {
  private _currentLocale: string;

  constructor(currentLocale: string) {
    this._currentLocale = currentLocale;
  }

  get currentLocale(): string {
    return this._currentLocale;
  }
}
