/**
 * PM2 Ecosystem Configuration - Frontend
 */
module.exports = {
  apps: [
    {
      name: 'drone-frontend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/app/logs/pm2-error.log',
      out_file: '/app/logs/pm2-out.log',
      merge_logs: true,
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
