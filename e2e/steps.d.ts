/// <reference types='codeceptjs' />
type steps_file = typeof import('./steps_file.js');
type utils = typeof import('./utils');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, utils: utils }
  interface Methods extends Playwright {}
  interface I extends ReturnType<steps_file> {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}

declare const SuiteOf: typeof Feature;