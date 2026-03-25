import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Check, CheckCircle, Minus, Shield, Star, Crown } from 'lucide-react';
import SEO from '@/components/SEO';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AuthForm from '@/components/auth/AuthForm';
import FAQ from '@/components/FAQ';
import { proContent } from '@/lib/content/proPage.fr.js';

const FeatureDescription = ({ text }) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  return (
    <ul className="space-y-2 list-none p-0">
      {lines.map((line, index) => (
        <li key={index} className="flex items-start text-base leading-7 text-gray-600">
          <span className="text-brand-orange mr-2 mt-1.5 flex-shrink-0">•</span>
          <span>{line.replace('•', '').trim()}</span>
        </li>
      ))}
    </ul>
  );
};

const PricingTable = ({ onCtaClick }) => {
  const { table, freePlan, premiumPlan, premiumPlusPlan } = proContent.pricing;

  const renderCheck = (value) => {
    if (value === "Inclus") return <Check className="h-5 w-5 text-green-600 mx-auto" />;
    if (value === "Non inclus") return <Minus className="h-5 w-5 text-gray-400 mx-auto" />;
    return <span className="font-medium text-gray-800">{value}</span>;
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-2/5 px-6 py-4 text-left text-sm font-bold text-brand-blue tracking-wider">
              {table.columns[0]}
            </TableHead>
            <TableHead className="w-1/5 px-6 py-4 text-center text-sm font-bold text-brand-blue tracking-wider">
              <div className="flex flex-col items-center">
                <Shield className="h-6 w-6 mb-1 text-gray-500" />
                {table.columns[1]}
              </div>
            </TableHead>
            <TableHead className="w-1/5 px-6 py-4 text-center text-sm font-bold text-brand-blue tracking-wider">
              <div className="flex flex-col items-center">
                <Star className="h-6 w-6 mb-1 text-amber-500" />
                {table.columns[2]}
              </div>
            </TableHead>
            <TableHead className="w-1/5 px-6 py-4 text-center text-sm font-bold text-brand-blue tracking-wider">
              <div className="flex flex-col items-center">
                <Crown className="h-6 w-6 mb-1 text-purple-600" />
                {table.columns[3]}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          <TableRow className="bg-gray-50/50">
            <TableCell className="px-6 py-4 font-medium text-gray-900"></TableCell>
            <TableCell className="px-6 py-4 text-center">
              <span className="text-4xl font-bold text-gray-900">{freePlan.price.split(' ')[0]}</span>
              <span className="text-sm text-gray-500">/pour toujours</span>
            </TableCell>
            <TableCell className="px-6 py-4 text-center bg-brand-blue/5 border-x-2 border-brand-orange">
              <span className="text-4xl font-bold text-gray-900">{premiumPlan.price.split(' ')[0]}</span>
              <span className="text-sm text-gray-500">/mois</span>
            </TableCell>
            <TableCell className="px-6 py-4 text-center">
              <span className="text-4xl font-bold text-gray-900">{premiumPlusPlan.price.split(' ')[0]}</span>
              <span className="text-sm text-gray-500">/mois</span>
            </TableCell>
          </TableRow>
          {table.rows.map((row, index) => (
            <TableRow key={index} className="hover:bg-gray-50">
              <TableCell className="px-6 py-4 text-sm font-medium text-gray-800">{row.feature}</TableCell>
              <TableCell className="px-6 py-4 text-center text-sm text-gray-600">{renderCheck(row.free)}</TableCell>
              <TableCell className="px-6 py-4 text-center text-sm text-gray-600 bg-brand-blue/5 border-x-2 border-brand-orange">{renderCheck(row.premium)}</TableCell>
              <TableCell className="px-6 py-4 text-center text-sm text-gray-600">{renderCheck(row.premiumPlus)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="px-6 py-4"></TableCell>
            <TableCell className="px-6 py-4 text-center">
              <Button onClick={onCtaClick} variant="outline" className="w-full">{freePlan.cta}</Button>
            </TableCell>
            <TableCell className="px-6 py-4 text-center bg-brand-blue/5 border-x-2 border-brand-orange">
              <Button onClick={onCtaClick} className="w-full bg-brand-orange hover:bg-orange-600 text-white shadow-md">{premiumPlan.cta}</Button>
            </TableCell>
            <TableCell className="px-6 py-4 text-center">
              <Button onClick={onCtaClick} className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md">{premiumPlusPlan.cta}</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

const ProfessionnelPage = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <>
      <SEO
        title={proContent.seo.title}
        description={proContent.seo.description}
        ogImage={proContent.ogImage}
      />
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <div className="bg-white text-gray-800">
          {/* Hero Section */}
          <div className="relative isolate overflow-hidden pt-14 lg:px-8">
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
              <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
            </div>
            <div className="mx-auto max-w-7xl py-24 sm:py-32">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="text-center lg:text-left">
                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-5xl font-extrabold tracking-tight text-brand-blue sm:text-7xl">
                    {proContent.hero.title}
                    <span className="text-brand-orange">{proContent.hero.highlight}</span>
                  </motion.h1>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 text-xl leading-8 text-gray-700">
                    {proContent.hero.subtitle}
                  </motion.p>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                    <DialogTrigger asChild>
                      <Button size="lg" className="bg-brand-orange hover:bg-orange-600 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
                        {proContent.hero.ctaPrimary}
                      </Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button size="lg" variant="ghost" className="text-base font-semibold leading-6 text-gray-900 group">
                        {proContent.hero.ctaSecondary}{" "}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </DialogTrigger>
                  </motion.div>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 100, delay: 0.3 }}>
                  <img src={proContent.ogImage} alt="Professionnel de l'immobilier en discussion avec des clients" className="rounded-2xl shadow-2xl" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <section className="bg-slate-50 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:text-center">
                <p className="font-semibold leading-7 text-brand-orange text-lg">{proContent.features.preTitle}</p>
                <h2 className="mt-2 text-4xl font-bold tracking-tight text-brand-blue sm:text-5xl">
                  {proContent.features.title}
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-700">
                  {proContent.features.subtitle}
                </p>
              </div>
              <motion.div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mt-24 lg:max-w-none lg:grid-cols-2" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
                {proContent.features.items.map((feature, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="h-full transition-all duration-300 shadow-sm hover:shadow-xl">
                      <CardHeader className="flex flex-row items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-orange text-white flex-shrink-0">
                          <feature.icon className="h-8 w-8" aria-hidden="true" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-brand-blue">{feature.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <FeatureDescription text={feature.description} />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="bg-white py-16 sm:py-24"> {/* Reduced padding here */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-4xl text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight text-brand-blue sm:text-5xl">
                  {proContent.pricing.title}
                </h2>
                <p className="mt-4 text-lg text-gray-700">
                  {proContent.pricing.subtitle}
                </p>
              </div>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto"
              >
                <div className="border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                  <PricingTable onCtaClick={() => setIsAuthModalOpen(true)} />
                </div>
              </motion.div>
              {proContent.pricing.footerNote && ( // Conditionally render footerNote if it exists
                <p className="mx-auto mt-12 max-w-3xl text-sm leading-7 text-gray-600 text-center">
                  {proContent.pricing.footerNote}
                </p>
              )}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-slate-50 py-16 sm:py-24"> {/* Reduced padding here */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-brand-blue text-center mb-12">
                  {proContent.faq.title}
                </h2>
                <FAQ items={proContent.faq.items} />
              </div>
            </div>
          </section>
        </div>
        <DialogContent className="sm:max-w-md p-0">
          <AuthForm userType="professionnel" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfessionnelPage;