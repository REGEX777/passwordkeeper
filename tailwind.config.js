/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{html,ejs}"],
  theme: {
    extend: {
      fontFamily:{
        "jet-mono": ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
