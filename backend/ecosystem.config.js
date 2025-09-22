module.exports = {
  apps : [{
    name: 'saviskar-api',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      AWS_REGION: 'ap-south-1',
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      SES_SOURCE_EMAIL: 'donotreply@saviskar.co.in'
    }
  }]
};
