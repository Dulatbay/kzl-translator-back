require('dotenv').config();


// singleton
const {OpenAI} = require('openai');

console.log(process.env)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = process.env.ASSISTANT_ID;

class Assistant {
    static assistant = null
    static thread = null;

    async getAssistant() {
        if (!Assistant.assistant)
            Assistant.assistant = openai.beta.assistants.retrieve(assistantId)
        return Assistant.assistant;
    }

    async #getThread() {
        if (!Assistant.thread)
            Assistant.thread = await openai.beta.threads.create();
        return Assistant.thread;
    }

    async sendMessage(msg, content) {
        const thread = await this.#getThread();
        const assistant = await this.getAssistant();

        console.log('Assistant fetched', assistant);
        console.log('Thread fetched', thread);

        // Create the JSON message with content and question
        const jsonMessage = {
            content: content,  // This is the file content or the content you want to send
            my_question: msg    // This is the user's question
        };

        // Now send the message with the JSON structure
        const message = await openai.beta.threads.messages.create(
            thread.id,
            {
                role: "user",
                content: JSON.stringify(jsonMessage) // Send as JSON string
            }
        );

        let run = await openai.beta.threads.runs.createAndPoll(
            thread.id,
            {
                assistant_id: assistant.id,
            }
        );

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(
                run.thread_id
            );

            return messages.data[0];
        } else {
            console.log(run);
        }
    }


    async sendMessageWithStreaming(msg, res) {
        const thread = await this.#getThread();
        const assistant = await this.getAssistant();

        console.log('Assistant fetched', assistant);
        console.log('Thread fetched', thread);

        let finalResponse = '';

        const message = await openai.beta.threads.messages.create(
            thread.id,
            {
                role: "user",
                content: msg
            }
        );

        const run = openai.beta.threads.runs.stream(thread.id, {
            assistant_id: assistant.id
        })
            .on('textDelta', (textDelta, snapshot) => {
                finalResponse += textDelta.value;
            })
            .on('end', () => {
                res.send(finalResponse);
            })
            .on('error', (err) => {
                console.error('Error while streaming:', err);
                res.status(500).send('Something went wrong while streaming!');
            });
    }
}

module.exports = Assistant;