    // handleResize(gameSize) {
    //     // Recalculate container size
    //     const { width: targetWidth, height: targetHeight } = this.config.aspectRatio;
    //     const scale = this.config.containerScale;
        
    //     let containerWidth, containerHeight;
    //     const windowRatio = gameSize.width / gameSize.height;
    //     const targetRatio = targetWidth / targetHeight;
        
    //     if (windowRatio > targetRatio) {
    //         containerHeight = gameSize.height * scale;
    //         containerWidth = containerHeight * targetRatio;
    //     } else {
    //         containerWidth = gameSize.width * scale;
    //         containerHeight = containerWidth / targetRatio;
    //     }

    //     this.gameContainer.setSize(containerWidth, containerHeight);
    //     this.gameContainer.x = gameSize.width / 2;
    //     this.gameContainer.y = gameSize.height / 2;
        
    //     // Update background scale
    //     if (this.sprites.background) {
    //         const scaleX = containerWidth / this.sprites.background.width;
    //         const scaleY = containerHeight / this.sprites.background.height;
    //         const scale = Math.max(scaleX, scaleY);
    //         this.sprites.background.setScale(scale);
    //     }
        
    //     if (this.sprites.pack?.visible) {
    //         this.scaleSprite(this.sprites.pack, this.config.sprites.pack.heightScale);
    //     }
    //     if (this.sprites.card?.visible) {
    //         this.scaleSprite(this.sprites.card, this.config.sprites.card.heightScale);
    //     }
    // }