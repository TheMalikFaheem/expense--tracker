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
        
        stage('Archive Build') {
            steps {
                echo "Saving artifact for potential future rollbacks..."
                // Using tar instead of zip to avoid "command not found" errors on base Linux
                sh "tar -czf build.tar.gz --exclude='.git' --exclude='node_modules' ."
                archiveArtifacts artifacts: 'build.tar.gz', followSymlinks: false
            }
        }
        
        stage('Deploy Build Files') {
            steps {
                sh "rsync -avz --exclude='.git' --exclude='node_modules' --exclude='build.tar.gz' ./ ${env.DEPLOY_DIR}/"
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
                if pm2 describe ${env.APP_NAME} > /dev/null 2>&1; then
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
            script {
                echo "🚨 DEPLOYMENT FAILED! Initiating Automated Rollback..."
                
                // 1. Find the last successful build
                def lastGoodBuild = currentBuild.previousSuccessfulBuild
                
                if (lastGoodBuild) {
                    echo "Found last successful build: #${lastGoodBuild.number}"
                    
                    try {
                        // 2. Copy the artifact from that specific old build
                        copyArtifacts(
                            projectName: env.JOB_NAME, 
                            selector: specific("${lastGoodBuild.number}"), 
                            filter: 'build.tar.gz'
                        )
                        
                        echo "Artifact retrieved. Redeploying previous stable version..."
                        
                        // 3. Extract the old artifact over the deployment directory and restart
                        sh """
                        tar -xzf build.tar.gz -C ${env.DEPLOY_DIR}/
                        cd ${env.DEPLOY_DIR}
                        npm install
                        if pm2 describe ${env.APP_NAME} > /dev/null 2>&1; then
                            pm2 restart ${env.APP_NAME}
                        else
                            pm2 start server.js --name ${env.APP_NAME}
                        fi
                        """
                        
                        echo "✅ Rollback successful. The server is running Build #${lastGoodBuild.number}."
                        
                    } catch (Exception e) {
                        // If the rollback itself fails, you have a critical system outage.
                        echo "❌ CRITICAL ERROR: The rollback also failed! Manual intervention required."
                        error("Rollback failed: ${e.getMessage()}")
                    }
                    
                } else {
                    echo "⚠️ No previous successful build found. Cannot roll back."
                }
            }

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
