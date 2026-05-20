import { createHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

export default createHandler(getRouter);