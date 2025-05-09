// src/database/supabase.js
const { createClient } = require('@supabase/supabase-js');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Sequelize connection to Supabase PostgreSQL
const sequelize = new Sequelize(process.env.POSTGRES_URL_NON_POOLING, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Vector operations using Supabase pgvector
const vectorOperations = {
  // Create embeddings and store in Supabase
  storeEmbedding: async (text, metadata, documentId) => {
    try {
      // Generate embedding using OpenAI
      const openai = require('../services/openaiService');
      const embeddingResponse = await openai.createEmbedding(text);
      
      // Store in Supabase
      const { data, error } = await supabase
        .from('financial_documents')
        .update({ 
          vector_embedding: embeddingResponse,
          metadata
        })
        .eq('id', documentId);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  },
  
  // Search for similar documents
  searchSimilarDocuments: async (query, limit = 5) => {
    try {
      // Generate embedding for query
      const openai = require('../services/openaiService');
      const queryEmbedding = await openai.createEmbedding(query);
      
      // Search using vector similarity
      const { data, error } = await supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }
};

// File storage operations using Supabase Storage
const storageOperations = {
  // Upload file to Supabase storage
  uploadFile: async (filePath, fileBuffer, contentType = 'text/csv') => {
    try {
      const { data, error } = await supabase.storage
        .from('financial-datasets')
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading file to Supabase:', error);
      throw error;
    }
  },
  
  // Get a file from Supabase storage
  getFile: async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('financial-datasets')
        .download(filePath);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error downloading file from Supabase:', error);
      throw error;
    }
  },
  
  // Get a public URL for a file
  getPublicUrl: (filePath) => {
    const { data } = supabase.storage
      .from('financial-datasets')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
};

module.exports = {
  supabase,
  sequelize,
  vectorOperations,
  storageOperations
};
