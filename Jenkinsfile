pipeline {
    agent any

    environment {
        // App settings
        APP_NAME = "expense-tracker"
        
        // This is the directory on the Linux server where the app runs
        DEPLOY_DIR = "/var/www/expense-tracker" 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Deploy Build Files') {
            steps {
                // Copy the newly pulled code from the Jenkins Workspace into the live server directory
                // Excludes node_modules to avoid overwriting them during copy
                sh """
                rsync -avz --exclude='.git' --exclude='node_modules' ./ ${DEPLOY_DIR}/
                """
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${DEPLOY_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Start / Restart Application') {
            steps {
                dir("${DEPLOY_DIR}") {
                    // Check if the app is already running in PM2. Re-start if it is, start new if it isn't.
                    sh """
                    pm2 describe ${APP_NAME} > /dev/null
                    if [ \$? -eq 0 ]; then
                        pm2 restart ${APP_NAME}
                    else
                        pm2 start server.js --name ${APP_NAME}
                    fi
                    """
                }
            }
        }
    }

    post {
        failure {
            // Utilizes the "Email Extension Plugin" if the build fails
            emailext (
                subject: "❌ Build Failed: \${env.JOB_NAME} [\${env.BUILD_NUMBER}]",
                body: """
                <h2>Jenkins Pipeline Alert</h2>
                <p>The automated deployment for <b>\${env.JOB_NAME}</b> has <b>FAILED</b>.</p>
                <p>Build Number: \${env.BUILD_NUMBER}</p>
                <p>Please check the console logs to see what caused the error by clicking the link below:</p>
                <p><a href="\${env.BUILD_URL}console">\${env.BUILD_URL}console</a></p>
                <p><i>This message was generated automatically by Jenkins.</i></p>
                """,
                mimeType: 'text/html',
                to: "your-email@example.com" // CHANGE THIS TO YOUR ACTUAL EMAIL ADDRESS
            )
        }
        success {
            echo "🚀 Deployment successfully completed to ${DEPLOY_DIR}!"
        }
    }
}
