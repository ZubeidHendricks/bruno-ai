const { OpenAI } = require('openai');

// Initialize OpenAI with error handling
let openai;

try {
  // Check for API key from various environment variables
  const apiKey = process.env.OPENAI_API_KEY || 
                process.env.REACT_APP_OPENAI_API_KEY || 
                null;
  
  if (apiKey) {
    console.log('OpenAI API key found, initializing client');
    openai = new OpenAI({
      apiKey: apiKey
    });
  } else {
    console.warn('No OpenAI API key found. OpenAI features will be unavailable.');
    // Create a mock OpenAI client that returns error messages
    openai = {
      chat: {
        completions: {
          create: async () => {
            throw new Error('OpenAI API key not configured');
          }
        }
      },
      embeddings: {
        create: async () => {
          throw new Error('OpenAI API key not configured');
        }
      }
    };
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
  // Create a mock OpenAI client that returns error messages
  openai = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('OpenAI initialization failed');
        }
      }
    },
    embeddings: {
      create: async () => {
        throw new Error('OpenAI initialization failed');
      }
    }
  };
}

module.exports = openai;