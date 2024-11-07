const express = require('express');
const setupSocketIO = require('./socket-io');

const app = express();

app.get('/', (req, res) => {
    res.send('Tactix Backend');
})

const port = process.env.PORT || 80;
const server = app.listen(port, error => {
    if (error) console.log(error.message);
    else console.log("Server started successfully at Port: ", port);
});

setupSocketIO(server);