pipeline {
    agent any

    environment {
        // App settings
        APP_NAME = "expense-tracker"
        
        // This is the directory on the Linux server where the app runs
        DEPLOY_DIR = "/var/www/expense-tracker" 
        
        // Define your repository details for Git Revert
        REPO_URL = 'github.com/TheMalikFaheem/expense--tracker.git'
        BRANCH = 'main'
        
        // The ID of your GitHub Personal Access Token saved in Jenkins Credentials
        // PLEASE VERIFY or create 'github-token-cred-id' in Manage Jenkins -> Credentials
        GIT_CREDS_ID = 'github-token-cred-id' 
    }

    stages {
        stage('Checkout') {
            steps {
                // CRITICAL: Jenkins normally checks out a "detached HEAD" (just a commit hash). 
                // You cannot push from a detached HEAD. This block forces Jenkins 
                // to actually checkout the 'main' branch so it can push later.
                checkout([
                    $class: 'GitSCM', 
                    branches: [[name: "*/${BRANCH}"]], 
                    extensions: [[$class: 'LocalBranch', localBranch: "${BRANCH}"]], 
                    userRemoteConfigs: [[credentialsId: "${GIT_CREDS_ID}", url: "https://${REPO_URL}"]]
                ])
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
                echo "🚨 Build failed! Initiating safe Git Revert..."

                // Inject the Git credentials safely
                withCredentials([usernamePassword(credentialsId: "${GIT_CREDS_ID}", passwordVariable: 'GIT_PASS', usernameVariable: 'GIT_USER')]) {
                    sh """
                        # 1. Configure the Jenkins Bot Identity
                        git config user.name "Jenkins Auto-Rollback Bot"
                        git config user.email "jenkins@mfatools.one"
                        
                        # 2. INFINITE LOOP PROTECTION 
                        # Check who made the last commit. If Jenkins made it, DO NOT revert again.
                        LAST_AUTHOR=\$(git log -1 --pretty=format:'%an')
                        if [ "\$LAST_AUTHOR" = "Jenkins Auto-Rollback Bot" ]; then
                            echo "❌ ERROR: The last commit was already a rollback."
                            echo "Aborting revert to prevent an infinite loop. Manual fix required!"
                            exit 1
                        fi
                        
                        # 3. Perform the Revert
                        # Undo the last commit without prompting for a message
                        echo "Reverting the last commit..."
                        git revert HEAD --no-edit
                        
                        # 4. Push the new "Undo" commit back to GitHub
                        echo "Pushing revert back to ${BRANCH}..."
                        git push https://${GIT_USER}:${GIT_PASS}@${REPO_URL} ${BRANCH}
                    """
                }
                echo "✅ Revert pushed! A new recovery build should trigger immediately."
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
