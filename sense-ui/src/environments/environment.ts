export const environment = {
  production: true,
  // Base URL of the deployed API that fronts the cloud database
  // (e.g. an API Gateway URL backed by Lambda + DynamoDB, or any REST
  // service in front of RDS/Aurora). Leave empty to fall back to the
  // browser-local repository.
  apiBaseUrl: 'http://localhost:4566',
};
