const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.resolve(__dirname, '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^['"](.*)['"]$/, '$1');
      envVars[key] = value;
      process.env[key] = value;
    }
  });
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      function ({ types: t }) {
        return {
          visitor: {
            MemberExpression(p) {
              if (
                p.node.object &&
                p.node.object.type === 'MemberExpression' &&
                p.node.object.object &&
                p.node.object.object.name === 'process' &&
                p.node.object.property.name === 'env'
              ) {
                const key = p.node.property.name;
                if (envVars[key] !== undefined) {
                  p.replaceWith(t.stringLiteral(envVars[key]));
                }
              }
            },
          },
        };
      },
    ],
  ],
};
