import axios from "axios";

const PISTON_API = "https://emkc.org/api/v2/piston/execute";

export const executeCode = async (language, version = "*", code) => {
  try {
    const response = await axios.post(PISTON_API, {
      language,
      version,
      files: [{ name: `Main.${language}`, content: code }]
    });

    return response.data.run; 
  } catch (err) {
    console.error("Execution error:", err);
    
    if (err.response?.data) {
      const errorMessage = typeof err.response.data === 'object' 
        ? JSON.stringify(err.response.data)
        : err.response.data;
      throw new Error(errorMessage);
    } else {
      throw new Error(err.message || "Unknown error occurred");
    }
  }
};