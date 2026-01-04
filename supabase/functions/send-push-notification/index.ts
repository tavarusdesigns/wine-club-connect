import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  targetUserIds?: string[];
  sendToAll?: boolean;
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'order_status': return '📦';
    case 'new_event': return '📅';
    case 'bonus_reminder': return '🎁';
    default: return '🔔';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { title, message, type, targetUserIds, sendToAll } = await req.json() as NotificationPayload;

    console.log('Sending notification:', { title, type, sendToAll, targetUserIds });

    // Fetch push subscriptions for web push (optional feature)
    let subscriptionsQuery = supabase.from('push_subscriptions').select('*');
    
    if (!sendToAll && targetUserIds && targetUserIds.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in('user_id', targetUserIds);
    }

    const { data: subscriptions, error: subError } = await subscriptionsQuery;

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    console.log(`Found ${subscriptions?.length || 0} push subscriptions`);

    // Create in-app notifications (main functionality)
    if (sendToAll) {
      // Get all approved users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_approved', true);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (profiles && profiles.length > 0) {
        const notifications = profiles.map(p => ({
          user_id: p.user_id,
          title,
          message,
          type,
          is_read: false,
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating notifications:', notifError);
          throw notifError;
        }

        console.log(`Created ${notifications.length} in-app notifications`);
      }
    } else if (targetUserIds && targetUserIds.length > 0) {
      const notifications = targetUserIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        throw notifError;
      }

      console.log(`Created ${notifications.length} in-app notifications`);
    }

    // Note: Web push requires proper VAPID setup and encryption
    // For now, we focus on in-app + browser notifications via service worker
    const pushCount = subscriptions?.length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent successfully`,
        inAppNotifications: sendToAll ? 'all members' : targetUserIds?.length || 0,
        pushSubscriptions: pushCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});