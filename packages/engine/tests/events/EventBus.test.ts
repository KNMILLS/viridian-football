import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import { teamId, playerId } from '../../src/types/ids.js';

describe('EventBus', () => {
  it('delivers events to subscribers', () => {
    const bus = new EventBus<GameEventMap>();
    const handler = vi.fn();
    bus.on('INJURY_OCCURRED', handler);

    const payload = {
      playerId: playerId('p1'),
      teamId: teamId('t1'),
      type: 'ACL Tear',
      severity: 'season_ending' as const,
      weeksOut: 52,
    };
    bus.emit('INJURY_OCCURRED', payload);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('does not deliver events to unsubscribed handlers', () => {
    const bus = new EventBus<GameEventMap>();
    const handler = vi.fn();
    const unsub = bus.on('GAME_RESULT', handler);
    unsub();

    bus.emit('GAME_RESULT', {
      week: { season: 1, week: 1, phase: 'regular' },
      homeTeamId: teamId('t1'),
      awayTeamId: teamId('t2'),
      homeScore: 24,
      awayScore: 17,
      seed: 42,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple handlers for the same event', () => {
    const bus = new EventBus<GameEventMap>();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('TRADE_ACCEPTED', h1);
    bus.on('TRADE_ACCEPTED', h2);

    bus.emit('TRADE_ACCEPTED', {
      teams: [teamId('t1'), teamId('t2')],
      assets: [],
    });

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('once() fires handler only once', () => {
    const bus = new EventBus<GameEventMap>();
    const handler = vi.fn();
    bus.once('COACH_FIRED', handler);

    const payload = {
      coachId: 'c1' as any,
      teamId: teamId('t1'),
      role: 'HC',
      reason: 'poor record',
    };

    bus.emit('COACH_FIRED', payload);
    bus.emit('COACH_FIRED', payload);

    expect(handler).toHaveBeenCalledOnce();
  });

  it('logs events when logging is enabled', () => {
    const bus = new EventBus<GameEventMap>();
    bus.setLogging(true);

    bus.emit('NEWS_STORY', {
      headline: 'Test',
      body: 'Test body',
      category: 'general',
      relatedTeamIds: [],
      relatedPlayerIds: [],
      importance: 'minor',
    });

    const log = bus.getLog();
    expect(log).toHaveLength(1);
    expect(log[0]!.event).toBe('NEWS_STORY');
  });

  it('does not log events when logging is disabled', () => {
    const bus = new EventBus<GameEventMap>();
    bus.emit('NEWS_STORY', {
      headline: 'Test',
      body: 'Test body',
      category: 'general',
      relatedTeamIds: [],
      relatedPlayerIds: [],
      importance: 'minor',
    });

    expect(bus.getLog()).toHaveLength(0);
  });

  it('clear() removes all listeners', () => {
    const bus = new EventBus<GameEventMap>();
    const handler = vi.fn();
    bus.on('GAME_RESULT', handler);
    bus.clear();

    bus.emit('GAME_RESULT', {
      week: { season: 1, week: 1, phase: 'regular' },
      homeTeamId: teamId('t1'),
      awayTeamId: teamId('t2'),
      homeScore: 10,
      awayScore: 7,
      seed: 1,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('listenerCount returns correct count', () => {
    const bus = new EventBus<GameEventMap>();
    expect(bus.listenerCount('GAME_RESULT')).toBe(0);

    const unsub1 = bus.on('GAME_RESULT', () => {});
    const unsub2 = bus.on('GAME_RESULT', () => {});
    expect(bus.listenerCount('GAME_RESULT')).toBe(2);

    unsub1();
    expect(bus.listenerCount('GAME_RESULT')).toBe(1);

    unsub2();
    expect(bus.listenerCount('GAME_RESULT')).toBe(0);
  });
});
