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
      script: "npm",
      args: "start",
      cwd: "./frontend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        BUSSERZ_API_BASE: "https://data.busserz.com/v2",
        BUSSERZ_API_KEY: "Y2tqOjpuAUmjo9Gqsayc1o1KKVSfkXsq",
        BUSSERZ_SPACE_ID: "PK00001002",
        NEXT_PUBLIC_BACKEND_API_BASE: "http://localhost:4000"
      },
      out_file: "./logs/frontend-out.log",
      error_file: "./logs/frontend-err.log",
      merge_logs: true,
      time: true
    }
  ]
};
