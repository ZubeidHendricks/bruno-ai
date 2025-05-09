// src/services/openaiService.js
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

// Create embedding for text
const createEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
};

// Generate chat completion
const generateChatCompletion = async (messages, options = {}) => {
  try {
    const defaultOptions = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 500
    };
    
    const response = await openai.chat.completions.create({
      ...defaultOptions,
      ...options,
      messages
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
};

// Generate JSON response from OpenAI
const generateJsonResponse = async (messages) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating JSON response:', error);
    throw error;
  }
};

module.exports = {
  openai,
  createEmbedding,
  generateChatCompletion,
  generateJsonResponse
};
