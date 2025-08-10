package com.viridianfootball.engine.core;

import com.viridianfootball.engine.performance.PerformanceMetrics;
import java.util.List;

/**
 * Status information for the USE Engine
 * 
 * Contains current state information including running status,
 * performance metrics, and active entities.
 */
public class EngineStatus {
    
    private final boolean isRunning;
    private final boolean isPaused;
    private final PerformanceMetrics performanceMetrics;
    private final double currentTime;
    private final List<String> activeEntities;
    
    /**
     * Creates a new engine status
     * 
     * @param isRunning Whether the engine is running
     * @param isPaused Whether the engine is paused
     * @param performanceMetrics Current performance metrics
     * @param currentTime Current simulation time
     * @param activeEntities List of active entity IDs
     */
    public EngineStatus(boolean isRunning, boolean isPaused, 
                       PerformanceMetrics performanceMetrics, 
                       double currentTime, List<String> activeEntities) {
        this.isRunning = isRunning;
        this.isPaused = isPaused;
        this.performanceMetrics = performanceMetrics;
        this.currentTime = currentTime;
        this.activeEntities = activeEntities;
    }
    
    /**
     * Checks if the engine is running
     * 
     * @return true if running, false otherwise
     */
    public boolean isRunning() {
        return isRunning;
    }
    
    /**
     * Checks if the engine is paused
     * 
     * @return true if paused, false otherwise
     */
    public boolean isPaused() {
        return isPaused;
    }
    
    /**
     * Gets the current performance metrics
     * 
     * @return Performance metrics
     */
    public PerformanceMetrics getPerformanceMetrics() {
        return performanceMetrics;
    }
    
    /**
     * Gets the current simulation time
     * 
     * @return Current time in seconds
     */
    public double getCurrentTime() {
        return currentTime;
    }
    
    /**
     * Gets the list of active entity IDs
     * 
     * @return List of active entity IDs
     */
    public List<String> getActiveEntities() {
        return activeEntities;
    }
    
    /**
     * Gets the number of active entities
     * 
     * @return Number of active entities
     */
    public int getActiveEntityCount() {
        return activeEntities != null ? activeEntities.size() : 0;
    }
    
    @Override
    public String toString() {
        return "EngineStatus{" +
                "isRunning=" + isRunning +
                ", isPaused=" + isPaused +
                ", currentTime=" + currentTime +
                ", activeEntityCount=" + getActiveEntityCount() +
                ", performanceMetrics=" + performanceMetrics +
                '}';
    }
}
