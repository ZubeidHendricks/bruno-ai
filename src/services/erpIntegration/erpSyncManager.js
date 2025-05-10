/**
 * ERP Synchronization Manager
 * Manages the synchronization of data between Bruno AI and ERP systems
 */

const { createLogger } = require('../../utils/logger');
const { getDatabase } = require('../../utils/database');

/**
 * ERP Synchronization Manager
 */
class ERPSyncManager {
  /**
   * Initialize the ERP Sync Manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      syncInterval: 3600000, // 1 hour
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
      ...options
    };
    
    this.logger = createLogger('erpSyncManager');
    this.syncIntervalId = null;
    this.db = getDatabase();
    this.syncQueue = [];
    this.inProgress = false;
  }
  
  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    if (this.syncIntervalId) {
      this.stopAutoSync();
    }
    
    this.logger.info('Starting automatic ERP synchronization');
    this.syncIntervalId = setInterval(() => {
      this.processSyncQueue();
    }, this.options.syncInterval);
    
    // Initial sync
    this.processSyncQueue();
  }
  
  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      this.logger.info('Stopping automatic ERP synchronization');
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
  
  /**
   * Process the synchronization queue
   */
  async processSyncQueue() {
    if (this.inProgress || this.syncQueue.length === 0) {
      return;
    }
    
    this.inProgress = true;
    
    try {
      const syncItem = this.syncQueue.shift();
      
      this.logger.info(`Processing sync: ${syncItem.system}/${syncItem.entity} (${syncItem.direction})`);
      
      // Process based on sync type and direction
      // This is a placeholder for actual implementation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.logger.info(`Completed sync: ${syncItem.system}/${syncItem.entity}`);
    } catch (error) {
      this.logger.error('Error processing sync queue:', error);
    } finally {
      this.inProgress = false;
      
      // Process next item if available
      if (this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }
  }
  
  /**
   * Add a synchronization task to the queue
   * @param {Object} syncItem - Synchronization item
   */
  addToSyncQueue(syncItem) {
    this.syncQueue.push({
      ...syncItem,
      timestamp: new Date().toISOString(),
      attempts: 0
    });
    
    if (!this.inProgress) {
      this.processSyncQueue();
    }
  }
  
  /**
   * Record a synchronization event
   * @param {string} system - ERP system type
   * @param {string} entity - Entity type
   * @param {string} direction - Direction ('import' or 'export')
   * @param {number} count - Number of records processed
   * @returns {Object} - Sync record
   */
  async recordSync(system, entity, direction, count) {
    try {
      const syncRecord = {
        system,
        entity,
        direction,
        count,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      // Store in database
      await this.db.collection('erpSyncHistory').insertOne(syncRecord);
      
      this.logger.info(`Recorded ${direction} sync for ${system}/${entity}: ${count} records`);
      
      return syncRecord;
    } catch (error) {
      this.logger.error(`Error recording sync for ${system}/${entity}:`, error);
      throw error;
    }
  }
  
  /**
   * Get synchronization history
   * @param {string} system - ERP system type (optional)
   * @param {string} entity - Entity type (optional)
   * @returns {Array} - Synchronization history
   */
  async getSyncHistory(system, entity) {
    try {
      const query = {};
      
      if (system) {
        query.system = system;
      }
      
      if (entity) {
        query.entity = entity;
      }
      
      const history = await this.db.collection('erpSyncHistory')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      
      return history;
    } catch (error) {
      this.logger.error('Error retrieving sync history:', error);
      throw error;
    }
  }
  
  /**
   * Get synchronization statistics
   * @param {string} system - ERP system type (optional)
   * @returns {Object} - Synchronization statistics
   */
  async getSyncStats(system) {
    try {
      const match = system ? { system } : {};
      
      const stats = await this.db.collection('erpSyncHistory').aggregate([
        { $match: match },
        { $group: {
          _id: {
            system: '$system',
            entity: '$entity',
            direction: '$direction'
          },
          count: { $sum: 1 },
          records: { $sum: '$count' },
          lastSync: { $max: '$timestamp' }
        }},
        { $sort: { '_id.system': 1, '_id.entity': 1 } }
      ]).toArray();
      
      return stats;
    } catch (error) {
      this.logger.error('Error retrieving sync statistics:', error);
      throw error;
    }
  }
  
  /**
   * Schedule a data synchronization
   * @param {string} system - ERP system type
   * @param {string} entity - Entity type
   * @param {string} direction - Direction ('import' or 'export')
   * @param {function} syncFunction - Function to execute for sync
   */
  scheduleSync(system, entity, direction, syncFunction) {
    this.addToSyncQueue({
      system,
      entity,
      direction,
      syncFunction
    });
    
    this.logger.info(`Scheduled ${direction} sync for ${system}/${entity}`);
  }
}

module.exports = {
  ERPSyncManager
};
