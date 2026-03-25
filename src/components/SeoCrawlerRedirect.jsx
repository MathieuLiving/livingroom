import { useEffect } from 'react';

/**
 * SeoCrawlerRedirect
 * 
 * This component detects if the current visitor is a known social media crawler/bot.
 * If detected, it performs a hard redirect to the Supabase Edge Function 'render-cvd'.
 * This allows the Edge Function to serve Server-Side Rendered HTML with correct Open Graph tags
 * for link previews (WhatsApp, iMessage, Facebook, etc.), bypassing the static React app.
 * 
 * @param {string} slug - The slug of the professional's card (e.g., 'mathieu-guerin')
 */
export const SeoCrawlerRedirect = ({ slug }) => {
  useEffect(() => {
    const checkAndRedirect = () => {
      if (!slug) return;

      const userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
      
      // List of common social media bots and crawlers that need SSR
      // Note: Some basic fetchers (like older WhatsApp versions) might not execute JS at all.
      // For those, a server-side Rewrite Rule is the only 100% fix.
      // However, this covers bots that do execute basic JS or follow redirects.
      const botPattern = /facebookexternalhit|linkedinbot|twitterbot|pinterest|slackbot|whatsapp|telegrambot|discordbot|skypeuripreview|embedly|quora link preview|redditbot|applebot|bingbot|googlebot|baiduspider|yandex|duckduckbot/i;

      if (botPattern.test(userAgent)) {
        console.log('[SeoCrawlerRedirect] Bot detected, redirecting to SSR function...');
        
        // Supabase Project URL
        const supabaseProjectUrl = "https://ohddhnegsqvxhyohgsoi.supabase.co";
        
        // Construct the Edge Function URL that serves the SSR HTML
        const redirectUrl = `${supabaseProjectUrl}/functions/v1/render-cvd?slug=${encodeURIComponent(slug)}`;
        
        // Perform a hard replace to redirect the bot immediately
        window.location.replace(redirectUrl);
      }
    };

    checkAndRedirect();
  }, [slug]);

  // This component does not render anything visible
  return null;
};

export default SeoCrawlerRedirect;