const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.set('port', 3000);

app.get('/', (req, res) => {
    res.send('./public/index.html');
});

// Listen for requests
const server = app.listen(app.get('port'), function() {
    const port = server.address().port;
    console.log('Magic happens on port ' + port);
});