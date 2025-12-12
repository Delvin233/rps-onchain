"use client";

import { useEffect, useState } from "react";
import { Award, HelpCircle, Shield, Target, TrendingUp, Trophy } from "lucide-react";

interface RankingSystemData {
  title: string;
  overview: string;
  howItWorks: {
    title: string;
    description: string;
    factors: Array<{
      name: string;
      weight: string;
      description: string;
      calculation?: string;
      example: string;
    }>;
  };
  rankingTiers: {
    title: string;
    description: string;
    tiers: Array<{
      rank: string;
      reward: string;
      description: string;
    }>;
    totalPool: string;
  };
  eligibility: {
    title: string;
    requirements: Array<{
      requirement: string;
      value: string;
      description: string;
    }>;
  };
  strategies: {
    title: string;
    tips: Array<{
      strategy: string;
      description: string;
    }>;
  };
  fairness: {
    title: string;
    measures: Array<{
      measure: string;
      description: string;
    }>;
  };
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export default function AIRankingSystemPage() {
  const [data, setData] = useState<RankingSystemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankingSystemData();
  }, []);

  const fetchRankingSystemData = async () => {
    try {
      const response = await fetch("/api/ai-ranking-system");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch ranking system data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Loading ranking system information...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-base-content/60">Failed to load ranking system information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Trophy className="text-yellow-500" size={40} />
          {data.title}
        </h1>
        <p className="text-lg text-base-content/70 max-w-3xl mx-auto">{data.overview}</p>
      </div>

      {/* How It Works */}
      <div className="bg-card/50 rounded-xl p-6 mb-8 border border-primary/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Target className="text-primary" size={28} />
          {data.howItWorks.title}
        </h2>
        <p className="text-base-content/70 mb-6">{data.howItWorks.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.howItWorks.factors.map((factor, index) => (
            <div key={index} className="bg-base-100/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold text-lg mb-2">{factor.name}</h3>
              <p className="text-sm text-primary font-semibold mb-2">{factor.weight}</p>
              <p className="text-sm text-base-content/70 mb-3">{factor.description}</p>
              {factor.calculation && (
                <p className="text-xs bg-base-200 p-2 rounded font-mono mb-2">{factor.calculation}</p>
              )}
              <p className="text-xs text-base-content/60 italic">{factor.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking Tiers */}
      <div className="bg-card/50 rounded-xl p-6 mb-8 border border-secondary/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Award className="text-secondary" size={28} />
          {data.rankingTiers.title}
        </h2>
        <p className="text-base-content/70 mb-6">{data.rankingTiers.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data.rankingTiers.tiers.map((tier, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                index < 3
                  ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
                  : index < 5
                    ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30"
                    : "bg-base-100/50 border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{tier.rank}</span>
                <span className="text-secondary font-bold">{tier.reward}</span>
              </div>
              <p className="text-sm text-base-content/70">{tier.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/30">
          <p className="font-bold text-secondary text-lg">{data.rankingTiers.totalPool}</p>
          <p className="text-sm text-base-content/60">Total weekly reward pool</p>
        </div>
      </div>

      {/* Eligibility */}
      <div className="bg-card/50 rounded-xl p-6 mb-8 border border-accent/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="text-accent" size={28} />
          {data.eligibility.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.eligibility.requirements.map((req, index) => (
            <div key={index} className="bg-base-100/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold mb-2">{req.requirement}</h3>
              <p className="text-accent font-semibold mb-2">{req.value}</p>
              <p className="text-sm text-base-content/70">{req.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategies */}
      <div className="bg-card/50 rounded-xl p-6 mb-8 border border-info/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="text-info" size={28} />
          {data.strategies.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.strategies.tips.map((tip, index) => (
            <div key={index} className="bg-base-100/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold mb-2 text-info">{tip.strategy}</h3>
              <p className="text-sm text-base-content/70">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fairness */}
      <div className="bg-card/50 rounded-xl p-6 mb-8 border border-success/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="text-success" size={28} />
          {data.fairness.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.fairness.measures.map((measure, index) => (
            <div key={index} className="bg-base-100/50 rounded-lg p-4 border border-border">
              <h3 className="font-bold mb-2 text-success">{measure.measure}</h3>
              <p className="text-sm text-base-content/70">{measure.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-card/50 rounded-xl p-6 border border-warning/20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="text-warning" size={28} />
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {data.faq.map((item, index) => (
            <div key={index} className="collapse collapse-arrow bg-base-100/50 border border-border">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">{item.question}</div>
              <div className="collapse-content">
                <p className="text-base-content/70">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back to Leaderboards */}
      <div className="text-center mt-8">
        <a href="/leaderboards/ai" className="btn btn-primary btn-lg">
          View AI Leaderboard
        </a>
      </div>
    </div>
  );
}
