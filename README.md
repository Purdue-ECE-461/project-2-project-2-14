# Trustworthy Module Registry

We have created an application that we can store node modules. A user can interact with our system through RESTful API requests and responses. We also have a database that we can upload and download such packages using a previously implemented rating application. Our system will screen packages and test to make sure that they are trustworthy enough to be used in enterprise level projects. The project is built to be scalable, fast, efficient, and robust.




	const creators = [`Sidd Mitra`, `Devansh Rathi`, `Charles Gao`];
  
See **TrustworthyModuleRegistry_Team14.yaml** for information about our projects. Follow the steps below to access the openAPI spec:

>1. Download the *TrustworthyModuleRegistry_Team14.yaml* file
>2. Open [this website](https://editor.swagger.io/)
>3. Click File -> Import file -> Select the file mentioned above

---


Security requirements. 

Confidentiality
Only authorized users can access the packages and data.
Only authorized users can access the history of packages, when they were updated, downloaded, created, or rated. 
Only individuals authorized to access the GCP platform can see the users on the database

Integrity
Only authorized users can update, create, or delete packages. 
Only users with admin level authorizations can create or delete users.

Availability
An authorization key lasts only for 1000 requests and 10 hours mitigating DDOS attacks if a malicious party gets access to a key.
Only users with admin level access can reset the whole registry.

Authentication
Every request (except the authentication request) is authorized using their authorization key.
Only hashes of the passwords are stored in the database to protect the server in case of data leaks.
An authorization key lasts only for 1000 requests and 10 hours, in the case the key is leaked

Authorization
There are different levels of authorization and only admin level access allows a user to create or delete new users

Nonrepudiation
Package creation, rating, deletion, and updation is logged in the database.  



1/01/22
Link to up and running endpoint for REST API
https://rate8-7-44ivtqb3aa-uc.a.run.app

