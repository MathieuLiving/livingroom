// src/lib/blog/agentBlogData.js

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const stripHtml = (html = "") =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const estimateReadingTimeMinutes = (html = "") => {
  const text = stripHtml(html);
  const words = text ? text.split(" ").length : 0;
  const wpm = 220; // moyenne lecture web
  return Math.max(1, Math.round(words / wpm));
};

const normalizeTags = (tags = []) =>
  Array.from(
    new Set(
      (tags || [])
        .map((t) => String(t || "").trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase())
    )
  );

const buildSeo = (post) => {
  const metaTitle = post.metaTitle || post.title;
  const metaDescription =
    post.metaDescription || post.excerpt || "Article LivingRoom.immo";
  const ogImage = post.ogImage || post.imageUrl;
  const canonicalPath = post.canonicalPath || `/blog/agents/${post.slug}`;
  return { metaTitle, metaDescription, ogImage, canonicalPath };
};

/* -------------------------------------------------------------------------- */
/* Raw posts (ton contenu)                                                    */
/* -------------------------------------------------------------------------- */

const rawAgentBlogPosts = [
  {
    slug: "plus-de-mandats-sans-demarchage-agressif",
    title: "Comment obtenir plus de mandats en 2025 sans démarchage agressif ?",
    excerpt:
      "Fatigué de la prospection traditionnelle ? Découvrez des stratégies modernes et efficaces pour signer plus de mandats exclusifs en vous positionnant comme un expert de confiance.",
    author: "L'équipe LivingRoom.immo",
    dateISO: "2025-06-30",
    dateDisplay: "30 Juin 2025",
    imageUrl:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1200&auto=format&fit=crop",
    tags: ["prospection immobilière moderne", "mandat exclusif", "alternative démarchage"],
    content: `
      <p class="lead">En 2025, la prospection immobilière a radicalement changé. Le démarchage téléphonique à froid et le porte-à-porte intensif, en plus d'être épuisants, sont de moins en moins efficaces. Les particuliers, sur-sollicités, sont devenus méfiants. Alors, comment continuer à développer son portefeuille de mandats de manière pérenne et respectueuse ? La réponse réside dans une approche plus intelligente : la prospection moderne.</p>
      
      <h2>1. Le marketing de contenu : devenez l'expert de votre secteur</h2>
      <p>Plutôt que de chasser le client, attirez-le à vous. C'est le principe de l'inbound marketing. Créez du contenu à forte valeur ajoutée qui répond aux questions que se posent les vendeurs potentiels :</p>
      <ul>
        <li>Rédigez des articles de blog sur "Les 5 étapes pour bien vendre à [votre ville]".</li>
        <li>Créez des vidéos courtes expliquant "Comment estimer son bien en 2025 ?".</li>
        <li>Organisez des webinaires sur le marché immobilier local.</li>
      </ul>
      <p>En partageant votre expertise, vous construisez une image de professionnel de confiance. Les prospects viendront à vous naturellement, déjà convaincus de votre compétence.</p>
      
      <h2>2. Le pouvoir des réseaux sociaux et du personal branding</h2>
      <p>Votre présence en ligne est votre vitrine. Utilisez LinkedIn, Instagram ou Facebook pour mettre en avant votre personnalité et vos succès. Partagez des témoignages clients, des "avant/après" de home staging, des analyses de marché. Humanisez votre approche. Les gens ne choisissent pas une agence, ils choisissent un agent en qui ils ont confiance.</p>
      
      <h2>3. Les plateformes de mise en relation : une alternative au démarchage</h2>
      <p>C'est ici que des plateformes comme <strong>LivingRoom.immo</strong> révolutionnent la prospection. Au lieu de chercher des prospects à l'aveugle, vous accédez à un vivier de projets qualifiés, déposés par des particuliers qui sont déjà dans une démarche active de vente. C'est une prospection "inversée" :</p>
      <ul>
        <li><strong>Fini le rejet :</strong> vous ne contactez que des personnes qui ont manifesté un besoin.</li>
        <li><strong>Gain de temps :</strong> concentrez-vous sur des leads chauds et qualifiés.</li>
        <li><strong>Valorisation de votre profil :</strong> le particulier vous choisit pour votre expertise, visible sur votre profil.</li>
      </ul>
      <p>Cette approche est non seulement plus efficace, mais aussi beaucoup plus gratifiante. Vous ne dérangez plus, vous proposez une solution à un problème existant.</p>
      
      <h2>4. Le réseau et la recommandation : un levier sous-estimé</h2>
      <p>Entretenez votre réseau de clients satisfaits. Un vendeur heureux de vos services est votre meilleur ambassadeur. Mettez en place un système de parrainage simple. De même, tissez des liens avec les autres professionnels de votre écosystème (notaires, courtiers, artisans). Ils peuvent devenir une source régulière de mandats.</p>
      
      <h3>Conclusion : travailler moins mais mieux</h3>
      <p>Obtenir plus de mandats en 2025 ne signifie pas travailler plus dur, mais travailler plus intelligemment. En combinant une stratégie de contenu pertinente, un personal branding soigné et l'utilisation de plateformes innovantes comme LivingRoom.immo, vous transformez votre prospection. Vous passez d'un chasseur de mandats à un expert sollicité, pour une activité plus sereine et plus rentable.</p>
    `,
  },

  {
    slug: "livingroom-connecte-projets-agents",
    title: "LivingRoom.immo : la plateforme qui connecte les bons projets aux bons agents",
    excerpt:
      "Découvrez comment notre technologie de mise en relation immobilière vous apporte des leads qualifiés et vous permet de vous concentrer sur votre cœur de métier : la transaction.",
    author: "L'équipe LivingRoom.immo",
    dateISO: "2025-06-28",
    dateDisplay: "28 Juin 2025",
    imageUrl:
      "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/86324d27f062ede072590e8fd167ab4e.jpg",
    tags: ["mise en relation immobilier", "lead immobilier qualifié", "plateforme immobilière"],
    content: `
      <p class="lead">Le quotidien d'un agent immobilier est souvent un grand écart entre la recherche de nouveaux mandats et la gestion des transactions en cours. Et si une plateforme vous permettait de fluidifier la première partie pour exceller dans la seconde ? C'est la promesse de LivingRoom.immo.</p>
      <h2>Le problème : une prospection coûteuse et incertaine</h2>
      <p>La prospection traditionnelle est un véritable parcours du combattant :</p>
      <ul>
        <li><strong>Coûts élevés :</strong> abonnements aux portails, publicité, outils de pige...</li>
        <li><strong>Temps considérable :</strong> des heures passées à appeler, relancer, sans garantie de résultat.</li>
        <li><strong>Leads peu qualifiés :</strong> des contacts "curieux" qui ne sont pas encore mûrs pour un projet.</li>
        <li><strong>Concurrence frontale :</strong> vous êtes des dizaines à répondre à la même annonce.</li>
      </ul>
      <h2>La solution : une mise en relation immobilière intelligente</h2>
      <p>LivingRoom.immo prend le problème à l'envers. Nous ne vous vendons pas de la visibilité, nous vous apportons des opportunités concrètes.</p>
      <h3>Comment ça marche pour vous, professionnels ?</h3>
      <ol>
        <li><strong>Un profil qui vous valorise :</strong> Vous créez un profil détaillé qui met en avant votre expertise, votre secteur, vos ventes réussies et les avis de vos clients.</li>
        <li><strong>Accès à un marché de projets :</strong> Vous consultez une place de marché de projets de vente ou d'achat, déposés par des particuliers.</li>
        <li><strong>Vous manifestez votre intérêt :</strong> Un projet correspond à votre cœur de cible ? Vous envoyez une demande de mise en relation.</li>
        <li><strong>Le client vous choisit :</strong> Il consulte votre profil et décide de lever son anonymat avec vous.</li>
      </ol>
      <h2>Les avantages concrets pour votre activité</h2>
      <ul>
        <li><strong>Des leads qualifiés :</strong> Vous interagissez avec des personnes ayant un projet réel.</li>
        <li><strong>Un gain de temps :</strong> Réduisez drastiquement le temps alloué à la prospection.</li>
        <li><strong>Une maîtrise de vos coûts :</strong> Modèle basé sur la performance.</li>
        <li><strong>Une différenciation par l'expertise :</strong> Vous êtes choisi pour vos compétences.</li>
      </ul>
      <h3>Conclusion : devenez l'agent que l'on choisit</h3>
      <p>LivingRoom.immo vous permet de vous concentrer sur ce que vous faites de mieux : vendre des biens et satisfaire vos clients.</p>
    `,
  },

  // ... (colle ici tes autres posts raw tels quels, sans rien changer)
];

/* -------------------------------------------------------------------------- */
/* Enriched posts (SEO + tri + reading time + tags normalisés)                */
/* -------------------------------------------------------------------------- */

export const agentBlogPosts = rawAgentBlogPosts
  .map((p) => {
    const tags = normalizeTags(p.tags);
    const readingTimeMinutes =
      typeof p.readingTimeMinutes === "number"
        ? p.readingTimeMinutes
        : estimateReadingTimeMinutes(p.content);

    const seo = buildSeo(p);

    return {
      ...p,
      tags,
      readingTimeMinutes,
      seo, // { metaTitle, metaDescription, ogImage, canonicalPath }
    };
  })
  .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

export const getAgentBlogPostBySlug = (slug) =>
  agentBlogPosts.find((p) => p.slug === slug) || null;

export const getAgentBlogPosts = ({
  tag,
  query,
  limit,
} = {}) => {
  let posts = [...agentBlogPosts];

  if (tag) {
    const t = String(tag).trim().toLowerCase();
    posts = posts.filter((p) => (p.tags || []).includes(t));
  }

  if (query) {
    const q = String(query).trim().toLowerCase();
    posts = posts.filter((p) => {
      const hay = `${p.title} ${p.excerpt} ${(p.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (Number.isFinite(limit)) posts = posts.slice(0, Math.max(0, limit));
  return posts;
};

export const getAgentBlogTags = () => {
  const all = agentBlogPosts.flatMap((p) => p.tags || []);
  return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b, "fr"));
};