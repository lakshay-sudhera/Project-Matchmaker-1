import PusherClient from "pusher-js";

// Handle isomorphic differences between Node.js and Browser builds of pusher-js
const Pusher = (PusherClient as any).Pusher || PusherClient;

export const pusherClient =
  typeof window !== "undefined"
    ? new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
      })
    : (null as any);
