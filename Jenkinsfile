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
                sh "rsync -avz --exclude='.git' --exclude='node_modules' ./ ${env.DEPLOY_DIR}/"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh """
                cd ${env.DEPLOY_DIR}
                npm install
                """
            }
        }

        stage('Start / Restart Application') {
            steps {
                sh """
                cd ${env.DEPLOY_DIR}
                pm2 describe ${env.APP_NAME} > /dev/null
                if [ \$? -eq 0 ]; then
                    pm2 restart ${env.APP_NAME}
                else
                    pm2 start server.js --name ${env.APP_NAME}
                fi
                """
            }
        }
    }

    post {
        failure {
            // Utilizes the "Email Extension Plugin" if the build fails
            // Using single quotes so the Token Macro Plugin handles variables
            emailext (
                subject: '❌ Build Failed: $JOB_NAME [$BUILD_NUMBER]',
                body: '''
                <h2>Jenkins Pipeline Alert</h2>
                <p>The automated deployment for <b>$JOB_NAME</b> has <b>FAILED</b>.</p>
                <p>Build Number: $BUILD_NUMBER</p>
                <p>Please check the console logs to see what caused the error by clicking the link below:</p>
                <p><a href="$BUILD_URL/console">$BUILD_URL/console</a></p>
                <p><i>This message was generated automatically by Jenkins.</i></p>
                ''',
                mimeType: 'text/html',
                to: "your-email@example.com"
            )
        }
        success {
            echo "🚀 Deployment successfully completed to ${env.DEPLOY_DIR}!"
        }
    }
}
