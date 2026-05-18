module.exports = {
  apps: [
    {
      name: "certify-ltc",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      cwd: "/home/htdocs/certify-ltc",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Logging
      error_file: "/var/log/pm2/certify-ltc-error.log",
      out_file: "/var/log/pm2/certify-ltc-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Restart policy
      max_restarts: 10,
      restart_delay: 5000,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
