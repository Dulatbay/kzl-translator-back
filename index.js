const express = require('express');
const cors = require('cors');
const Assistant = require("./assistant");
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors())

let assistant = new Assistant();


app.post('/translate', async (req, res) => {
    try {
        const {msg} = req.body

        const message = await assistant.sendMessage(msg)

        if (!res)
            res.status(500).send('Something went wrong');
        else {
            res.status(200).send(message);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong!');
    }
});


app.post('/translate-stream', async (req, res) => {
    try {
        const {msg} = req.body

        await assistant.sendMessageWithStreaming(msg, res)
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong!');
    }
});

app.post('/', async (req, res) => {
    try {

        res.send('hello world');
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong!');
    }
});

app.post('/assistant', async (req, res) => {
    try {

        res.send(await assistant.getAssistant());
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong!');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});