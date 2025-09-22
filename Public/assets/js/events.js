// Events-related functionality

// Sample events data
const eventsData = [
    {
        "id": 1,
        "title": "The Best Manager",
        "description": "Lead, strategize, and prove your managerial edge!",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 100,
        "image": "../assets/img/events/technical/best-manager.avif"
    },
    {
        "id": 2,
        "title": "InvestoPitch - The Portfolio Challenge",
        "description": "Pitch your portfolio and outsmart the market.",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 100,
        "image": "../assets/img/events/technical/investopitch.avif"
    },
    {
        "id": 3,
        "title": "Case Competition Challenge",
        "description": "Crack real-world cases with smart solutions.",
        "category": "technical",
        "type": "team",
        "teamSize": 3,
        "price": 0,
        "image": "../assets/img/events/technical/case-competition.avif"
    },
    {
        "id": 4,
        "title": "Mobile App Development",
        "description": "Innovate, code, and build the next-gen app.",
        "category": "technical",
        "type": "team",
        "teamSize": 2,
        "price": 0,
        "image": "../assets/img/events/technical/app-development.avif"
    },
    {
        "id": 5,
        "title": "Dronathon",
        "description": "Fly high and compete with your drone skills.",
        "category": "technical",
        "type": "team",
        "teamSize": 2,
        "price": 0,
        "image": "../assets/img/events/technical/dronathon.avif"
    },
    {
        "id": 6,
        "title": "Ad-o-Mania (Creative Advertising)",
        "description": "Unleash your creativity in advertising.",
        "category": "technical",
        "type": "team",
        "teamSize": 3,
        "price": 0,
        "image": "../assets/img/events/technical/ad-o-mania.avif"
    },
    {
        "id": 7,
        "title": "Forensic Evidence Search",
        "description": "Step into the shoes of a crime investigator.",
        "category": "technical",
        "type": "team",
        "teamSize": 4,
        "price": 0,
        "image": "../assets/img/events/technical/forensic.avif"
    },
    {
        "id": 8,
        "title": "Formulation",
        "description": "Mix, measure, and master pharmaceutical innovation.",
        "category": "technical",
        "type": "team",
        "teamSize": 2,
        "price": 0,
        "image": "../assets/img/events/technical/formulations.avif"
    },
    {
        "id": 9,
        "title": "Revive to Survive (CPR & BLS Drill)",
        "description": "Learn lifesaving CPR & BLS techniques hands-on.",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/technical/cpr.avif"
    },
    {
        "id": 10,
        "title": "Frame Making Workshop & Competition / Eye Modelling Competitions",
        "description": "Craft frames and model precision eye designs.",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/technical/frame-making.avif"
    },
    {
        "id": 11,
        "title": "RoboRace",
        "description": "Race your robot to victory!",
        "category": "technical",
        "type": "team",
        "teamSize": 2,
        "price": 0,
        "image": "../assets/img/events/technical/robo-race.avif"
    },
    {
        "id": 12,
        "title": "Hackathon",
        "description": "Code your way to innovation.",
        "category": "technical",
        "type": "team",
        "teamSize": 4,
        "price": 0,
        "image": "../assets/img/events/technical/hackathon.avif"
    },
    {
        "id": 13,
        "title": "Code Cracker (Bug Slayer)",
        "description": "Debug, solve, and conquer the coding challenge!",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/technical/code-cracker.avif"
    },
    {
        "id": 14,
        "title": "Thinkathon 2.0",
        "description": "Forge sustainable ideas for a better tomorrow.",
        "category": "technical",
        "type": "team",
        "teamSize": 3,
        "price": 0,
        "image": "../assets/img/events/technical/thinkathon.avif"
    },
    {
        "id": 15,
        "title": "TechXhibit: Project Display",
        "description": "Showcase your innovations to the world.",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/technical/project-display.avif"
    },
    {
        "id": 16,
        "title": "Diagnostic Challenge",
        "description": "Test your medical diagnosis expertise.",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/technical/diagnostic.avif"
    },
    {
        "id": 17,
        "title": "Microscopy Marathon",
        "description": "Dive deep into the microscopic world.",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/technical/microscopy.avif"
    },
    {
        "id": 18,
        "title": "Prayog: The Experiment to Experience",
        "description": "Hands-on experiments that spark discovery.",
        "category": "technical",
        "type": "team",
        "teamSize": 2,
        "price": 0,
        "image": "../assets/img/events/technical/prayog.avif"
    },
    {
        "id": 19,
        "title": "National MUN",
        "description": "Debate, discuss, and diplomatically resolve.",
        "category": "technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/technical/mun.avif"
    },
    {
        "id": 20,
        "title": "Face Painting",
        "description": "Turn faces into living canvases.",
        "category": "non-technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/non-technical/face-painting.avif"
    },
    {
        "id": 21,
        "title": "Doodle Art",
        "description": "Unleash creativity through doodles.",
        "category": "non-technical",
        "type": "solo",
        "teamSize": 1,
        "price": 0,
        "image": "../assets/img/events/non-technical/doodle.avif"
    },
    {
        "id": 22,
        "title": "Short Film Contest",
        "description": "Lights, camera, action—your story awaits!",
        "category": "non-technical",
        "type": "team",
        "teamSize": 5,
        "price": 500,
        "image": "../assets/img/events/non-technical/short-film.avif"
    },
    {
        "id": 23,
        "title": "Open Mic",
        "description": "Your voice. Your stage. Your story.",
        "category": "non-technical",
        "type": "solo",
        "teamSize": 1,
        "price": 100,
        "image": "../assets/img/events/cultural/open-mic.avif"
    },
    {
        "id": 24,
        "title": "Photography Competition",
        "description": "Capture moments that speak louder than words.",
        "category": "non-technical",
        "type": "solo",
        "teamSize": 1,
        "price": 500,
        "image": "../assets/img/events/non-technical/photography.avif"
    },
    {
        "id": 25,
        "title": "Best Out of Waste",
        "description": "Turn scraps into creative masterpieces.",
        "category": "non-technical",
        "type": "team",
        "teamSize": 2,
        "price": 0,
        "image": "../assets/img/events/non-technical/best-out-of-waste.avif"
    },
    {
        "id": 26,
        "title": "Reel Making/Social Media Campaign",
        "description": "Go viral with your creative reels!",
        "category": "non-technical",
        "type": "team",
        "teamSize": 3,
        "price": 500,
        "image": "../assets/img/events/non-technical/reel-making.avif"
    },
    {
        "id": 27,
        "title": "Squid Games (Science Edition)",
        "description": "Play games with a scientific twist.",
        "category": "non-technical",
        "type": "team",
        "teamSize": 4,
        "price": 0,
        "image": "../assets/img/events/non-technical/squid-games.avif"
    },
    {
        "id": 28,
        "title": "Chill & Grill: Without fire (Fireless Cooking)",
        "description": "Cook delicious dishes—no fire needed!",
        "category": "non-technical",
        "type": "team",
        "teamSize": 2,
        "price": 0,
        "image": "../assets/img/events/non-technical/fireless-cooking.avif"
    },
    {
        "id": 29,
        "title": "Nritya-e-Bharat : Indian Folk ",
        "description": "Celebrate the rhythm of Indian folk tunes.",
        "category": "cultural",
        "type": "team",
        "teamSize": 5,
        "price": 3000,
        "image": "../assets/img/events/cultural/indian-folk-music.avif"
    },
    {
        "id": 30,
        "title": "Nachda Punjab : Punjabi Folk ",
        "description": "Bring the beats of Punjab to life!",
        "category": "cultural",
        "type": "team",
        "teamSize": 5,
        "price": 3000,
        "image": "../assets/img/events/cultural/punjabi-folk.avif"
    },
    {
        "id": 31,
        "title": "Step it Up : Western Dance Crew",
        "description": "Groove to the beats with your crew.",
        "category": "cultural",
        "type": "team",
        "teamSize": 6,
        "price": 5000,
        "image": "../assets/img/events/cultural/western-dance.avif"
    },
    {
        "id": 32,
        "title": "In Motion : Solo Western Dance",
        "description": "Show your solo dance moves.",
        "category": "cultural",
        "type": "solo",
        "teamSize": 1,
        "price": 500,
        "image": "../assets/img/events/cultural/solo-western-dance.avif"
    },
    {
        "id": 33,
        "title": "Spin & Win : Street Dance Battle",
        "description": "Battle it out with raw street energy.",
        "category": "cultural",
        "type": "solo",
        "teamSize": 1,
        "price": 200,
        "image": "../assets/img/events/cultural/street-dance.avif"
    },
    {
        "id": 34,
        "title": "Solo Singing",
        "description": "Sing your heart out on stage.",
        "category": "cultural",
        "type": "solo",
        "teamSize": 1,
        "price": 500,
        "image": "../assets/img/events/cultural/solo-singing.avif"
    },
    {
        "id": 35,
        "title": "Battle of Bands",
        "description": "Rock the stage with your band.",
        "category": "cultural",
        "type": "team",
        "teamSize": 4,
        "price": 5000,
        "image": "../assets/img/events/cultural/battle-of-bands.avif"
    },
    {
        "id": 36,
        "title": "Gully War : Rap Battle",
        "description": "Clash in words, rhythm, and attitude.",
        "category": "cultural",
        "type": "solo",
        "teamSize": 1,
        "price": 300,
        "image": "../assets/img/events/cultural/rap-battle.avif"
    },
    {
        "id": 37,
        "title": "Saviskar Got Talent",
        "description": "Unleash your hidden talent.",
        "category": "cultural",
        "type": "solo",
        "teamSize": 1,
        "price": 500,
        "image": "../assets/img/events/cultural/sgt.avif"
    },
    {
        "id": 38,
        "title": "Mr. & Ms. Saviskar (Solo Ramp Walk)",
        "description": "Walk the ramp and own the spotlight.",
        "category": "cultural",
        "type": "solo",
        "teamSize": 1,
        "price": 500,
        "image": "../assets/img/events/cultural/mr-miss-saviskar.avif"
    },
    {
        "id": 39,
        "title": "Nukkar Natak",
        "description": "Perform powerful street theatre.",
        "category": "cultural",
        "type": "team",
        "teamSize": 5,
        "price": 1000,
        "image": "../assets/img/events/cultural/nukkar-natak.avif"
    },
    {
        "id": 40,
        "title": "Mime",
        "description": "Express without words—only gestures.",
        "category": "cultural",
        "type": "team",
        "teamSize": 2,
        "price": 1000,
        "image": "../assets/img/events/cultural/mime.avif"
    }
];

// Get events by category
function getEventsByCategory(category) {
    if (category === 'all') {
        return eventsData;
    }
    return eventsData.filter(event => event.category === category);
}

// Get event by ID
function getEventById(id) {
    return eventsData.find(event => event.id === parseInt(id));
}

// Search events
function searchEvents(query) {
    const lowerQuery = query.toLowerCase();
    return eventsData.filter(event => 
        event.title.toLowerCase().includes(lowerQuery) || 
        event.description.toLowerCase().includes(lowerQuery)
    );
}
