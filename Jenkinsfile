pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    ansiColor('xterm')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Run backend and frontend tests')
    booleanParam(name: 'DEPLOY_WITH_DOCKER_COMPOSE', defaultValue: false, description: 'Build and deploy containers using docker compose')
  }

  environment {
    BACKEND_DIR = 'backend'
    FRONTEND_DIR = 'frontend'
    DOCKER_COMPOSE_FILE = 'docker-compose.yml'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Backend Build') {
      steps {
        dir("${env.BACKEND_DIR}") {
          sh 'chmod +x mvnw'
          sh './mvnw -B -ntp clean package -DskipTests'
          sh 'test -n "$(find target -maxdepth 1 \\( -name \"*.jar\" -o -name \"*.war\" \\) -print -quit)"'
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir("${env.FRONTEND_DIR}") {
          sh 'npm ci'
          sh 'npm run build'
          sh 'test -d dist'
        }
      }
    }

    stage('Tests') {
      when {
        expression { return params.RUN_TESTS }
      }
      parallel {
        stage('Backend Tests') {
          steps {
            dir("${env.BACKEND_DIR}") {
              sh './mvnw -B -ntp test'
            }
          }
          post {
            always {
              junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
            }
          }
        }

        stage('Frontend Tests') {
          steps {
            dir("${env.FRONTEND_DIR}") {
              sh 'npm test'
            }
          }
        }
      }
    }

    stage('Docker Compose Deploy') {
      when {
        expression { return params.DEPLOY_WITH_DOCKER_COMPOSE }
      }
      steps {
        sh "docker compose -f ${env.DOCKER_COMPOSE_FILE} build"
        sh "docker compose -f ${env.DOCKER_COMPOSE_FILE} up -d"
      }
    }
  }

  post {
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed. Check logs for details.'
    }
    always {
      archiveArtifacts artifacts: 'backend/target/*.jar, backend/target/*.war, frontend/dist/**', allowEmptyArchive: true
    }
  }
}
