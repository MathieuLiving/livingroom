// src/components/blog/BlogCallToAction.jsx
import React from "react";
import { Link } from "react-router-dom";

const BlogCallToAction = () => {
  return (
    <div className="p-6 my-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center shadow-inner">
      <h3 className="text-2xl font-bold text-brand-blue mb-3">
        Prêt à transformer votre projet immobilier ?
      </h3>

      <p className="text-gray-700 mb-5 max-w-2xl mx-auto">
        Que vous soyez un professionnel cherchant des leads qualifiés ou un porteur
        de projet en quête du bon agent, LivingRoom.immo est la solution.
      </p>

      <div className="flex justify-center gap-4 flex-wrap">
        {/* Pro : route existante chez toi */}
        <Link
          to="/pro-de-limmo"
          className="inline-block bg-brand-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          Pro de l&apos;immo
        </Link>

        {/* Particuliers : route existante chez toi */}
        <Link
          to="/particuliers"
          className="inline-block bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          Particuliers
        </Link>
      </div>
    </div>
  );
};

export default BlogCallToAction;