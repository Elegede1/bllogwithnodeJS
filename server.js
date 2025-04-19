const http = require('http')
const fs = require('fs');
const _ = require('lodash');

const server = http.createServer((req, res) => {

    //lodash example
    const num = _.random(0, 20); // generate a random number between 0 and 20
    console.log(num);
    console.log(_); // log the lodash object

    const greet = _.once(() => { // create a function that can only be called once
        console.log("Hello, World!");
    });
    greet();
    greet(); // this will not log "Hello, World!" again
    // console.log(req.url, req.method); // log the request url and method

    //set header content type
    res.setHeader('Content-Type', 'text/html');

    //send an html file
    let path = './views/';
    switch (req.url) { // switch statement to handle different routes
        case '/': // root route
            path += 'index.html';
            res.statusCode = 200;
            break;
        case '/about': // about route
            path += 'about.html';
            res.statusCode = 200;
            break;
        case '/about-me': // about-me route
            res.statusCode = 301; // redirect
            res.setHeader('Location', '/about'); // set the location header to redirect to about page
            res.end(); // end the response
            return;
        default:
            path += '404.html';
            res.statusCode = 404;
            break;
    }

    fs.readFile(path, (err, data) => {
        if (err) {
            console.log(err);
            res.end();
        } else {
            //res.write(data); // write to response
            res.end(data); // end the response
        }
    }
    )
});

server.listen(3000, () => {
    console.log("Server is running on port 3000")
})