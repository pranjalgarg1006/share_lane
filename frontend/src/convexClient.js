import { ConvexReactClient } from "convex/react";

export const convexClient = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL);
