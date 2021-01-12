# CF-Codearena
Compete 1v1 with your friend on codeforces in real-time

Live demo: https://cf-codearena.herokuapp.com/

Developed using `Node.js, Express, and MongoDB` 

To show updates in real-time, we have used [socket.io](https://socket.io/)

Bootstrapped with [Bootstrap](https://getbootstrap.com/)  

# Description

### About
1. To use CF-Codearena, you will need to login to Codeforces and then enter with your Codeforces handle.
2. After logging in, you will need to create a new room and then share the room password with your peer with whom you want to compete.
3. A Codeforces problem link will be given according to the ratings of both users. After submitting the solution on Codeforces, press the submit button on Codearena.

### Note
* It may not work properly if you try to enter using other's CF-handle.
* If any of the users' in the room disconnects,  the room will be closed, and you will need to start again.
* Don't refresh the page after the problem link is given.

# Developement
* You need to install Node to start the developement environment. Download Node here: [Node](https://nodejs.org/en/)
* You need to setup a .env file in the root of the repository. The template for the same is as following:
```
JWT_key = #your secret key for jwt authentication
MONGOURI = #mongoDB atlas link of your database
```
* Run

```
npm i
npm start
```
