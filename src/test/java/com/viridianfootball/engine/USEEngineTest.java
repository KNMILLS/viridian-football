package com.viridianfootball.engine;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

import com.viridianfootball.engine.core.EngineStatus;
import com.viridianfootball.engine.simulation.SimulationResult;

/**
 * Unit tests for the USEEngine class
 */
public class USEEngineTest {
    
    private USEEngine engine;
    
    @BeforeEach
    public void setUp() {
        engine = new USEEngine();
    }
    
    @Test
    public void testEngineInitialization() {
        assertEquals(EngineStatus.INITIALIZED, engine.getStatus());
        assertNotNull(engine.getConfig());
        assertNotNull(engine.getMetrics());
    }
    
    @Test
    public void testEngineStartStop() {
        // Test starting the engine
        engine.start();
        assertEquals(EngineStatus.RUNNING, engine.getStatus());
        
        // Test stopping the engine
        engine.stop();
        assertEquals(EngineStatus.STOPPED, engine.getStatus());
    }
    
    @Test
    public void testSimulationExecution() {
        // Start the engine
        engine.start();
        
        // Run a simulation
        SimulationResult result = engine.runSimulation();
        assertNotNull(result);
        assertTrue(result.isSuccessful());
    }
    
    @Test
    public void testSimulationWithoutRunningEngine() {
        // Attempt to run simulation without starting engine
        assertThrows(IllegalStateException.class, () -> {
            engine.runSimulation();
        });
    }
}