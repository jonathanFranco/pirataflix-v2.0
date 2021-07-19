module.exports = {
    purge: {
      content: [
        './src/*.js',
        './src/*.jsx',
        './src/**/*.html',
        './src/**/*.jsx',
        './src/**/*.js',
        './src/**/*.ts',
        './src/**/*.tsx',
      ],
      options: {
        whitelist: ['bg-color-500']
      }
    },
    theme: {
      extend: {
        colors: {
          pirataflix: {
            dark_red:"#830908",
            clean_red:"#DB0404",
            dark: "#181818",
            clean: "#EDEDEB",
            gray:"#7B7C7C"
          },
        },
      },
    },
    variants: {
      textColor: ['responsive', 'hover', 'focus', 'group-hover'],
      opacity: ['responsive', 'hover', 'focus', 'group-hover'],
    },
    plugins: [
      require('@tailwindcss/typography'),
      require('@tailwindcss/forms'),
      require('@tailwindcss/line-clamp'),
      require('@tailwindcss/aspect-ratio'),
    ],
  
  }
