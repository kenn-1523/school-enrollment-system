// packages/business-logic/src/coursesData.js

// ✅ IMPORT THE CONTENT
// We import from './courses/index.js' which exports C1_CONTENT
import { C1_CONTENT } from './courses/index'; 

const courses = [
    { 
      code: "F1", 
      title: "Introduction to Casino Gaming", 
      desc: "The essential foundation. Learn history, etiquette, and chip handling.", 
      displayPrice: "Free with Bundle", 
      price: 0, 
      duration: "2 Months",
      isPaid: false, 
      objectives: ["Understand hierarchy", "Chip handling basics", "Casino Terminology"] 
    },
    { 
      code: "G1", 
      title: "Black Jack", 
      desc: "Master the world's most popular game. Rules, math, and protection.", 
      displayPrice: "$400 USD", 
      price: 400,
      duration: "2 Months",
      isPaid: true, 
      objectives: ["Shoe delivery", "3:2 and 6:5 payouts", "Game protection"] 
    },
    { 
      code: "G2", 
      title: "Poker", 
      desc: "Expert instruction on Texas Hold'em. Shuffling, rake, and pots.", 
      displayPrice: "$400 USD", 
      price: 400,
      duration: "2 Months",
      isPaid: true, 
      objectives: ["Riffle shuffle", "Rake collection", "Side pots"] 
    },
    { 
      code: "G3", 
      title: "Baccarat", 
      desc: "Learn the elegance of Baccarat. Third-card rules and commissions.", 
      displayPrice: "$400 USD", 
      price: 400,
      duration: "2 Months",
      isPaid: true, 
      objectives: ["Third Card Rules", "Commission calculation", "Squeezing techniques"] 
    },
    { 
      code: "G4", 
      title: "Roulette", 
      desc: "The Queen of casino games. Chip mucking and wheel spinning.", 
      displayPrice: "$400 USD", 
      price: 400,
      duration: "2 Months",
      isPaid: true, 
      objectives: ["Mucking chips", "Picture bets", "Neighbor bets"] 
    },
    { 
      code: "G5", 
      title: "Craps", 
      desc: "The most exciting game. Stick calls, dice handling, and payouts.", 
      displayPrice: "$500 USD", 
      price: 500,
      duration: "2 Months",
      isPaid: true, 
      objectives: ["Stick handling", "Proposition bets", "Boxman duties"] 
    },
    { 
      code: "C1", 
      title: "Communication Skills", 
      desc: "Verbal and non-verbal techniques for command and control.", 
      displayPrice: "Free with Bundle", 
      price: 0,
      duration: "2 Months",
      isPaid: false, 
      objectives: ["Vocal projection", "Body language", "De-escalation"],
      
      // ✅ HERE IS WHERE WE ATTACH THE CONTENT
      lessons: C1_CONTENT.lessons 
    },
    { 
      code: "C2", 
      title: "Etiquette & Guest Relations", 
      desc: "Refine your professional demeanor and VIP protocol.", 
      displayPrice: "Free with Bundle", 
      price: 0,
      duration: "2 Months",
      isPaid: false, 
      objectives: ["VIP protocol", "Grooming", "Tipping etiquette"] 
    }
];

export const coursesData = courses; 
export default courses;