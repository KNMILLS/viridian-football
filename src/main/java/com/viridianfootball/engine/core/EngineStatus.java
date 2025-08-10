package com.viridianfootball.engine.core;

/**
 * Enum representing the various states of the USE Engine
 */
public enum EngineStatus {
    /**
     * Engine has been created but not yet started
     */
    INITIALIZED,
    
    /**
     * Engine is actively running simulations
     */
    RUNNING,
    
    /**
     * Engine has been paused and can be resumed
     */
    PAUSED,
    
    /**
     * Engine has been stopped and must be restarted to continue
     */
    STOPPED,
    
    /**
     * Engine has encountered an error and is in an invalid state
     */
    ERROR
}