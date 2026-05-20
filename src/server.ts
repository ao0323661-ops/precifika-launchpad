import { getServerEntry } from "@tanstack/react-start/server-entry";

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await (handler as any).fetch(request, env, ctx);
      return response;
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
