import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import logo from "./assets/logo.png";
function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState("funny");
  const [style, setStyle] = useState("casual");
  const [length, setLength] = useState("medium");
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [platform, setPlatform] = useState("instagram");
  const [keywords, setKeywords] = useState("");
  const [contentType, setContentType] = useState("auto");

  const genAI = new GoogleGenerativeAI(
    "AIzaSyBsLATz_aTIru2LRNpkflHRfZvmHojlQxw"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const detectContentType = async (image) => {
    try {
      const prompt =
        "What is the main subject of this image? Is it a person, animal, flower, object, or something else?";
      const result = await model.generateContent([prompt, image]);
      const detectedType = result.response.text().toLowerCase();
      if (detectedType.includes("person")) return "person";
      if (detectedType.includes("animal")) return "animal";
      if (detectedType.includes("flower")) return "flower";
      if (detectedType.includes("object")) return "object";
      return "other";
    } catch (error) {
      console.error("Error detecting content type:", error);
      return "other";
    }
  };

  const generateCaption = async () => {
    if (!selectedFile) {
      alert("Please select an image to continue!!");
      return;
    }

    setLoading(true);

    const reader = new FileReader();

    reader.onloadend = async () => {
      const image = {
        inlineData: {
          data: reader.result.split(",")[1],
          mimeType: selectedFile.type,
        },
      };

      let detectedContentType = contentType;
      if (contentType === "auto") {
        detectedContentType = await detectContentType(image);
      }

      let platformInstruction = "";
      switch (platform) {
        case "instagram":
          platformInstruction =
            "The caption is for Instagram. Make it engaging and visually appealing.";
          break;
        case "twitter":
          platformInstruction =
            "The caption is for Twitter. Keep it concise and within the character limit.";
          break;
        case "facebook":
          platformInstruction =
            "The caption is for Facebook. Make it engaging and suitable for a broad audience.";
          break;
        case "whatsapp":
          platformInstruction =
            "The caption is for WhatsApp. Keep it casual and fun.";
          break;
        case "linkedin":
          platformInstruction =
            "The caption is for LinkedIn. Make it professional and insightful.";
          break;
        default:
          platformInstruction = "Generate a caption.";
      }

      // Construct the prompt dynamically based on user selections
      let prompt = `Give only one ${tone} caption for the photo in a ${style} style. The photo is of a ${detectedContentType}. The caption should be ${length} in length. ${platformInstruction}`;

      // Add emojis if enabled
      if (includeEmojis) {
        prompt += " Include relevant emojis.";
      }

      // Add hashtags if enabled
      if (includeHashtags) {
        prompt += " Include relevant hashtags.";
      }

      // Add keywords if provided
      if (keywords) {
        prompt += ` Include these keywords: ${keywords}.`;
      }

      try {
        const result = await model.generateContent([prompt, image]);
        let generatedText = result.response.text();

        // Remove everything before the colon (:) symbol
        const colonIndex = generatedText.indexOf(":");
        if (colonIndex !== -1) {
          generatedText = generatedText.slice(colonIndex + 1).trim();
        }

        setCaption(generatedText);
        setErrMsg("");
        setCopied(false);
      } catch (error) {
        setErrMsg("Couldn't generate caption...Please try again");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const copy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <Analytics />
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-indigo-700 to-orange-300 flex flex-col justify-center items-center p-4 relative overflow-hidden main">
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 transition-all duration-300 hover:shadow-3xl">
          <h1 className="text-4xl font-sans font-bold text-center shimmer-text">
            CaptionMe.Ai
          </h1>

          <div className="mb-6">
            <label className="block text-white mb-2">Upload Image</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center shimmer-text">
                    <svg
                      className="w-8 h-8 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <p className="text-sm text-white/50 mt-2">
                      Click to upload an image
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png"
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              {
                label: "Tone",
                value: tone,
                onChange: setTone,
                options: [
                  "funny",
                  "serious",
                  "romantic",
                  "sarcastic",
                  "humorous",
                  "sad",
                ],
              },
              {
                label: "Style",
                value: style,
                onChange: setStyle,
                options: ["casual", "formal", "poetic", "informative"],
              },
              {
                label: "Length",
                value: length,
                onChange: setLength,
                options: ["short", "medium", "long"],
              },
              {
                label: "Platform",
                value: platform,
                onChange: setPlatform,
                options: [
                  "instagram",
                  "twitter",
                  "facebook",
                  "whatsapp",
                  "linkedin",
                ],
              },
              {
                label: "Content Type",
                value: contentType,
                onChange: setContentType,
                options: [
                  "auto",
                  "person",
                  "animal",
                  "flower",
                  "object",
                  "other",
                ],
              },
            ].map(({ label, value, onChange, options }) => (
              <div key={label}>
                <label className="block text-white mb-2">{label}</label>
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-pink-400 text-white transition-colors"
                >
                  {options.map((option) => (
                    <option key={option} value={option} className="bg-gray-900">
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div>
              <label className="block text-white mb-2">Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter keywords (e.g., summer, beach)"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-pink-400 text-white transition-colors"
              />
            </div>
          </div>

          {/* Checkbox Options */}
          <div className="flex flex-col space-y-3 mb-6">
            {[
              {
                label: "Include Hashtags",
                checked: includeHashtags,
                onChange: setIncludeHashtags,
              },
              {
                label: "Include Emojis",
                checked: includeEmojis,
                onChange: setIncludeEmojis,
              },
            ].map(({ label, checked, onChange }) => (
              <label key={label} className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  className="mr-2 rounded text-pink-500 focus:ring-pink-400"
                />
                {label}
              </label>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateCaption}
            disabled={loading || !selectedFile}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </div>
            ) : (
              "GENERATE CAPTION"
            )}
          </button>

          {/* Caption Output */}
          {errMsg ? (
            <div className="mt-6 text-center">
              <h2 className="text-2xl mb-2 text-white font-semibold">Oops!</h2>
              <p className="text-white/70">{errMsg}</p>
            </div>
          ) : (
            caption && (
              <div className="mt-6 text-center bg-white/10 backdrop-blur-lg rounded-lg p-6 relative overflow-hidden">
                <div className="glow-border"></div>
                <h2 className="text-2xl mb-2 text-white font-semibold">
                  Generated Caption:
                </h2>
                <p className="text-white/80 mb-4">{caption}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    className="bg-white/10 text-white px-5 py-2 rounded-lg hover:bg-white/20 transition-colors"
                    onClick={copy}
                  >
                    {copied ? "COPIED!" : "COPY CAPTION"}
                  </button>
                  <button
                    className="bg-pink-500 text-white px-5 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                    onClick={generateCaption}
                  >
                    REGENERATE
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

export default App;
