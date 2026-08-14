// tailwind.config.js
module.exports = {
    darkMode: 'class', // <--- 加上這一行，才能透過 class 手動切換深淺色
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }