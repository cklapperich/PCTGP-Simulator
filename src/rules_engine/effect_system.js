// Types of events effects can respond to
export const EffectEvent = {
    DAMAGE_CALCULATION: 'DAMAGE_CALCULATION',
    CHECK_CAN_RETREAT: 'CHECK_CAN_RETREAT',
    CHECK_CAN_ATTACK: 'CHECK_CAN_ATTACK',
    ENERGY_CALCULATION: 'ENERGY_CALCULATION',
    BETWEEN_TURNS: 'BETWEEN_TURNS',
    CHECK_IMMUNITY: 'CHECK_IMMUNITY',
  };
  
  // Helper functions for checking effect types
  export const is_status_effect = (name) => {
    return ['SLEEP', 'POISON', 'PARALYZE', 'CONFUSE'].includes(name);
  };
  
  export const is_poison = (name) => {
    return ['POISON', 'DEADLY_POISON', 'TOXIC'].includes(name);
  };
  
  export class EffectResult {
    constructor() {
      this.damage = null;  // Modified damage amount
      this.canAttack = null;  // Can the Pokémon attack?
      this.canRetreat = null;  // Can the Pokémon retreat?
      this.availableEnergy = null;  // Map of Type -> number for available energy
      this.reason = null;  // Reason for prevention (e.g., "Can't retreat due to Sleep")
      this.immunity = null; // Whether target is immune to an effect being checked
    }
  }
  
  export class Effect {
    constructor(name, duration = 1, source = null) {
      this.name = name;
      this.duration = duration;
      this.source = source;  // Card or Player that created this effect
    }
  
    process(event, target, gameState, eventData = {}) {
      if (event === EffectEvent.TEARDOWN) {
        this.tearDown(target, gameState);
        return new EffectResult();
      }
      return new EffectResult();
    }
  
    tearDown(target, gameState) {
      // Override to clean up effect
    }
  
    tick() {
      this.duration--;
    }
  
    isExpired() {
      return this.duration <= 0;
    }
  }
  
  export class EffectRegistry {
    constructor() {
      this.effectClassRegistry = new Map(); // name -> effect class mapping
    }
  
    registerEffect(name, effectClass) {
      this.effectClassRegistry.set(name, effectClass);
    }
  
    createEffect(name, source) {
      const EffectClass = this.effectClassRegistry.get(name);
      if (!EffectClass) {
        throw new Error(`Unknown effect: ${name}`);
      }
      return new EffectClass(name, source);
    }
  
    // Check if an effect can be applied to a target
    canApplyEffect(effect, target, gameState) {
      const results = this.processEvent(
        EffectEvent.CHECK_IMMUNITY, 
        target, 
        gameState, 
        { effectBeingApplied: effect }
      );
      
      // If any effect returns immunity: true, prevent application
      return !results.some(r => r.immunity === true);
    }
  
    // Core event processing
    processEvent(event, target, gameState, eventData = {}) {
      const results = [];
      
      if (target instanceof Card) {
        target.effects?.forEach(effect =>
          results.push(effect.process(event, target, gameState, eventData))
        );
        target.owner?.effects?.forEach(effect =>
          results.push(effect.process(event, target, gameState, eventData))
        );
      }
      gameState.globalEffects?.forEach(effect =>
        results.push(effect.process(event, target, gameState, eventData))
      );
  
      return this.combineResults(event, results);
    }
  
    // Helper methods for common checks
    checkCanAttack(pokemon, gameState) {
      const result = this.processEvent(EffectEvent.CHECK_CAN_ATTACK, pokemon, gameState);
      return {
        canAttack: result.canAttack !== false,
        reason: result.reason
      };
    }
  
    checkCanRetreat(pokemon, gameState) {
      const result = this.processEvent(EffectEvent.CHECK_CAN_RETREAT, pokemon, gameState);
      return {
        canRetreat: result.canRetreat !== false,
        reason: result.reason
      };
    }
  
    calculateAvailableEnergy(pokemon, gameState) {
      const result = this.processEvent(EffectEvent.ENERGY_CALCULATION, pokemon, gameState);
      return result.availableEnergy || pokemon.attachedEnergy;
    }
  
    // Result combining logic split out for clarity
    combineResults(event, results) {
      const finalResult = new EffectResult();
      
      switch(event) {
        case EffectEvent.CHECK_CAN_ATTACK:
        case EffectEvent.CHECK_CAN_RETREAT:
          if (results.some(r => r[event] === false)) {
            finalResult[event] = false;
            const lastReason = results.findLast(r => r.reason)?.reason;
            if (lastReason) finalResult.reason = lastReason;
          }
          break;
  
        case EffectEvent.CHECK_IMMUNITY:
          // If any effect grants immunity, the final result is immune
          if (results.some(r => r.immunity === true)) {
            finalResult.immunity = true;
            const lastReason = results.findLast(r => r.reason)?.reason;
            if (lastReason) finalResult.reason = lastReason;
          }
          break;
  
        case EffectEvent.ENERGY_CALCULATION:
          // Take the last non-null energy calculation
          const lastEnergy = results.findLast(r => r.availableEnergy)?.availableEnergy;
          if (lastEnergy) finalResult.availableEnergy = lastEnergy;
          break;
  
        case EffectEvent.DAMAGE_CALCULATION:
          // Take the last non-null damage modification
          const lastDamage = results.findLast(r => r.damage !== null)?.damage;
          if (lastDamage !== null) finalResult.damage = lastDamage;
          break;
      }
      
      return finalResult;
    }
  }
  