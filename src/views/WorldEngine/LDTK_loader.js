// LDtk file format type definitions and import wrapper.
export class LDTKLoader {
    constructor() {
        this.world = null;
    }

    async loadWorld(worldData) {
        try {
            this.world = worldData;
            return this.world;
        } catch (error) {
            console.error("Error loading LDTK world:", error);
            throw error;
        }
    }

    getCurrentLevel() {
        if (!this.world) {
            throw new Error("No world loaded. Call loadWorld first.");
        }
        return this.world.levels[0];
    }

    getLevelByName(name) {
        if (!this.world) {
            throw new Error("No world loaded. Call loadWorld first.");
        }
        return this.world.levels.find(level => level.identifier === name);
    }
}

export default LDTKLoader;
