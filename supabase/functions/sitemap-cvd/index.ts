import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("professionnels")
      .select("card_slug, updated_at")
      .not("card_slug", "is", null);

    if (error) {
      console.error(error);
      return new Response("Error fetching data", { status: 500 });
    }

    const baseUrl = "https://card.livingroom.immo";

    const urls = data.map((pro) => {
      return `
        <url>
          <loc>${baseUrl}/cvd/${pro.card_slug}</loc>
          <lastmod>${new Date(pro.updated_at).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join("")}
      </urlset>
    `;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });

  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
});