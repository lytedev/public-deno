// `deployctl types > deployctl.d.ts`

addEventListener("fetch", (ev) => ev.respondWith(handleRequest(ev.request)));

interface AppError {
  error: {
    message: any;
    _for_humans?: any;
  };
}

const errorJson = {
  status: 404,
  statusText: "Not Found",
  headers: {
    "content-type": "application/json; charset=utf-8",
  },
};

const handleRequest = async (req: Request): Promise<Response> => {
  const method = req.method.toLowerCase().trim();
  const path = req.toLowerCase().trim();
  return new Response(
    JSON.stringify(error("not_found")),
    errorJson,
  );
};

const error = (message: any, human_friendly_message?: any): AppError => ({
  error: { message, _for_humans: human_friendly_message || message },
});

export default {};
