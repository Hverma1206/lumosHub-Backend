import { executeCode } from "../services/piston.js";

export const runCode = async (req, res) => {
  try {
    const { language, version, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: "Language and code are required" });
    }

    const result = await executeCode(language, version, code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
