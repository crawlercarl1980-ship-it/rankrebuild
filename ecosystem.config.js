module.exports = {
  apps: [{
    name: 'sitepilot',
    script: 'node_modules\\.bin\\next.cmd',
    args: 'dev',
    cwd: 'C:\\Users\\carl\\Projects\\sitepilot',
    interpreter: 'none',
    watch: false,
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};
