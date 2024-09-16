# S3ver

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)
10. [Contact](#contact)

## Project Overview

S3ver is an innovative deployment service that streamlines the process of deploying web applications from GitHub repositories to Amazon S3. It offers developers a seamless workflow for quick deployment and hosting of React projects.

### How It Works
1. User provides a GitHub URL of their React project.
2. S3ver downloads the content and uploads it to Amazon S3.
3. The project is then built and stored back in S3.
4. Users can access their deployed website through a provided URL.

## Features
- Direct deployment from GitHub to S3
- Automated build process
- Easy-to-use web interface
- Scalable microservices architecture

## Architecture

S3ver consists of four main components:

1. **Frontend**: User interface for inputting GitHub URLs and initiating deployments.
2. **S3ver-upload-service**: Handles downloading from GitHub and uploading to S3.
3. **S3ver-deploy-service**: Manages the building process of uploaded projects.
4. **S3ver-request-handler**: Serves deployed websites to end-users.

## Prerequisites
- Node.js (version 14 or later)
- npm (usually comes with Node.js)
- An AWS account with S3 and SQS permissions
- AWS IAM user credentials (Access Key and Secret Key)

## Installation

Follow these steps to set up S3ver :

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/S3ver.git
   cd S3ver
   ```

2. Install dependencies and build each component:

   a. Frontend
   ```
   cd frontend
   npm install
   ```

   b. S3ver-upload-service
   ```
   cd ../S3ver-upload-service
   npm install

   ```

   c. S3ver-deploy-service
   ```
   cd ../S3ver-deploy-service
   npm install
   ```

   d. S3ver-request-handler
   ```
   cd ../S3ver-request-handler
   npm install
   ```

## Configuration

1. AWS Setup:
   - Create an IAM user with S3 and SQS permissions.
   - Create an S3 bucket for storing deployed websites.
   - Set up an SQS queue for managing deployment tasks.

2. Environment Variables:
   In each service directory (except frontend), create a `.env` file with the following content:
   ```
   ACCESS_KEY=your_aws_access_key
   SECRET_KEY=your_aws_secret_key
   ```

## Usage

1. Start each service:

   a. Frontend
   ```
   cd frontend
   tsc -b
   npm run dev
   ```

   b. S3ver-upload-service
   ```
   cd ../S3ver-upload-service
   tsc -b
   node dist/index.js
   ```

   c. S3ver-deploy-service
   ```
   cd ../S3ver-deploy-service
   tsc -b
   node dist/index.js
   ```

   d. S3ver-request-handler
   ```
   cd ../S3ver-request-handler
   tsc -b
   node dist/index.js
   ```

2. Open a web browser and navigate to `http://localhost:5173/`
3. Enter the GitHub URL of your React project.
4. Click "Deploy" and wait for the process to complete.
5. Access your deployed website using the provided URL.

## Troubleshooting

If you encounter issues:
1. Verify all environment variables are correctly set.
2. Ensure AWS permissions are properly configured.
3. Check that all services are running and can communicate with each other.
4. Review AWS CloudWatch logs for any error messages.
5. Confirm your GitHub repository is public or you have proper authentication set up.

## Contributing

I welcome contributions to S3ver! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and test thoroughly.
4. Submit a pull request with a clear description of your changes.

Please adhere to the existing code style and include appropriate tests for new features.

## Contact

For questions, feedback, or support, please contact therishabhsharma03@gmail.com .

Thank you for using S3ver!
