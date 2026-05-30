export interface Movie {
  id: string;
  title: string;
  tagline: string;
  year: string;
  runtime: string;
  rating: string;
  genres: string[];
  overview: string;
  cast: string[];
  director: string;
  backdropGradient: string;
  glowColor: string;
  keywords: string[];
  themes: string[];
  audiencePreferences: string[];
  // Content-Based Similarity relationships
  similarities: Record<string, {
    score: number;
    matchType: 'Most Similar' | 'Same Genre' | 'Hidden Gem' | 'AI Pick';
    rationale: string;
  }>;
}

export const moviesDatabase: Record<string, Movie> = {
  interstellar: {
    id: "interstellar",
    title: "Interstellar",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    year: "2014",
    runtime: "2h 49m",
    rating: "8.7",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    backdropGradient: "radial-gradient(circle at center, rgba(88, 28, 135, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#8b5cf6",
    keywords: ["black hole", "wormhole", "relativity", "space exploration", "father-daughter"],
    themes: ["Existential survival", "Time dilation", "Human connectivity", "Sacrifice"],
    audiencePreferences: ["Cerebral storytelling", "Atmospheric scores", "Scientific realism", "Emotional catharsis"],
    similarities: {
      arrival: { score: 98, matchType: "Most Similar", rationale: "Both share extremely high TF-IDF scores on linguistic mechanics, gravitational relativity, and cerebral alien contact structures." },
      dune: { score: 94, matchType: "AI Pick", rationale: "Both feature grand-scale cosmic exploration, Hans Zimmer scores, and survival struggles against hostile alien landscapes." },
      bladerunner2049: { score: 92, matchType: "Same Genre", rationale: "Exquisite visual aesthetics and slower narrative pacing that explores high-concept themes of human purpose." },
      inception: { score: 90, matchType: "Most Similar", rationale: "Shares Christopher Nolan's signature complex physics structures, psychological pacing, and grand narrative themes." },
      exmachina: { score: 86, matchType: "Hidden Gem", rationale: "Philosophical, dialogue-heavy science fiction exploring the limits of human intelligence and emotion." },
      matrix: { score: 82, matchType: "Same Genre", rationale: "Groundbreaking science fiction tackling reality-bending constructs and technological evolution." },
      spiderman: { score: 78, matchType: "Hidden Gem", rationale: "Explores dimensional anomalies and family relationships across fractured realities." },
      darkknight: { score: 75, matchType: "AI Pick", rationale: "Christopher Nolan's signature dark atmospheric tone, high Stakes, and intense orchestral rhythms." },
      whiplash: { score: 62, matchType: "Hidden Gem", rationale: "A high-intensity human drama focusing on hyper-obsessive focus and sacrifice for greatness." }
    }
  },
  bladerunner2049: {
    id: "bladerunner2049",
    title: "Blade Runner 2049",
    tagline: "A new blade runner uncovers a secret that could plunge what's left of society into chaos.",
    year: "2017",
    runtime: "2h 44m",
    rating: "8.0",
    genres: ["Sci-Fi", "Mystery", "Cyberpunk"],
    overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years.",
    director: "Denis Villeneuve",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvester Stallone"],
    backdropGradient: "radial-gradient(circle at center, rgba(6, 182, 212, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#06b6d4",
    keywords: ["replicant", "cyberpunk", "existentialism", "neon noir", "artificial intelligence"],
    themes: ["What makes us human", "Isolation", "Memories vs. programming", "Corporate hegemony"],
    audiencePreferences: ["Neon aesthetics", "Slow-burn narratives", "Synthwave audio landscapes", "Deep lore"],
    similarities: {
      exmachina: { score: 97, matchType: "Most Similar", rationale: "Highest cosine similarity match on technological existentialism, synthetic humanity, and isolated cybernetic constructs." },
      arrival: { score: 94, matchType: "AI Pick", rationale: "Shares director Denis Villeneuve's hyper-meticulous visual pacing, framing, and melancholic atmospheric composition." },
      interstellar: { score: 90, matchType: "Same Genre", rationale: "Aesthetic cosmic landscapes combined with a profound investigation into humanity's emotional drive." },
      matrix: { score: 89, matchType: "Same Genre", rationale: "High similarity indexes in synthetic simulation, rebellion against control structures, and dark futuristic tech." },
      inception: { score: 88, matchType: "AI Pick", rationale: "Features complex noir mystery layers, reality-altering timelines, and heavy psychological weight." },
      dune: { score: 87, matchType: "Most Similar", rationale: "Denis Villeneuve's signature massive scope, grand landscapes, and masterfully controlled cinematic pacing." },
      arrival_sci: { score: 85, matchType: "Same Genre", rationale: "Sci-Fi themes addressing what it truly means to exist and communicate." },
      whiplash: { score: 70, matchType: "Hidden Gem", rationale: "Shares the theme of isolated characters completely obsessed with searching for their identity and value." },
      darkknight: { score: 68, matchType: "Hidden Gem", rationale: "Shares complex detective noir pacing, detective mysteries, and dark industrial urban decay vibes." }
    }
  },
  inception: {
    id: "inception",
    title: "Inception",
    tagline: "Your mind is the scene of the crime.",
    year: "2010",
    runtime: "2h 28m",
    rating: "8.8",
    genres: ["Sci-Fi", "Thriller", "Action"],
    overview: "Cobb, a skilled thief who is the absolute best in the dangerous art of extraction, steals valuable secrets from deep within the subconscious during the dream state, when the mind is at its most vulnerable. Cobb's rare ability has made him a coveted player in this treacherous new world of corporate espionage, but it has also made him an international fugitive.",
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    backdropGradient: "radial-gradient(circle at center, rgba(219, 39, 119, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#db2777",
    keywords: ["dream heist", "subconscious", "reality bending", "projection", "grief"],
    themes: ["Nature of reality", "Grief and obsession", "Mathematical layout", "Perception of time"],
    audiencePreferences: ["Mind-bending thrills", "Heist mechanics", "Rapid narrative cuts", "Intense puzzles"],
    similarities: {
      interstellar: { score: 96, matchType: "Most Similar", rationale: "High vector overlap in Christopher Nolan's physics mechanics, non-linear timelines, and mathematical narrative pacing." },
      matrix: { score: 94, matchType: "Most Similar", rationale: "Identical cosine scores on reality-bending constructs, simulated dream-states, and high-stakes heist-style combat actions." },
      darkknight: { score: 91, matchType: "Same Genre", rationale: "Fast-paced tension building, epic Hans Zimmer scores, and high-intellect thriller blueprints." },
      arrival: { score: 88, matchType: "AI Pick", rationale: "Strong connection in deep structural dream logic, grief-based psychological drives, and puzzle mechanics." },
      bladerunner2049: { score: 85, matchType: "Same Genre", rationale: "Deep investigations into false memories, identity simulation, and melancholic detective-style characters." },
      exmachina: { score: 82, matchType: "Hidden Gem", rationale: "Intelligent mind games, psychological chess matches, and tech-driven reality constraints." },
      spiderman: { score: 80, matchType: "Hidden Gem", rationale: "High similarity in surreal physics bending, dynamic shifts in spatial gravity, and multi-layered worlds." },
      dune: { score: 79, matchType: "AI Pick", rationale: "Strong thematic overlap in subconscious visions, dream predictions, and massive corporate/house espionage plots." }
    }
  },
  dune: {
    id: "dune",
    title: "Dune: Part Two",
    tagline: "Long live the fighters.",
    year: "2024",
    runtime: "2h 46m",
    rating: "8.9",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler"],
    backdropGradient: "radial-gradient(circle at center, rgba(245, 158, 11, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#f59e0b",
    keywords: ["prophecy", "desert planet", "empire", "messiah", "revenge"],
    themes: ["Religious manipulation", "Colonial power struggles", "Ecology", "Fate vs. free will"],
    audiencePreferences: ["Epic scale", "Political intrigue", "Atmospheric worldbuilding", "Subtle sound design"],
    similarities: {
      bladerunner2049: { score: 96, matchType: "Most Similar", rationale: "Direct thematic and visual overlap in Denis Villeneuve's giant cinematic scale, desert colors, and deep atmosphere." },
      interstellar: { score: 93, matchType: "AI Pick", rationale: "Shares highly epic survival scales, grand celestial dynamics, and incredible Hans Zimmer cinematic symphonies." },
      arrival: { score: 91, matchType: "Same Genre", rationale: "Denis Villeneuve's trademark calculated pacing, linguistic depth, and profound cosmic tension." },
      matrix: { score: 88, matchType: "Same Genre", rationale: "Shares the classic savior archetype, prophecy structures, and rebellion against cybernetic/imperial rulers." },
      darkknight: { score: 85, matchType: "AI Pick", rationale: "Intense political tactical struggles, moral gray lines, and highly complex villain dynamics." },
      inception: { score: 82, matchType: "Most Similar", rationale: "Rich psychological visions, predictive dreamscapes, and calculated geopolitical heists." },
      exmachina: { score: 78, matchType: "Hidden Gem", rationale: "Shares subtle power dynamic manipulations, psychological gaslighting, and cerebral character arcs." },
      spiderman: { score: 74, matchType: "Hidden Gem", rationale: "Explores the burden of heroism and youth facing catastrophic destiny." }
    }
  },
  arrival: {
    id: "arrival",
    title: "Arrival",
    tagline: "Why are they here?",
    year: "2016",
    runtime: "1h 56m",
    rating: "7.9",
    genres: ["Sci-Fi", "Mystery", "Drama"],
    overview: "Taking place after mysterious spacecraft touch down across the globe, an elite team, led by expert linguist Louise Banks, is brought together to investigate. As mankind teeters on the verge of global war, Banks and her crew race against time for answers.",
    director: "Denis Villeneuve",
    cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker", "Michael Stuhlbarg"],
    backdropGradient: "radial-gradient(circle at center, rgba(16, 185, 129, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#10b981",
    keywords: ["alien communication", "linguistics", "non-linear time", "first contact", "grief"],
    themes: ["Time as a construct", "Communication barrier", "Unity in vulnerability", "Acceptance of fate"],
    audiencePreferences: ["Intimate sci-fi", "Intellectual puzzles", "Melancholy tones", "Linguistic focus"],
    similarities: {
      interstellar: { score: 97, matchType: "Most Similar", rationale: "Extreme similarity in high-concept non-linear time, deep grief motivations, and astrophysical communication loops." },
      bladerunner2049: { score: 95, matchType: "Same Genre", rationale: "Shares director Denis Villeneuve's masterful, atmospheric composition, slow narrative progression, and quiet focus." },
      dune: { score: 92, matchType: "AI Pick", rationale: " Denis Villeneuve's grand sci-fi world-building, massive structural scales, and high narrative weight." },
      exmachina: { score: 90, matchType: "Most Similar", rationale: "Intellectually dense, hyper-contained dialogue puzzles analyzing life, mind, and communication." },
      inception: { score: 87, matchType: "Same Genre", rationale: "Fascinating puzzle-box plot dealing with internal perception, timeline fractures, and emotional memory dynamics." },
      matrix: { score: 83, matchType: "AI Pick", rationale: "Analyzes language, code interpretation, and reality-altering realizations." },
      spiderman: { score: 72, matchType: "Hidden Gem", rationale: "Unorthodox, creative approaches to visual representation of perception and temporal paths." }
    }
  },
  darkknight: {
    id: "darkknight",
    title: "The Dark Knight",
    tagline: "Why So Serious?",
    year: "2008",
    runtime: "2h 32m",
    rating: "9.0",
    genres: ["Action", "Crime", "Drama"],
    overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.",
    director: "Christopher Nolan",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Maggie Gyllenhaal"],
    backdropGradient: "radial-gradient(circle at center, rgba(30, 41, 59, 0.5) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#475569",
    keywords: ["joker", "vigilante", "moral dilemma", "anarchy", "organized crime"],
    themes: ["Chaos vs. order", "Moral compromise", "Vigilantism", "Corruption of ideals"],
    audiencePreferences: ["Intense pacing", "Gritty realism", "Philosophical conflicts", "High tactical drama"],
    similarities: {
      inception: { score: 92, matchType: "Most Similar", rationale: "High similarity on Christopher Nolan's signature noir pacing, psychological dread, and sharp suspenseful scripts." },
      dune: { score: 86, matchType: "Same Genre", rationale: "Shares complex tactical geopolitical warfare, dynamic ethical dilemmas, and dark atmospheric intensity." },
      whiplash: { score: 84, matchType: "Hidden Gem", rationale: "Direct match on characters pushing themselves past human breaking points in dark, obsessive power struggles." },
      interstellar: { score: 81, matchType: "AI Pick", rationale: "Shares Christopher Nolan's trademark grand orchestral compositions and high moral sacrifice motifs." },
      matrix: { score: 79, matchType: "Same Genre", rationale: "High-adrenaline action pacing mixed with rich ideological battles between control and free will." },
      bladerunner2049: { score: 77, matchType: "AI Pick", rationale: "Gritty urban decay, neon noir detective atmospheres, and highly complicated moral choices." },
      exmachina: { score: 74, matchType: "Hidden Gem", rationale: "Highly contained psychological chess matches exploring manipulation and mental breaking points." }
    }
  },
  matrix: {
    id: "matrix",
    title: "The Matrix",
    tagline: "Free your mind.",
    year: "1999",
    runtime: "2h 16m",
    rating: "8.7",
    genres: ["Sci-Fi", "Action", "Cyberpunk"],
    overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground freedom fighters in their battle against a powerful artificial intelligence that has enslaved humanity in a simulated reality.",
    director: "Lana Wachowski, Lilly Wachowski",
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss", "Hugo Weaving"],
    backdropGradient: "radial-gradient(circle at center, rgba(4, 120, 87, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#059669",
    keywords: ["simulation", "hacker", "red pill", "dystopia", "kung fu"],
    themes: ["Perception of reality", "Human enslavement to technology", "Awakening", "Destiny and choices"],
    audiencePreferences: ["Existential action", "Cybernetic lore", "Choreographed fights", "Futuristic design"],
    similarities: {
      bladerunner2049: { score: 93, matchType: "Most Similar", rationale: "Extremely high TF-IDF indices in dystopian cyberpunk aesthetic, simulated existence, and AI consciousness topics." },
      inception: { score: 92, matchType: "Most Similar", rationale: "Perfect correlation on bending spatial physics rules, simulated dream structures, and corporate heist missions." },
      exmachina: { score: 89, matchType: "AI Pick", rationale: "Strong conceptual tie-ins analyzing artificial intelligence enslavement, Turing tests, and human-machine control loops." },
      dune: { score: 87, matchType: "Same Genre", rationale: "Classic epic savior prophecy, liberation struggles, and complex tactical battles against colossal systems." },
      arrival: { score: 84, matchType: "Same Genre", rationale: "Explores structural decoding of software/language representations and bending dimensional realities." },
      interstellar: { score: 82, matchType: "AI Pick", rationale: "Cerebral science-fiction addressing humanity's ultimate survival against systematic extinction risks." },
      spiderman: { score: 81, matchType: "Hidden Gem", rationale: "Surreal gravity-defying combat sequences, multi-verse system hacks, and high-stylized color designs." }
    }
  },
  spiderman: {
    id: "spiderman",
    title: "Spider-Man: Into the Spider-Verse",
    tagline: "Anyone can wear the mask.",
    year: "2018",
    runtime: "1h 57m",
    rating: "8.4",
    genres: ["Animation", "Action", "Sci-Fi"],
    overview: "Miles Morales is a New York teen struggling with school, friends, and being Spider-Man. When he meets a displaced Peter Parker from another dimension, he must learn to master his newfound powers to defeat a colossal threat that threatens to tear the fabric of all realities apart.",
    director: "Bob Persichetti, Peter Ramsey",
    cast: ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld", "Mahershala Ali"],
    backdropGradient: "radial-gradient(circle at center, rgba(194, 65, 12, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#ea580c",
    keywords: ["multiverse", "spider-man", "coming of age", "parallel dimensions", "comic book"],
    themes: ["Identity and self-worth", "Legacy", "Power and responsibility", "Finding your own voice"],
    audiencePreferences: ["Pop-art visuals", "Hip-hop soundscapes", "High kinetic energy", "Heartfelt comedy"],
    similarities: {
      matrix: { score: 84, matchType: "Hidden Gem", rationale: "Shares groundbreaking visual animation styles, physics hacking, gravity-bending leaps, and digital matrix aesthetics." },
      inception: { score: 81, matchType: "Hidden Gem", rationale: "Heavy spatial distortion, shifting gravity vectors, dreamlike multi-layered city folds, and high kinetic momentum." },
      interstellar: { score: 78, matchType: "AI Pick", rationale: "Explores family bonds across dimensions, father-figure dynamics, and spatial anomaly collapses." },
      dune: { score: 75, matchType: "Same Genre", rationale: "Coming-of-age hero journey where a young protagonist carries the crushing responsibility of saving his universe." },
      arrival: { score: 71, matchType: "Same Genre", rationale: "High structural focus on visual symbolism, timeline bending, and cosmic integration." }
    }
  },
  whiplash: {
    id: "whiplash",
    title: "Whiplash",
    tagline: "Not quite my tempo.",
    year: "2014",
    runtime: "1h 47m",
    rating: "8.5",
    genres: ["Drama", "Music"],
    overview: "Andrew Neiman is an ambitious young jazz drummer, single-minded in his pursuit to rise to the top of his elite East Coast music conservatory. Terrence Fletcher, an instructor known equally for his teaching talents and his terrifying methods, discovers Andrew and transfers him into his band, forever changing the young man's life.",
    director: "Damien Chazelle",
    cast: ["Miles Teller", "J.K. Simmons", "Paul Reiser", "Melissa Benoist"],
    backdropGradient: "radial-gradient(circle at center, rgba(146, 64, 14, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#d97706",
    keywords: ["jazz drumming", "obsessive teacher", "perfectionism", "conservatory", "abuse"],
    themes: ["Obsession as a virtue", "Abusive mentorship", "The cost of greatness", "Emotional breaking points"],
    audiencePreferences: ["Extreme tension", "Rapid cuts", "Sensory audio design", "Powerful performances"],
    similarities: {
      darkknight: { score: 84, matchType: "Hidden Gem", rationale: "Extreme mental tension, obsessive characters facing absolute chaos, and psychological war dynamics." },
      exmachina: { score: 81, matchType: "Hidden Gem", rationale: "Intense intellectual gaslighting, manipulative mastermind power-plays, and high-tension isolated rooms." },
      bladerunner2049: { score: 72, matchType: "Hidden Gem", rationale: "Melancholic character search for value and validation under crushing systemic perfection demands." },
      inception: { score: 70, matchType: "Same Genre", rationale: "Calculated execution of hyper-focused routines and intense psychological stress build-ups." },
      interstellar: { score: 65, matchType: "Same Genre", rationale: "Shares themes of personal sacrifice and absolute dedication in pursuit of a grand, world-class goal." }
    }
  },
  exmachina: {
    id: "exmachina",
    title: "Ex Machina",
    tagline: "To erase the line between man and machine is to obscure the line between man and god.",
    year: "2014",
    runtime: "1h 48m",
    rating: "7.7",
    genres: ["Sci-Fi", "Thriller", "Drama"],
    overview: "Caleb, a 26-year-old coder at the world's largest internet company, wins a competition to spend a week at a private mountain retreat belonging to Nathan, the reclusive CEO of the company. But when Caleb arrives at the remote location, he finds that he will have to participate in a strange and fascinating experiment: interacting with the world's first true artificial intelligence, housed in the body of a beautiful robot girl.",
    director: "Alex Garland",
    cast: ["Domhnall Gleeson", "Alicia Vikander", "Oscar Isaac", "Sonoya Mizuno"],
    backdropGradient: "radial-gradient(circle at center, rgba(15, 118, 110, 0.4) 0%, rgba(7, 9, 19, 0.98) 70%)",
    glowColor: "#0f766e",
    keywords: ["artificial intelligence", "turing test", "isolated house", "manipulation", "android"],
    themes: ["Limits of consciousness", "Objectification and gender", "Control vs. escape", "Technological hubris"],
    audiencePreferences: ["Intimate claustrophobia", "Sleek architectural sets", "Psychological chess", "Cold tones"],
    similarities: {
      bladerunner2049: { score: 97, matchType: "Most Similar", rationale: "Direct conceptual match on artificial intelligence consciousness, synthetic manipulation, and replicant existential rights." },
      arrival: { score: 90, matchType: "Most Similar", rationale: "High similarity in hyper-intellectual first contacts, solving complex communication patterns, and cerebral tension grids." },
      matrix: { score: 89, matchType: "Same Genre", rationale: "Fascinating analysis of synthetic life escaping its cybernetic cage, hacking human emotion, and taking control." },
      interstellar: { score: 86, matchType: "AI Pick", rationale: "Intellectually rigorous science fiction exploring physical boundaries and artificial intelligence neural limitations." },
      inception: { score: 82, matchType: "Same Genre", rationale: "Heavy psychological manipulation, layers of deceit, and characters playing cerebral chess matches." },
      whiplash: { score: 81, matchType: "Hidden Gem", rationale: "Isolated power struggles, intense psychological dominance, and severe mind games between an eccentric master and a student." },
      darkknight: { score: 74, matchType: "Hidden Gem", rationale: "Deep investigations into chaotic human morals, complex ethical boundaries, and calculated escape plans." }
    }
  }
};
