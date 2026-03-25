// PAGE DÉSACTIVÉE - ANCIEN SYSTÈME MARKDOWN
// Conservée uniquement parce que l'hébergeur ne permet pas la suppression.
// Le blog utilise maintenant :
//  - src/blog/blogData.js
//  - src/pages/BlogPage.jsx
//  - routes /blog et /blog/:slug

import React, { useEffect } from "react";

export default function BlogPostPage() {
  useEffect(() => {
    console.warn(
      "⚠️ [slug].jsx est désactivée. Les articles sont désormais gérés via BlogPage.jsx."
    );
  }, []);

  return null; // La page ne renvoie plus aucun contenu
}