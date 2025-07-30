import React from 'react';
import { TrendingUp, Users, Star, Award } from 'lucide-react';

const QuickStats = () => {
  const stats = [
    {
      icon: TrendingUp,
      number: "85%",
      label: "Klientų grįžta pakartotinai",
      description: "Mūsų klientai renkasi mus ne kartą",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: Users,
      number: "24/7",
      label: "Palaikymas kelionės metu",
      description: "Visada esame pasiekiami pagalbai",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Star,
      number: "4.9",
      label: "Vidutinis įvertinimas",
      description: "Pagal klientų atsiliepimus",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50"
    },
    {
      icon: Award,
      number: "100%",
      label: "Pinigų grąžinimo garantija",
      description: "Jei kelionė neįvyks mūsų kaltės dėl",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group border border-gray-100"
              >
                <div className={`${stat.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={stat.color} size={32} />
                </div>
                
                <div className="text-4xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors duration-300">
                  {stat.number}
                </div>
                
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  {stat.label}
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;