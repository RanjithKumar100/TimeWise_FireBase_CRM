module.exports = {
  apps: [{
    name: 'timewise',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 9002 -H 0.0.0.0',
    cwd: 'C:\\Users\\TRG\\Documents\\LOF-CS\\TimeWise_FireBase_CRM',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '9002',
      HOST: '0.0.0.0'
    },
    error_file: 'C:\\Users\\TRG\\.pm2\\logs\\timewise-error.log',
    out_file: 'C:\\Users\\TRG\\.pm2\\logs\\timewise-out.log',
    log_file: 'C:\\Users\\TRG\\.pm2\\logs\\timewise-combined.log',
    time: true
  }]
}
