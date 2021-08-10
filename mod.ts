// `deployctl types > deployctl.d.ts`
/// <reference path="./deployctl.d.ts" />

addEventListener("fetch", (ev) => {
  ev.respondWith(
    new Response("Hello, deno.lyte.dev visitor!", {
      status: 200,
      headers: {
        server: "deploy",
        "content-type": "text/plain",
      },
    }),
  );
});
