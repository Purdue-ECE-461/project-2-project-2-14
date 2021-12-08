FROM node:12

WORKDIR /app

COPY package*.json ./ 

RUN npm install
RUN npm install express-generator -g


RUN apt-get update && \
    apt-get install -y python3 && \
    rm -rf /var/lib/apt/lists/*


COPY . .

CMD ["node", "server.js"]