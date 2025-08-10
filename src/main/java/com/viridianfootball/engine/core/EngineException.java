package com.viridianfootball.engine.core;

/**
 * Custom exception for USE Engine errors
 * 
 * This exception is thrown when the engine encounters
 * unrecoverable errors during operation.
 */
public class EngineException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Creates a new engine exception with a message
     * 
     * @param message Error message
     */
    public EngineException(String message) {
        super(message);
    }
    
    /**
     * Creates a new engine exception with a message and cause
     * 
     * @param message Error message
     * @param cause Root cause of the exception
     */
    public EngineException(String message, Throwable cause) {
        super(message, cause);
    }
    
    /**
     * Creates a new engine exception with a cause
     * 
     * @param cause Root cause of the exception
     */
    public EngineException(Throwable cause) {
        super(cause);
    }
}
