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
      description: "Monthly rewards are distributed to the top 30 AI players based on their ranking:",
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
      totalPool: "250 CELO per month",
    },

    rankProgression: {
      title: "Rank Progression System",
      description: "Climb through 38 prestigious ranks from Beginner to the legendary RPS-God X:",
      tiers: [
        {
          name: "COSMIC",
          color: "text-pink-400",
          icon: "👑",
          ranks: [{ name: "RPS-GOD X", wins: "690+", description: "The ultimate achievement" }],
        },
        {
          name: "RPS-GOD",
          color: "text-purple-400",
          icon: "⭐",
          ranks: [
            { name: "RPS-God IX", wins: "660-689", description: "Legendary mastery" },
            { name: "RPS-God VIII", wins: "630-659", description: "Legendary mastery" },
            { name: "RPS-God VII", wins: "600-629", description: "Legendary mastery" },
            { name: "RPS-God VI", wins: "570-599", description: "Legendary mastery" },
            { name: "RPS-God V", wins: "520-569", description: "Legendary mastery" },
            { name: "RPS-God IV", wins: "470-519", description: "Legendary mastery" },
            { name: "RPS-God III", wins: "420-469", description: "Legendary mastery" },
            { name: "RPS-God II", wins: "370-419", description: "Legendary mastery" },
            { name: "RPS-God I", wins: "320-369", description: "Legendary mastery" },
          ],
        },
        {
          name: "MYTHIC",
          color: "text-indigo-400",
          icon: "🌈",
          ranks: [
            { name: "Mythic V", wins: "300-319", description: "Mythical power" },
            { name: "Mythic IV", wins: "280-299", description: "Mythical power" },
            { name: "Mythic III", wins: "260-279", description: "Mythical power" },
            { name: "Mythic II", wins: "240-259", description: "Mythical power" },
            { name: "Mythic I", wins: "220-239", description: "Mythical power" },
          ],
        },
        {
          name: "LEGEND",
          color: "text-red-400",
          icon: "🔴",
          ranks: [
            { name: "Legend V", wins: "210-219", description: "Legendary status" },
            { name: "Legend IV", wins: "200-209", description: "Legendary status" },
            { name: "Legend III", wins: "190-199", description: "Legendary status" },
            { name: "Legend II", wins: "180-189", description: "Legendary status" },
            { name: "Legend I", wins: "170-179", description: "Legendary status" },
          ],
        },
        {
          name: "CHAMPION",
          color: "text-yellow-400",
          icon: "🟡",
          ranks: [
            { name: "Champion III", wins: "160-169", description: "Elite champion" },
            { name: "Champion II", wins: "150-159", description: "Elite champion" },
            { name: "Champion I", wins: "140-149", description: "Elite champion" },
          ],
        },
        {
          name: "GRANDMASTER",
          color: "text-purple-300",
          icon: "🟣",
          ranks: [
            { name: "Grandmaster III", wins: "130-139", description: "Grandmaster level" },
            { name: "Grandmaster II", wins: "120-129", description: "Grandmaster level" },
            { name: "Grandmaster I", wins: "110-119", description: "Grandmaster level" },
          ],
        },
        {
          name: "MASTER",
          color: "text-green-400",
          icon: "🟢",
          ranks: [
            { name: "Master III", wins: "100-109", description: "Master tier" },
            { name: "Master II", wins: "90-99", description: "Master tier" },
            { name: "Master I", wins: "80-89", description: "Master tier" },
          ],
        },
        {
          name: "EXPERT",
          color: "text-green-300",
          icon: "🟢",
          ranks: [
            { name: "Expert III", wins: "70-79", description: "Expert level" },
            { name: "Expert II", wins: "60-69", description: "Expert level" },
            { name: "Expert I", wins: "50-59", description: "Expert level" },
          ],
        },
        {
          name: "WARRIOR",
          color: "text-blue-400",
          icon: "🔵",
          ranks: [
            { name: "Warrior III", wins: "40-49", description: "Warrior class" },
            { name: "Warrior II", wins: "30-39", description: "Warrior class" },
            { name: "Warrior I", wins: "20-29", description: "Warrior class" },
          ],
        },
        {
          name: "ENTRY",
          color: "text-gray-400",
          icon: "⚪",
          ranks: [
            { name: "Fighter", wins: "10-19", description: "Learning the ropes" },
            { name: "Novice", wins: "5-9", description: "Getting started" },
            { name: "Beginner", wins: "0-4", description: "Welcome to RPS!" },
          ],
        },
      ],
      note: "Ranks are based on total AI wins. Climb the ladder and earn your place among the legends!",
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
          value: "Monthly activity",
          description: "Rankings reset monthly. Stay active to maintain your position.",
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
          description: "Play consistently throughout the month. Rankings reset monthly, so recent performance matters.",
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
          "Rankings update in real-time after each completed match. However, rewards are calculated and distributed monthly.",
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
