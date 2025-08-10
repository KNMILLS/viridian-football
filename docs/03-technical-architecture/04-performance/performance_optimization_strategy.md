# Performance Optimization Strategy

The Viridian Football engine simulates complex on‑field and off‑field interactions.  To deliver smooth experiences on both web and desktop platforms, this document defines performance requirements and optimisation strategies.

## Performance Goals

- **Simulation throughput:** The engine should simulate a full 18‑week season (including off‑season transactions) in under 60 seconds on a mid‑range PC (e.g. Intel i5, 8 GB RAM).  While depth takes precedence, optimisation ensures reasonable iteration times for testers and players.
- **Frame rate:** The UI should render dashboards and simple play visualisations at a minimum of 30 frames per second on typical laptops and desktops.  Smoothness helps players digest large quantities of data without fatigue.
- **Memory footprint:** The WebAssembly module should remain under 10 MB compiled size and under 500 MB of runtime memory usage for a full league, preventing slow downloads and memory exhaustion on browsers.

## Optimisation Strategies

1. **Profiling early and often:** Use Java profilers (e.g., JMH, VisualVM) to identify hotspots in the simulation loop.  Focus optimisation on sections with the highest call counts (e.g., tackling logic, relationship updates).
2. **Data structure design:** Use primitive arrays and efficient collections for performance‑critical loops.  For example, store player attributes in contiguous arrays to leverage CPU cache, reducing memory access overhead.
3. **Parallelisation:** Offload independent computations (e.g., simulating games in different weeks, running scouting evaluations) to separate threads using Java’s Fork/Join framework.  Ensure that shared data structures are thread‑safe or immutable.
4. **WebAssembly tuning:** When compiling to WebAssembly, enable aggressive optimisation flags (`-O3`) and remove unused code via dead‑code elimination.  Avoid dynamic memory allocations within tight loops; preallocate buffers where possible.
5. **Lazy evaluation:** Only compute expensive metrics (e.g., advanced analytics like Expected Points Added) when needed for display or decision logic.  Cache results and invalidate them when inputs change.
6. **Incremental updates:** During simulation, update only the data affected by a play rather than recalculating entire league state.  For example, updating team standings after each game instead of recomputing all standings.
7. **Asynchronous UI rendering:** In the React client, use virtualised lists for large tables and batch DOM updates.  Employ web workers to offload heavy calculations from the main thread.
8. **Database indexing:** For persistent storage, index fields frequently used in queries (e.g., player names, contract expiration dates) to speed up lookups.

## Benchmarks and Testing

Establish benchmark suites with representative scenarios: average game simulations, worst‑case trade deadline days and draft days with many trades.  Run these benchmarks on target hardware and track metrics over time.  Integrate performance regression tests into CI; if performance drops beyond a threshold (e.g., 10% increase in simulation time), block merges until optimisations are applied.

## Future Enhancements

- Investigate just‑in‑time compilation of Java bytecode to WebAssembly to reduce cross‑compilation time.
- Explore GPU acceleration for massive simulations (e.g., tens of thousands of seasons) if required for analytics.
- Profile UI rendering with tools like Chrome DevTools to optimise React component hierarchies.
