package com.viridianfootball.engine.core;

/**
 * Custom exception class for USE Engine specific errors
 */
public class EngineException extends Exception {
    
    public EngineException(String message) {
        super(message);
    }
    
    public EngineException(String message, Throwable cause) {
        super(message, cause);
    }
}