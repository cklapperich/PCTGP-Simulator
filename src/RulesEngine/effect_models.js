export class Effect {
    constructor(base_damage = 0) {
        this.type = 'basic';  // Default to basic effect
        this.base_damage = base_damage || 0;  // Default to 0 if undefined
    }
}
