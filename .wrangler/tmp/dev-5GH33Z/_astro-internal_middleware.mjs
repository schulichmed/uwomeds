globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_b6Tcqrqr.mjs';
import './chunks/astro/server_BZqvpZ5T.mjs';
import { k as sequence } from './chunks/render-context_D8HVpAKo.mjs';

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	
	
);

export { onRequest };
