
  // Example effects
  export class SleepEffect extends Effect {
    constructor(source) {
      super('SLEEP', 1, source);
    }
  
    process(event, target, gameState) {
      const result = new EffectResult();
      if (event === EffectEvent.CHECK_CAN_ATTACK) {
        result.canAttack = false;
        result.reason = "Asleep";
      }
      return result;
    }
  }
  
  export class SleepImmunityEffect extends Effect {
    constructor(source) {
      super('SLEEP_IMMUNITY', Infinity, source);
    }
  
    process(event, target, gameState, eventData) {
      const result = new EffectResult();
      if (event === EffectEvent.CHECK_IMMUNITY) {
        const effectToCheck = eventData.effectBeingApplied;
        if (effectToCheck.name === 'SLEEP') {
          result.immunity = true;
          result.reason = "Immune to Sleep";
        }
      }
      return result;
    }
  }
  
  export class SerperiorWildBloom extends Effect {
    constructor(source) {
      super('WILD_BLOOM', Infinity, source);
    }
  
    process(event, target, gameState) {
      const result = new EffectResult();
      if (event === EffectEvent.ENERGY_CALCULATION && target.name === "Serperior") {
        result.availableEnergy = new Map(target.attachedEnergy);
        result.availableEnergy.set(
          Type.GRASS, 
          (result.availableEnergy.get(Type.GRASS) || 0) * 2
        );
      }
      return result;
    }
  }
  
  // Example status immunity effect that checks against multiple statuses
  export class StatusImmunityEffect extends Effect {
    constructor(source) {
      super('STATUS_IMMUNITY', Infinity, source);
    }
  
    process(event, target, gameState, eventData) {
      const result = new EffectResult();
      if (event === EffectEvent.CHECK_IMMUNITY) {
        const effectToCheck = eventData.effectBeingApplied;
        if (is_status_effect(effectToCheck.name)) {
          result.immunity = true;
          result.reason = "Immune to status conditions";
        }
      }
      return result;
    }
  }  