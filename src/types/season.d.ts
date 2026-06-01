declare global {
  /**
   * Season 10 global find constant.
   */
  const FIND_SCORES: 10015; // Screeps uses arbitrary unique numbers for constants internally

  /**
   * A score object that appears randomly in rooms during Season 10.
   * Move a creep onto the same tile to automatically collect it.
   */
  interface Score extends RoomObject {
    /**
     * A unique object identifier. You can use Game.getObjectById to retrieve this instance.
     */
    id: string;

    /**
     * The score value that will be credited to the creep's owner upon collection.
     */
    score: number;

    /**
     * The number of game ticks remaining before this object disappears.
     */
    ticksToDecay: number;
  }

  // --- Extending existing Screeps Interfaces ---

  interface FindTypes {
    /**
     * Registers FIND_SCORES with the room.find() method so it returns the correct type array.
     */
    10015: Score;
  }
  /**
  interface Game {
    // Overload Game.getObjectById so it recognizes and properly types a Score object.
    getObjectById<T extends Id<any> | string>(id: T): T extends Id<infer U> ? U : any;
  }
  */
}
