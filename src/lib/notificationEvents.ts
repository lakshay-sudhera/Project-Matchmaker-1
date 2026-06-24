import { pusherServer } from "./pusherServer";

/**
 * Sends a real-time notification alert via Pusher to the recipient's personal channel.
 */
export async function triggerRealtimeNotification(recipientId: string, notification: any) {
  try {
    const channelName = `user-${recipientId}-notifications`;
    await pusherServer.trigger(channelName, "notification:new", notification);
    console.log(`Pushed notification:new event to ${channelName}`);
  } catch (err) {
    console.error("Failed to send Pusher notification event:", err);
  }
}
