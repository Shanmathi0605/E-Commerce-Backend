FROM node:20-alpine

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json* ./

# Copy shared common library
COPY packages/common ./packages/common

# Copy targeted microservice code
COPY packages/services/${SERVICE_NAME} ./packages/services/${SERVICE_NAME}

# Install dependencies
RUN npm install

WORKDIR /app/packages/services/${SERVICE_NAME}

# Standard ports exposed depending on service mappings
EXPOSE 8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010 8011 8012 8013 8014

CMD ["npm", "start"]
