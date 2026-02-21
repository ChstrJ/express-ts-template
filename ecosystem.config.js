
module.exports = {
  apps: [
    {
      name: 'mlm-backend',
      script: './dist/server.js',
      cwd: '/var/www/mlm-backend',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'worker-default',
      script: 'src/workers/default.ts',
      interpreter: 'tsx',
      cwd: '/var/www/mlm-backend',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'worker-critical',
      script: 'src/workers/critical.ts',
      interpreter: 'tsx',
      cwd: '/var/www/mlm-backend',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'worker-batch',
      script: 'src/workers/batch.ts',
      interpreter: 'tsx',
      cwd: '/var/www/mlm-backend',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
  deploy: {
    production: {
      user: 'do-user',
      host: '159.223.50.129',
      ref: 'origin/master',
      repo: 'git@github.com:ChstrJ/mlm-backend.git',
      path: '/var/www/mlm-backend',
      'pre-deploy-local': '',
      'post-deploy':
        'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};

