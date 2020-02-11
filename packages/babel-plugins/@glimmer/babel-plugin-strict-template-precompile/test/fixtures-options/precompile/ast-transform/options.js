// babel-plugin-test only supports options as an options.json file,
// so we have to manually pass this through to our fixture.

const precompileOptions = {
  meta: {},
  plugins: {
    ast: [
      () => {
        return {
          name: 'remove-bad-helper',
          visitor: {
            MustacheStatement(node) {
              if (node.path.original == 'bad') {
                return null;
              }
            },
          },
        };
      },
    ],
  },
  mode: 'precompile',
};

export default {
  precompile: precompileOptions,
};
