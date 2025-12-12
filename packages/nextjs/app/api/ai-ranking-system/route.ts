import { NextResponse } from "next/server";

export async function GET() {
  const rankingSystem = {
    title: "AI Ranking System Explained",
    overview:
      "Our AI ranking system is designed to reward consistent performance and skill progression in Rock Paper Scissors matches against AI opponents.",

    howItWorks: {
      title: "How Rankings Work",
      description: "Rankings are based on a combination of factors that measure both skill and consistency:",
      factors: [
        {
          name: "Total AI Wins",
          weight: "Primary Factor (70%)",
          description:
            "The total number of matches won against AI opponents. This is the most important factor as it shows consistent performance over time.",
          example: "A player with 50 AI wins ranks higher than one with 30 wins, regardless of win rate differences.",
        },
        {
          name: "Win Rate",
          weight: "Secondary Factor (20%)",
          description: "Your win percentage in AI matches. Used as a tiebreaker when players have similar win counts.",
          calculation: "(AI Wins / Total AI Games) × 100",
          example:
            "If two players both have 25 wins, the one with 25/30 games (83%) ranks higher than 25/40 games (62.5%).",
        },
        {
          name: "Activity Level",
          weight: "Tertiary Factor (10%)",
          description: "Recent activity and total games played. Encourages regular participation.",
          note: "Players must have at least 5 AI games to appear on leaderboards.",
        },
      ],
    },

    rankingTiers: {
      title: "Ranking Tiers & Rewards",
      description: "Weekly rewards are distributed to the top 30 AI players based on their ranking:",
      tiers: [
        { rank: "1st Place", reward: "40 CELO", description: "The ultimate AI champion" },
        { rank: "2nd Place", reward: "25 CELO", description: "Exceptional AI mastery" },
        { rank: "3rd Place", reward: "18 CELO", description: "Outstanding performance" },
        { rank: "4th Place", reward: "15 CELO", description: "Excellent AI skills" },
        { rank: "5th Place", reward: "12 CELO", description: "Strong consistent play" },
        { rank: "6th-10th", reward: "10 CELO each", description: "Top tier performers" },
        { rank: "11th-15th", reward: "8 CELO each", description: "Skilled competitors" },
        { rank: "16th-20th", reward: "6 CELO each", description: "Solid players" },
        { rank: "21st-25th", reward: "4 CELO each", description: "Rising stars" },
        { rank: "26th-30th", reward: "3 CELO each", description: "Promising players" },
      ],
      totalPool: "250 CELO per week",
    },

    eligibility: {
      title: "Eligibility Requirements",
      requirements: [
        {
          requirement: "Minimum Games",
          value: "5 AI matches",
          description: "You must complete at least 5 AI matches to qualify for rankings and rewards.",
        },
        {
          requirement: "Active Participation",
          value: "Weekly activity",
          description: "Rankings reset weekly. Stay active to maintain your position.",
        },
        {
          requirement: "Fair Play",
          value: "No cheating/exploits",
          description: "All matches are monitored. Suspicious activity results in disqualification.",
        },
      ],
    },

    strategies: {
      title: "Ranking Strategies",
      tips: [
        {
          strategy: "Consistency Over Perfection",
          description:
            "Focus on winning more matches rather than maintaining a perfect win rate. A player with 40 wins and 70% win rate ranks higher than one with 20 wins and 90% win rate.",
        },
        {
          strategy: "Regular Play",
          description: "Play consistently throughout the week. Rankings reset weekly, so recent performance matters.",
        },
        {
          strategy: "Learn AI Patterns",
          description:
            "Our AI uses advanced algorithms, but observant players can identify subtle patterns and tendencies.",
        },
        {
          strategy: "Volume Strategy",
          description:
            "Since total wins are the primary factor, playing more games (while maintaining decent win rate) is often better than playing fewer games perfectly.",
        },
      ],
    },

    fairness: {
      title: "Fairness & Integrity",
      measures: [
        {
          measure: "Provably Fair AI",
          description: "Our AI opponent uses cryptographically secure randomness, ensuring no bias or manipulation.",
        },
        {
          measure: "Anti-Cheat Systems",
          description: "Advanced monitoring detects unusual patterns, bot usage, or exploitation attempts.",
        },
        {
          measure: "Transparent Calculations",
          description: "All ranking calculations are open and verifiable. No hidden factors or subjective scoring.",
        },
        {
          measure: "Equal Opportunity",
          description:
            "Every player faces the same AI difficulty. No advantages based on account age, spending, or other factors.",
        },
      ],
    },

    faq: [
      {
        question: "Why do total wins matter more than win rate?",
        answer:
          "This rewards dedication and consistency. A player who wins 50 out of 80 games (62.5%) has demonstrated more skill and commitment than someone who wins 5 out of 6 games (83%) but rarely plays.",
      },
      {
        question: "How often do rankings update?",
        answer:
          "Rankings update in real-time after each completed match. However, rewards are calculated and distributed weekly.",
      },
      {
        question: "What happens if I tie with another player?",
        answer: "Ties are broken by win rate first, then by total games played, then by most recent activity.",
      },
      {
        question: "Can I see my ranking history?",
        answer: "Yes! Visit your profile page to see your ranking progression and reward history over time.",
      },
      {
        question: "Is the AI difficulty the same for everyone?",
        answer:
          "Absolutely. Every player faces the same AI opponent with identical algorithms and difficulty settings.",
      },
    ],

    lastUpdated: new Date().toISOString(),
    version: "1.0",
  };

  return NextResponse.json({
    success: true,
    data: rankingSystem,
  });
}
