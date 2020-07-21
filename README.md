# Connection Recommendation Engine
REST API Connection recommendation engine.

## What does this project consist of?
### 5 REST APIs:
>GET /cities - returns a list of cities with their uids.

>POST /signup - lets you sign up

>POST /login - lets you log in returning a access token along with setting a httpOnly cookie on client-side.

>PUT /update_user - lets you update an user's details and connections. (authorization header required)

>GET /get_connections - return a list of recommended connections based on the depth and cities filters sorted on the distance in ascending order for an user. (authorization header required)

## What is the tech stack used?
> Node.js

> MongoDB

> Express

### How to run this project?
> Node.js and MongoDB installations are prerequisites for this project.

> Copy and paste all the contents of mongo.queries file into your mongodb console.

> Run the command ```cp .env.sample .env``` in the root directory to create a ```.env``` file similar to the sample. Port can be set in this ```.env``` file

> Run ```npm i```

> This project uses ```nodemon``` to detect file changes. In-case you are missing that as well, ```npm i nodemon -g``` shall help.

> Run the command ```npm run dev``` in the root directory.

### Where are the APIs? Is there a postman collection?

> [Postman Collection - https://www.getpostman.com/collections/c834b8a806c352d54bfd](https://www.getpostman.com/collections/c834b8a806c352d54bfd)


### How does the GET /get_connection API work internally?

>It uses MongoDB's graphLookup and geoNear aggregation functions to return a list of recommended connections based on the depth and cities filters sorted on the distance in ascending order for an user.