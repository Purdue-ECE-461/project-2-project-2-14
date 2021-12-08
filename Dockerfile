FROM beevelop/nodejs-python:latest

WORKDIR /app

COPY package*.json ./ 

RUN npm install
RUN npm install express-generator -g

RUN apt-get update && apt-get install -y --no-install-recommends apt-utils
RUN apt-get update || : && apt-get install python -y
RUN apt-get install python3-pip -y

RUN apt-get install -y p7zip \
    zip \
    unzip 

COPY requirements.txt requirements.txt

# install dependencies to the local user directory (eg. /root/.local)
RUN pip3 install --user -r requirements.txt
#RUN pip3 install requests
#RUN pip3 install numpy
#RUN pip3 install coverage

#ENV PORT=8080

#EXPOSE 8080

#requests==2.26.0
#numpy==1.19.5
#coverage==6.0



COPY . .

CMD ["npm", "start"]
#CMD ["node", "server.js"]