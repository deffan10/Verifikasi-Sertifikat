module.exports = {
  apps: [
    {
      name: "verifikasi-dokumen",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/verifikasi-dokumen",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      error_file: "/var/log/pm2/verifikasi-error.log",
      out_file: "/var/log/pm2/verifikasi-out.log",
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
