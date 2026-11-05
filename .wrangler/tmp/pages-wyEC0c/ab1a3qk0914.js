// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/_server-islands/*"
  ],
  exclude: [
    "/",
    "/_astro/*",
    "/.nojekyll",
    "/hero-people.png",
    "/hippo-icon.png",
    "/hippo-logo.png",
    "/sample-exec-roster.csv",
    "/404",
    "/wellness",
    "/academic",
    "/extracurricular",
    "/educational",
    "/research-from-home",
    "/meetings-and-updates",
    "/sponsors",
    "/admin/*",
    "/calendar",
    "/club-event-report",
    "/clubs/*",
    "/contact",
    "/council",
    "/documents",
    "/edit/*",
    "/links",
    "/login/*",
    "/medfriend",
    "/privacy",
    "/report-a-problem",
    "/room-booking/*",
    "/terms"
  ]
};

// node_modules/.pnpm/wrangler@4.151.2_@cloudflar_5160c28d942dbc2c754b23247692c91f/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\Users\\nsims\\OneDrive\\Desktop\\projects\\uwomeds\\.wrangler\\tmp\\pages-wyEC0c\\bundledWorker-0.44340581226330367.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\nsims\\OneDrive\\Desktop\\projects\\uwomeds\\node_modules\\.pnpm\\wrangler@4.151.2_@cloudflar_5160c28d942dbc2c754b23247692c91f\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\nsims\\OneDrive\\Desktop\\projects\\uwomeds\\.wrangler\\tmp\\pages-wyEC0c\\bundledWorker-0.44340581226330367.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=ab1a3qk0914.js.map
