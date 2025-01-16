import pygame
import json

class GameFrontend:
    def __init__(self):
        pygame.init()
        self.screen_width = 640
        self.screen_height = 480
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        pygame.display.set_caption("Card Game")
        
        # Colors
        self.BLACK = (0, 0, 0)
        self.WHITE = (255, 255, 255)
        self.GREEN = (34, 139, 34)
        
        # Grid-based movement properties
        self.tile_size = 32
        self.player_grid_pos = [10, 7]  # Grid coordinates
        self.player_pixel_pos = [self.player_grid_pos[0] * self.tile_size, 
                               self.player_grid_pos[1] * self.tile_size]
        self.movement_speed = 4  # Pixels per frame
        self.is_moving = False
        self.move_target = None
        self.facing = "down"  # down, up, left, right
        self.last_key_press_time = 0
        self.key_press_delay = 200  # Milliseconds
        
        # Map properties
        self.map_data = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
        
        # NPCs
        self.npcs = [
            {"grid_pos": [9, 4], "type": "trader"}
        ]
        
        # Game state
        self.game_state = "exploring"  # exploring, battle, menu
        
    def handle_input(self):
        if self.game_state != "exploring" or self.is_moving:
            return
            
        current_time = pygame.time.get_ticks()
        if current_time - self.last_key_press_time < self.key_press_delay:
            return
            
        keys = pygame.key.get_pressed()
        new_grid_pos = self.player_grid_pos.copy()
        
        if keys[pygame.K_LEFT]:
            new_grid_pos[0] -= 1
            self.facing = "left"
            self.last_key_press_time = current_time
        elif keys[pygame.K_RIGHT]:
            new_grid_pos[0] += 1
            self.facing = "right"
            self.last_key_press_time = current_time
        elif keys[pygame.K_UP]:
            new_grid_pos[1] -= 1
            self.facing = "up"
            self.last_key_press_time = current_time
        elif keys[pygame.K_DOWN]:
            new_grid_pos[1] += 1
            self.facing = "down"
            self.last_key_press_time = current_time
            
        # Check if new position is valid
        if (0 <= new_grid_pos[0] < len(self.map_data[0]) and 
            0 <= new_grid_pos[1] < len(self.map_data) and 
            self.map_data[new_grid_pos[1]][new_grid_pos[0]] != 1):
            
            self.move_target = [new_grid_pos[0] * self.tile_size,
                              new_grid_pos[1] * self.tile_size]
            self.is_moving = True
            self.player_grid_pos = new_grid_pos
            
        # Check for interaction with NPCs
        if keys[pygame.K_SPACE] and not self.is_moving:
            self.check_npc_interaction()
                
    def update_movement(self):
        if not self.is_moving:
            return
            
        # Move towards target position
        dx = self.move_target[0] - self.player_pixel_pos[0]
        dy = self.move_target[1] - self.player_pixel_pos[1]
        
        if dx > 0:
            self.player_pixel_pos[0] += self.movement_speed
        elif dx < 0:
            self.player_pixel_pos[0] -= self.movement_speed
            
        if dy > 0:
            self.player_pixel_pos[1] += self.movement_speed
        elif dy < 0:
            self.player_pixel_pos[1] -= self.movement_speed
            
        # Check if we've reached the target
        if (abs(dx) < self.movement_speed and 
            abs(dy) < self.movement_speed):
            self.player_pixel_pos = self.move_target.copy()
            self.is_moving = False
                
    def check_npc_interaction(self):
        # Calculate interaction tile based on facing direction
        interact_pos = self.player_grid_pos.copy()
        if self.facing == "left":
            interact_pos[0] -= 1
        elif self.facing == "right":
            interact_pos[0] += 1
        elif self.facing == "up":
            interact_pos[1] -= 1
        elif self.facing == "down":
            interact_pos[1] += 1
            
        # Check for NPCs at interaction position
        for npc in self.npcs:
            if npc["grid_pos"] == interact_pos:
                print("Starting card battle!")
                self.game_state = "battle"
                    
    def draw(self):
        self.screen.fill(self.WHITE)
        
        # Draw map
        for y, row in enumerate(self.map_data):
            for x, tile in enumerate(row):
                if tile == 1:  # Wall
                    pygame.draw.rect(self.screen, self.BLACK,
                                  (x * self.tile_size, y * self.tile_size,
                                   self.tile_size, self.tile_size))
                elif tile == 0:  # Floor
                    pygame.draw.rect(self.screen, self.GREEN,
                                  (x * self.tile_size, y * self.tile_size,
                                   self.tile_size, self.tile_size), 1)
                    
        # Draw NPCs
        for npc in self.npcs:
            pygame.draw.rect(self.screen, (255, 0, 0),
                          (npc["grid_pos"][0] * self.tile_size,
                           npc["grid_pos"][1] * self.tile_size,
                           self.tile_size, self.tile_size))
            
        # Draw player
        pygame.draw.rect(self.screen, (0, 0, 255),
                       (self.player_pixel_pos[0], self.player_pixel_pos[1],
                        self.tile_size, self.tile_size))
        
    def run(self):
        running = True
        clock = pygame.time.Clock()
        
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                    
            self.handle_input()
            self.update_movement()
            self.draw()
            pygame.display.flip()
            clock.tick(60)
            
        pygame.quit()

if __name__ == "__main__":
    game = GameFrontend()
    game.run()