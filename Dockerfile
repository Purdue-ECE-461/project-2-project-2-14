FROM node:16


WORKDIR /myapp
COPY . .

#COPY package*.json ./ 

RUN npm install
RUN npm install express-generator -g


RUN apt-get update
RUN apt-get install python3-pip -y

RUN apt-get install -y p7zip \
    zip \
    unzip 

RUN apt-get install python -y
RUN apt-get install python3-pip -y
COPY requirements.txt requirements.txt

# install dependencies to the local user directory (eg. /root/.local)
WORKDIR /myapp/rating/src/
#RUN pip3 install --user -r requirements.txt
RUN pip3 install requests==2.26.0
RUN pip3 install numpy==1.19.5
#RUN pip3 install converage
#ENV PORT=8080
#EXPOSE 8080
#requests==2.26.0
#numpy==1.19.5
#coverage==6.0
#COPY . .
CMD ["npm", "start"]