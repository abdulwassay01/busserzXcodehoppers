module.exports = {
  apps: [
    {
      name: "busserz-backend",
      script: "server.js",
      cwd: "./backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      },
      out_file: "./logs/backend-out.log",
      error_file: "./logs/backend-err.log",
      merge_logs: true,
      time: true
    },
    {
      name: "busserz-frontend",
      script: "npx",
      args: "serve -s out -p 3000",
      cwd: "./frontend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      out_file: "./logs/frontend-out.log",
      error_file: "./logs/frontend-err.log",
      merge_logs: true,
      time: true
    }
  ]
};
