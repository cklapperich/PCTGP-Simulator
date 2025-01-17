effects return a list of flags when run: can retreat, can attack, is-affected-by-affects, and so forth
this effect can also return a thing containing the correct 'available energy' for a given pokemon - this allows stuff like Serperior to work
then you take the max of those flags - like if any effect says you cant attack then you cant attack
effects need a duration which defaults to 1 turn
duration ticks down by 1 every turn
if you want to know if Pikachu can attack, 1st check the rules - can it attack? and then run the code for EVERY effect

global effects (serperior wild bloom) get processed against EVERY pokemon and trainer all the time. the effect itself has to determine if it applies to the given pokemon
yeah thats a lot of processing. should be fine though, just an if statement.

we might want some way for effect code to know what check is being performed? ie get_available_energy

then to check if a pokemon can retreat, you just run all effects attached to that trainer and that pokemon. 