import { supabase } from "../utils/supabase.js";

export const addComment = async (req, res) => {
  try {
    const { market_id, user_id, content, parent_id } = req.body;

    if (!market_id || !user_id || !content || content.trim() === "") {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, display_name')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    const { error: commentError } = await supabase
      .from('comments')
      .insert([{ 
        market_id, 
        user_id, 
        content,
        parent_id: parent_id || null
      }]);

    if (commentError) throw commentError;

    return res.json({ success: true, message: "Comment added successfully" });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { market_id } = req.params;

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        comment_id,
        content,
        created_at,
        parent_id,
        users (
          user_id,
          username,
          display_name
        )
      `)
      .eq('market_id', market_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedComments = comments.map(c => ({
      id: c.comment_id,
      content: c.content,
      created_at: c.created_at,
      parent_id: c.parent_id,
      user_id: c.users.user_id,
      username: c.users.username,
      display_name: c.users.display_name
    }));

    return res.json({ success: true, comments: formattedComments });
  } catch (error) {
    console.error("Get Comments Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
