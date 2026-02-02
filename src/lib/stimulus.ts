import { supabase } from "./supabase";

/**
 * A single stimulus in the participant client
 */
export interface StimulusImage {
  /**
   * Unique image id
   */
  id: string;

  /**
   * Image URL on Supabase
   */
  image_url: string;
}

/**
 * A left/right pair of stimuli in the participant client.
 */
export interface StimulusPair {
  /**
   * Unique set id
   */
  set_id: string;

  /**
   * Stimulus to display on left side
   */
  left: StimulusImage;

  /**
   * Stimulus to display on right side
   */
  right: StimulusImage;

  /**
   * Number of new sets left in Supabase
   */
  sets_remaining: number;
}

/**
 * Fetches a random pair of honest/deceptive images that the user has not seen yet.
 * @param sessionId - unique id of current participant (prevents fetching already-seen pairs)
 * @returns the next StimulusPair if available, or null if there are none
 */
export const fetchNextPair = async (
  sessionId: string,
): Promise<StimulusPair | null> => {
  const { data, error } = await supabase.rpc("get_random_unseen_pair", {
    p_session_id: sessionId,
  });

  if (error) {
    console.error("Error fetching stimulus pair:", error);
    return null;
  }

  // The RPC returns { sets_remaining: 0 } when finished
  if (data.sets_remaining === 0) {
    return null;
  }

  return data as StimulusPair;
};

/**
 * Submits participant choice to Supabase
 * @param sessionId - unique participant id
 * @param stimulus - the image pair shown the the participant
 * @param selectedSide - which side the participant chose as "deceptive"
 */
export const submitResponse = async (
  sessionId: string,
  stimulus: StimulusPair,
  selectedSide: "left" | "right",
) => {
  const { error } = await supabase.from("responses").insert({
    session_id: sessionId,
    set_id: stimulus.set_id,
    selected_stimulus:
      selectedSide === "right" ? stimulus.right.id : stimulus.left.id,
    left_stimulus: stimulus.left.id,
    right_stimulus: stimulus.right.id,
  });

  if (error) {
    console.error("Error submitting response:", error);
    throw error;
  }
};
