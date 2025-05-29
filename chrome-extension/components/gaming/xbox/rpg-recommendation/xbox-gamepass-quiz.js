/**
 * Xbox Game Pass Interactive Quiz Component
 * A recommendation engine that helps users discover RPG games through an interactive quiz
 * Dimensions: 600x400px
 * Advertiser: Xbox Game Pass
 * Target Sites: Gaming websites like pcgamer.com
 */

class XboxGamePassQuiz extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.firstChoice = null;
    this.secondChoice = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    // Cleanup event listeners if needed
    // Event listeners attached to shadow DOM elements are automatically cleaned up
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .xbox-ad-container {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          background: linear-gradient(to right, #0a2e1f, #1a2735);
          color: white;
          border: 1px solid #10b981;
          width: 600px;
          height: 400px;
          position: relative;
        }
        
        .xbox-ad-header {
          background-color: #000;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 40px;
        }
        
        .xbox-logo-container {
          display: flex;
          align-items: center;
        }
        
        .xbox-logo {
          width: 24px;
          height: 24px;
          margin-right: 6px;
        }
        
        .xbox-brand-text {
          font-weight: bold;
          font-size: 16px;
        }
        
        .ad-label {
          font-size: 10px;
          background-color: #10b981;
          padding: 2px 6px;
          border-radius: 2px;
        }
        
        .xbox-ad-content {
          padding: 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 360px;
        }
        
        .question-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 6px;
          text-align: center;
          line-height: 1.2;
        }
        
        .question-subtitle {
          text-align: center;
          margin-bottom: 12px;
          color: #34d399;
          font-size: 14px;
        }
        
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        
        .option-button {
          background-color: #166534;
          color: white;
          padding: 10px 12px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          border: none;
          transition: background-color 0.3s;
          font-size: 14px;
          width: 100%;
          text-align: left;
        }
        
        .option-button:hover {
          background-color: #047857;
        }
        
        .option-text {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .chevron-right {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-left: 8px;
        }
        
        .recommendation-container {
          display: flex;
          gap: 12px;
          width: 100%;
          height: 280px;
        }
        
        .game-image-container {
          flex: 0 0 45%;
        }
        
        .game-details-container {
          flex: 0 0 55%;
          display: flex;
          flex-direction: column;
        }
        
        .game-image {
          width: 100%;
          height: auto;
          max-height: 140px;
          border-radius: 4px;
          object-fit: cover;
        }
        
        .game-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 6px;
          line-height: 1.2;
        }
        
        .game-description {
          margin-bottom: 8px;
          font-size: 12px;
          line-height: 1.3;
          max-height: 80px;
          overflow: hidden;
        }
        
        .perfect-match-badge {
          background-color: #16a34a;
          color: white;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 8px;
          width: fit-content;
        }
        
        .cta-button {
          background-color: #10b981;
          color: white;
          font-weight: bold;
          padding: 8px 16px;
          border-radius: 4px;
          text-align: center;
          text-decoration: none;
          transition: background-color 0.3s;
          display: inline-block;
          font-size: 14px;
          width: fit-content;
          border: none;
          cursor: pointer;
        }
        
        .cta-button:hover {
          background-color: #059669;
        }
        
        .terms-text {
          font-size: 9px;
          margin-top: 8px;
          color: #34d399;
        }
        
        .footer-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px 15px;
          border-top: 1px solid #166534;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(10, 46, 31, 0.8);
        }
        
        .start-over-button {
          color: #34d399;
          background: none;
          border: none;
          font-size: 11px;
          cursor: pointer;
        }
        
        .start-over-button:hover {
          color: #10b981;
        }
        
        .info-text {
          font-size: 11px;
        }
        
        .hidden {
          display: none;
        }
      </style>

      <div class="xbox-ad-container">
        <!-- Header -->
        <div class="xbox-ad-header">
          <div class="xbox-logo-container">
            <img src="https://i.ibb.co/5X0GGgD5/xbox-white-1.png" alt="Xbox Logo" class="xbox-logo">
            <span class="xbox-brand-text">Game Pass</span>
          </div>
          <div class="ad-label">AD</div>
        </div>
        
        <!-- Stage 1: Initial Question -->
        <div class="xbox-ad-content" id="stage-1">
          <h2 class="question-title">Discover Your Next Adventure</h2>
          <p class="question-subtitle">What matters most to you in an RPG?</p>
          
          <div class="options-grid">
            <button class="option-button" id="story-btn">
              <span class="option-text">Compelling Story</span>
              <svg class="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <button class="option-button" id="combat-btn">
              <span class="option-text">Exciting Combat</span>
              <svg class="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <button class="option-button" id="exploration-btn">
              <span class="option-text">World Exploration</span>
              <svg class="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Stage 2: Follow-up Question -->
        <div class="xbox-ad-content hidden" id="stage-2">
          <h2 class="question-title">Almost There!</h2>
          <p class="question-subtitle">What setting captures your imagination?</p>
          
          <div class="options-grid">
            <button class="option-button" id="fantasy-btn">
              <span class="option-text">Epic Fantasy</span>
              <svg class="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <button class="option-button" id="scifi-btn">
              <span class="option-text">Sci-Fi Worlds</span>
              <svg class="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <button class="option-button" id="action-btn">
              <span class="option-text">Action Adventure</span>
              <svg class="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Stage 3: Recommendation -->
        <div class="xbox-ad-content hidden" id="stage-3">
          <div class="recommendation-container">
            <div class="game-image-container">
              <img id="game-image" src="https://i.ibb.co/bRNh9NFk/gaming-1.jpg" alt="Game Image" class="game-image">
            </div>
            
            <div class="game-details-container">
              <h2 class="game-title" id="game-title">Game Title</h2>
              <p class="game-description" id="game-description">Game description will appear here.</p>
              
              <div class="perfect-match-badge">Perfect Match!</div>
              
              <button class="cta-button" id="cta-btn">
                Play Free for 30 Days
              </button>
              
              <p class="terms-text">
                Xbox Game Pass | New members only | Terms apply
              </p>
            </div>
          </div>
          
          <div class="footer-container">
            <button class="start-over-button" id="start-over-btn">
              Start Over
            </button>
            
            <p class="info-text">
              100+ RPGs available on Game Pass
            </p>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // First stage button event listeners
    this.shadowRoot.getElementById('story-btn').addEventListener('click', () => {
      this.firstChoice = 'story';
      this.showStage(2);
    });
    
    this.shadowRoot.getElementById('combat-btn').addEventListener('click', () => {
      this.firstChoice = 'combat';
      this.showStage(2);
    });
    
    this.shadowRoot.getElementById('exploration-btn').addEventListener('click', () => {
      this.firstChoice = 'exploration';
      this.showStage(2);
    });
    
    // Second stage button event listeners
    this.shadowRoot.getElementById('fantasy-btn').addEventListener('click', () => {
      this.secondChoice = 'fantasy';
      this.updateRecommendation();
      this.showStage(3);
    });
    
    this.shadowRoot.getElementById('scifi-btn').addEventListener('click', () => {
      this.secondChoice = 'scifi';
      this.updateRecommendation();
      this.showStage(3);
    });
    
    this.shadowRoot.getElementById('action-btn').addEventListener('click', () => {
      this.secondChoice = 'action';
      this.updateRecommendation();
      this.showStage(3);
    });
    
    // Start over button event listener
    this.shadowRoot.getElementById('start-over-btn').addEventListener('click', () => {
      this.firstChoice = null;
      this.secondChoice = null;
      this.showStage(1);
    });

    // CTA button event listener
    this.shadowRoot.getElementById('cta-btn').addEventListener('click', () => {
      window.open('https://www.xbox.com/en-US/xbox-game-pass', '_blank');
    });
  }

  showStage(stageNumber) {
    // Hide all stages
    for (let i = 1; i <= 3; i++) {
      const stage = this.shadowRoot.getElementById(`stage-${i}`);
      if (stage) {
        stage.classList.add('hidden');
      }
    }
    
    // Show the requested stage
    const targetStage = this.shadowRoot.getElementById(`stage-${stageNumber}`);
    if (targetStage) {
      targetStage.classList.remove('hidden');
    }
  }

  updateRecommendation() {
    const recommendation = this.getRecommendation();
    this.shadowRoot.getElementById('game-title').textContent = recommendation.title;
    this.shadowRoot.getElementById('game-description').textContent = recommendation.description;
    this.shadowRoot.getElementById('game-image').src = recommendation.image;
    this.shadowRoot.getElementById('game-image').alt = recommendation.title;
  }

  getRecommendation() {
    const recommendations = {
      'story-fantasy': {
        title: "Dragon Age: The Veilguard",
        description: "Embark on an epic journey through Thedas as Rook, gathering companions to save the world from looming disaster.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'story-scifi': {
        title: "Mass Effect Legendary Edition",
        description: "Lead Commander Shepard in the fight to save the galaxy in this remastered trilogy with over 100 hours of story.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'story-action': {
        title: "Cyberpunk 2077",
        description: "Navigate the dangerous streets of Night City in this story-driven open-world adventure.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'combat-fantasy': {
        title: "Elden Ring",
        description: "Challenge yourself in the Lands Between with punishing but rewarding combat in this dark fantasy epic.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'combat-scifi': {
        title: "Halo Infinite",
        description: "Master tactical combat with a sci-fi arsenal as you battle across exotic planets as the Master Chief.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'combat-action': {
        title: "Diablo IV",
        description: "Unleash your combat skills against the forces of hell in this action-packed dungeon crawler.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'exploration-fantasy': {
        title: "The Elder Scrolls V: Skyrim",
        description: "Explore the vast province of Skyrim with unlimited freedom in this legendary open-world fantasy RPG.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'exploration-scifi': {
        title: "Starfield",
        description: "Chart your own path through the stars in Bethesda's epic space RPG with over 1000 planets to explore.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'exploration-action': {
        title: "Assassin's Creed: Odyssey",
        description: "Forge your destiny in Ancient Greece in this action-adventure with a massive world to discover.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      }
    };

    const key = `${this.firstChoice}-${this.secondChoice}`;
    return recommendations[key] || recommendations['story-fantasy'];
  }
}

// Register the custom element safely
if (typeof customElements !== 'undefined' && customElements) {
  customElements.define('xbox-gamepass-quiz', XboxGamePassQuiz);
}

// Make available globally and for module systems
if (typeof window !== 'undefined') {
  window.XboxGamePassQuiz = XboxGamePassQuiz;
}

export default XboxGamePassQuiz;