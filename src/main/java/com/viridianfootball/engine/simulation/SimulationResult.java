package com.viridianfootball.engine.simulation;

/**
 * Result of a simulation step
 * 
 * Indicates the outcome and status of a simulation step execution.
 */
public enum SimulationResult {
    
    /**
     * Simulation step completed successfully
     */
    SUCCESS,
    
    /**
     * Simulation step completed with warnings
     */
    WARNING,
    
    /**
     * Simulation step failed
     */
    ERROR,
    
    /**
     * Simulation is paused
     */
    PAUSED,
    
    /**
     * Simulation step was skipped due to performance constraints
     */
    SKIPPED,
    
    /**
     * Simulation step completed but with reduced accuracy
     */
    DEGRADED,
    
    /**
     * Simulation step completed with timeout
     */
    TIMEOUT;
    
    /**
     * Checks if the result indicates success
     * 
     * @return true if successful, false otherwise
     */
    public boolean isSuccess() {
        return this == SUCCESS || this == WARNING || this == DEGRADED;
    }
    
    /**
     * Checks if the result indicates failure
     * 
     * @return true if failed, false otherwise
     */
    public boolean isFailure() {
        return this == ERROR || this == TIMEOUT;
    }
    
    /**
     * Checks if the result indicates the simulation should continue
     * 
     * @return true if should continue, false otherwise
     */
    public boolean shouldContinue() {
        return this != ERROR && this != TIMEOUT;
    }
}
