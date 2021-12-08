FROM node:16

WORKDIR /app

COPY package*.json ./ 

RUN npm install
RUN npm install express-generator -g


RUN apt-get update || : && apt-get install python -y
RUN apt-get install python3-pip -y


COPY requirements.txt requirements.txt

# install dependencies to the local user directory (eg. /root/.local)
RUN pip3 install --user -r requirements.txt


ENV PORT=8080

EXPOSE 8080

#requests==2.26.0
#numpy==1.19.5
#coverage==6.0



COPY . .

CMD ["npm", "start"]
#CMD ["node", "server.js"]