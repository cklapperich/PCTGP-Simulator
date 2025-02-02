export const UIScenes = {
    PACK_OPEN: 'PackOpenScene',
};

export const UIConfig = {
    [UIScenes.PACK_OPEN]: {
        aspectRatio: {
            width: 10,
            height: 9
        },
        containerScale: 0.9,
        defaultBackground: 'playmat_mew',  // Default for testing, can be overridden
        sprites: {
            pack: {
                heightScale: 0.84  // Pack takes up 84% of container height
            },
            card: {
                heightScale: 0.7   // Card takes up 70% of container height
            }
        }
    }
};
