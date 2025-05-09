const { OpenAI } = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

module.exports = openai;
