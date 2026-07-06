import { supabase } from "../utils/supabase.js";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, display_name, password } = req.body;

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          display_name,
          password_hash,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: "Signup successful",
      user: {
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};