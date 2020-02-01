export default class LocaleService {
  private _currentLocale: string;

  constructor(currentLocale: string) {
    this._currentLocale = currentLocale;
  }

  get currentLocale() {
    return this._currentLocale;
  }
}
