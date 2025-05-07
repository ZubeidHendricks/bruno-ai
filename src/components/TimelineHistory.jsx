import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Database,
  Eye,
  FileText,
  Filter,
  BarChart2,
  RefreshCw,
  Search,
  Zap,
  MessageSquare,
  Upload,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  X,
  Info,
  TrendingUp,
  Layers,
  RotateCcw,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';

const TimelineHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statistics, setStatistics] = useState(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [revertingToEvent, setRevertingToEvent] = useState(null);
  const [revertLoading, setRevertLoading] = useState(false);
  const [revertSuccess, setRevertSuccess] = useState(null);
  const [revertError, setRevertError] = useState(null);
  const navigate = useNavigate();

  // Step icon mapping
  const stepIcons = {
    1: Upload,
    2: MessageSquare,
    3: RefreshCw,
    4: CheckCircle,
    5: Database,
    6: Search,
    7: Zap,
    8: BarChart2
  };

  // Step color mapping
  const stepColors = {
    1: 'blue',
    2: 'indigo',
    3: 'purple',
    4: 'green',
    5: 'teal',
    6: 'orange',
    7: 'amber',
    8: 'red'
  };

  // Status icons
  const statusIcons = {
    completed: CheckCircle,
    in_progress: Clock,
    failed: AlertCircle,
    pending: Clock,
    undone: X
  };

  // Status colors
  const statusColors = {
    completed: 'green',
    in_progress: 'blue',
    failed: 'red',
    pending: 'gray',
    undone: 'gray'
  };

  useEffect(() => {
    // Fetch timeline sessions on component mount
    fetchTimelineSessions();
    // Fetch timeline statistics
    fetchTimelineStatistics();
  }, []);

  useEffect(() => {
    // Fetch session events when a session is selected
    if (selectedSession) {
      fetchSessionEvents(selectedSession);
    }
  }, [selectedSession]);

  const fetchTimelineSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/timeline/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSessions(response.data.data);
      } else {
        setError('Failed to fetch timeline sessions');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching timeline sessions');
      console.error('Error fetching timeline sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionEvents = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/timeline/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSessionEvents(response.data.data);
      } else {
        setError('Failed to fetch session events');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching session events');
      console.error('Error fetching session events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineStatistics = async () => {
    try {
      setLoadingStatistics(true);

      const response = await axios.get('/api/timeline/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching timeline statistics:', err);
      // Not showing error state for statistics as it's not critical
    } finally {
      setLoadingStatistics(false);
    }
  };

  const selectSession = (sessionId) => {
    if (selectedSession === sessionId) {
      setSelectedSession(null);
      setSessionEvents([]);
    } else {
      setSelectedSession(sessionId);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '0s';
    
    const ms = parseInt(duration, 10);
    
    if (isNaN(ms)) return 'Invalid duration';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${seconds % 60}s`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    } else {
      return `${ms}ms`;
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  // Handle revert to a specific timeline event
  const initiateRevert = (event) => {
    setRevertingToEvent(event);
    setRevertSuccess(null);
    setRevertError(null);
  };

  const cancelRevert = () => {
    setRevertingToEvent(null);
    setRevertSuccess(null);
    setRevertError(null);
  };

  const confirmRevert = async () => {
    try {
      setRevertLoading(true);
      setRevertError(null);
      setRevertSuccess(null);

      const response = await axios.post('/api/timeline/revert', {
        sessionId: selectedSession,
        eventId: revertingToEvent.id
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setRevertSuccess(response.data.message);
        
        // Refresh the timeline events to show the updated state
        await fetchSessionEvents(selectedSession);
        
        // Automatically close the revert dialog after a delay
        setTimeout(() => {
          setRevertingToEvent(null);
          setRevertSuccess(null);
        }, 3000);
      } else {
        setRevertError('Failed to revert to the selected point');
      }
    } catch (err) {
      setRevertError(err.response?.data?.message || 'Error reverting to the selected point');
      console.error('Error reverting to timeline event:', err);
    } finally {
      setRevertLoading(false);
    }
  };

  // Determine if an event can be reverted to
  const canRevertTo = (event) => {
    // Only allow reverting to completed steps
    return event.status === 'completed';
  };

  // Apply filters to sessions
  const filteredSessions = sessions.filter(session => {
    if (!showFilter) return true;
    
    const sessionDate = new Date(session.startTime);
    
    // Filter by date range
    if (dateRange.from && new Date(dateRange.from) > sessionDate) {
      return false;
    }
    
    if (dateRange.to && new Date(dateRange.to) < sessionDate) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Timeline History</h1>
              <p className="text-gray-600">View and analyze your data processing history</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button 
                onClick={fetchTimelineSessions}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilter && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700">Filter Timeline</h3>
                <button 
                  onClick={() => setShowFilter(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistics Panel */}
        {statistics && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Processing Statistics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Layers className="w-4 h-4 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-700">Total Sessions</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800">{statistics.totalSessions}</p>
                <p className="text-gray-600 text-sm mt-1">Total data processing sessions</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-green-600 mr-2" />
                  <h3 className="font-medium text-gray-700">Average Processing Time</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800">{formatDuration(statistics.avgSessionDuration)}</p>
                <p className="text-gray-600 text-sm mt-1">End-to-end processing time</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 mr-2" />
                  <h3 className="font-medium text-gray-700">Success Rate</h3>
                </div>
                {statistics.stepSuccessRates && statistics.stepSuccessRates.length > 0 && (
                  <>
                    <p className="text-3xl font-bold text-gray-800">
                      {Math.round(
                        statistics.stepSuccessRates.reduce((acc, step) => acc + step.successRate, 0) / 
                        statistics.stepSuccessRates.length
                      )}%
                    </p>
                    <p className="text-gray-600 text-sm mt-1">Average across all processing steps</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Average Duration By Step */}
            {statistics.stepDurations && statistics.stepDurations.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-3">Average Duration by Processing Step</h3>
                <div className="overflow-hidden bg-gray-50 rounded-lg">
                  {statistics.stepDurations.map((step) => {
                    const IconComponent = stepIcons[step.step] || Info;
                    const color = stepColors[step.step] || 'gray';
                    const avgDuration = parseInt(step.avgDuration, 10);
                    const maxDuration = Math.max(...statistics.stepDurations.map(s => parseInt(s.avgDuration, 10)));
                    const percentage = Math.max(5, Math.round((avgDuration / maxDuration) * 100));
                    
                    return (
                      <div key={step.step} className="flex items-center p-3 border-b border-gray-100 last:border-0">
                        <div className={`w-8 h-8 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center mr-3 flex-shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">{step.title}</span>
                            <span className="text-sm text-gray-600">{formatDuration(step.avgDuration)}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full bg-${color}-500 rounded-full`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Revert Confirmation Modal */}
        {revertingToEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800">Revert to Previous State</h3>
                {revertSuccess && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                    <CheckCircle className="w-5 h-5 inline-block mr-2" />
                    {revertSuccess}
                  </div>
                )}
                {revertError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                    <AlertCircle className="w-5 h-5 inline-block mr-2" />
                    {revertError}
                  </div>
                )}
                {!revertSuccess && !revertError && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-amber-800 font-medium">Are you sure?</p>
                        <p className="text-amber-700 text-sm mt-1">
                          You are about to revert your data to the state it was in after the 
                          <strong> {revertingToEvent.title}</strong> step. All processing steps after this point will be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelRevert}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={revertLoading}
                >
                  Cancel
                </button>
                {!revertSuccess && (
                  <button
                    onClick={confirmRevert}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    disabled={revertLoading}
                  >
                    {revertLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Revert
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Timeline Sessions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Processing Sessions</h2>
          </div>
          
          {loading && sessions.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading sessions...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 text-red-700">
              <p className="font-medium">Error loading sessions</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-medium text-xl mb-2">No processing sessions found</h3>
              <p>
                {showFilter 
                  ? 'Try adjusting your filters or uploading new financial data to get started' 
                  : 'Upload financial data to get started with data processing'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <div key={session.sessionId} className="hover:bg-gray-50">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => selectSession(session.sessionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{session.datasetName}</h3>
                          <p className="text-sm text-gray-600">{formatDateTime(session.startTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex flex-col items-end mr-6">
                          <span className="text-sm font-medium text-gray-700">
                            {formatDuration(session.totalDuration)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {session.eventCount} steps
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${session.completionRate}%` }}
                            ></div>
                          </div>
                          <ChevronRight 
                            className={`w-5 h-5 text-gray-400 transition-transform ${selectedSession === session.sessionId ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Session Timeline */}
                  {selectedSession === session.sessionId && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      {sessionEvents.length === 0 ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading timeline...</span>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Vertical timeline line */}
                          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                          
                          {/* Timeline events */}
                          <div className="space-y-4">
                            {sessionEvents.map((event) => {
                              const IconComponent = stepIcons[event.step] || Info;
                              const StatusIcon = statusIcons[event.status] || AlertCircle;
                              const color = stepColors[event.step] || 'gray';
                              const statusColor = statusColors[event.status] || 'gray';
                              
                              return (
                                <div key={event.id} className="relative flex">
                                  {/* Icon */}
                                  <div className="flex-shrink-0 z-10">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-${color}-100 text-${color}-600 border-2 border-white`}>
                                      <IconComponent className="w-6 h-6" />
                                    </div>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="ml-4 flex-1">
                                    <div className={`bg-white p-3 rounded-lg border border-${statusColor}-100 shadow-sm ${event.status === 'undone' ? 'opacity-60' : ''}`}>
                                      <div className="flex justify-between items-center">
                                        <h4 className="font-medium text-gray-800">{event.title}</h4>
                                        <div className="flex items-center">
                                          <span className="text-sm text-gray-500 mr-2">
                                            {formatDateTime(event.startTime)}
                                          </span>
                                          <span className={`p-1 rounded-full bg-${statusColor}-100 text-${statusColor}-600`}>
                                            <StatusIcon size={16} />
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-gray-600 mt-1 text-sm">{event.description}</p>
                                      
                                      <div className="mt-2 flex justify-between items-center">
                                        <div className="text-sm text-gray-500">
                                          Duration: {formatDuration(event.duration)}
                                        </div>
                                        
                                        <div className="flex space-x-3">
                                          {event.details && (
                                            <button 
                                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                              onClick={() => {
                                                // Toggle details visibility
                                                // Implementation would go here
                                              }}
                                            >
                                              Details
                                              <ChevronDown className="w-4 h-4 ml-1" />
                                            </button>
                                          )}
                                          
                                          {canRevertTo(event) && event.status !== 'undone' && (
                                            <button 
                                              className="text-sm text-amber-600 hover:text-amber-800 flex items-center"
                                              onClick={() => initiateRevert(event)}
                                            >
                                              Revert to this point
                                              <RotateCcw className="w-4 h-4 ml-1" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Event is the result of a reversion */}
                                      {event.metadata && event.metadata.isReversion && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <div className="bg-blue-50 rounded p-2 text-sm text-blue-700 flex items-center">
                                            <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span>
                                              This is a reversion point. The data was reverted to the state after the 
                                              <span className="font-medium"> {event.details.revertedToTitle}</span> step.
                                              {event.details.undoneEvents > 0 && 
                                                ` ${event.details.undoneEvents} later events were undone.`
                                              }
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineHistory;