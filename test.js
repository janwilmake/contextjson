export default {
  fetch: (request) => {
    const isVscode =
      request.headers.get("user-agent") === "Visual Studio Code (desktop)";
    return new Response(isVscode);
  },
};
