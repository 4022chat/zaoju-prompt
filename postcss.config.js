export default {
  plugins: {
    autoprefixer: {},
    cssnano: {
      preset: [
        'default',
        {
          discardDuplicates: false,
          mergeLonghand: false,
        },
      ],
    },
  },
};
